package com.matiasb.xuperandroid
import android.content.Intent
import android.os.SystemClock
import androidx.lifecycle.ViewModelProvider
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.delay
import org.junit.*
import org.junit.Assert.*
import org.junit.runner.RunWith
import java.io.IOException
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicInteger
@RunWith(AndroidJUnit4::class)
class AndroidVodFlowTest {
 @get:Rule val compose=createEmptyComposeRule()
 private lateinit var scenario: ActivityScenario<MainActivity>
 private lateinit var vm: XuperViewModel
 private lateinit var app: XuperTestApplication
 private class Backend(val failures: Int=0,val resolveDelay: Long=0,val detailDelay: Long=0): CatalogRepository by FixtureRepository() {
  val attempts=AtomicInteger();val episodes=CopyOnWriteArrayList<Episode?>();@Volatile var requestedSeason=""
  override suspend fun details(title: Title,seasonId: String): Details {
   delay(detailDelay)
   requestedSeason=seasonId
   if(title.kind==Kind.MOVIE)return Details(title.copy(synopsis="Ficha de prueba resuelta"),listOf(Episode("stray-movie-program",1,"Not an episode",12)))
   val prefix=if(seasonId=="season-2")"s2"else "s1";val season=if(prefix=="s2")2 else 1
   return Details(title,(1..3).map {Episode("$prefix-$it",it,"Episodio $it",12,season)},listOf(Season(title.id,1),Season("season-2",2)))
  }
  override suspend fun resolve(title: Title,episode: Episode?,seasonId: String,maxHeight: Int,preferredAudio: String,preferredAudioName: String): Stream {
   val attempt=attempts.incrementAndGet();episodes+=episode
   delay(resolveDelay)
   if(attempt<=failures)throw IOException("Fallo simulado al obtener el enlace")
   return FixtureRepository().resolve(title,episode,seasonId,maxHeight,preferredAudio,preferredAudioName)
  }
 }
 @Before fun start() {
  app=ApplicationProvider.getApplicationContext<XuperApplication>() as XuperTestApplication;app.catalogOverride=null
  scenario=ActivityScenario.launch(Intent(app,MainActivity::class.java).putExtra("demo",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  scenario.onActivity {vm=ViewModelProvider(it)[XuperViewModel::class.java]}
  compose.waitUntil(60000){vm.state.value.items.isNotEmpty()&&!vm.state.value.loading}
 }
 @After fun stop() {scenario.onActivity {vm.stopPlayer();it.clearPip()};scenario.close();app.catalogOverride=null}
 private fun backend(value: Backend) {app.catalogOverride=value;scenario.onActivity {vm.demo(true)};compose.waitUntil(30000){vm.state.value.items.isNotEmpty()&&!vm.state.value.loading}}
 private fun ready() {compose.waitUntil(90000){vm.state.value.playing!=null&&!vm.state.value.loading&&vm.player.snapshot.value.width==640}}
 @Test fun movieInitialFailureCanRetryWithoutLeavingPlayer() {
  val backend=Backend(failures=1);backend(backend);val title=Title("qa-retry-movie","Película: reintento",Kind.MOVIE,durationSeconds=12)
  scenario.onActivity {vm.detail(title)};compose.waitUntil(30000){!vm.state.value.loading&&vm.state.value.details!=null}
  compose.onNodeWithText("Reproducir").performClick()
  compose.waitUntil(30000){vm.state.value.error!=null}
  compose.onNodeWithText("Reintentar").assertIsEnabled().performClick();ready()
  assertEquals(2,backend.attempts.get());assertTrue(backend.episodes.all {it==null});assertNull(vm.state.value.playing!!.episode);assertNull(vm.nextEpisode())
  compose.onNodeWithText("Siguiente capítulo",substring=true).assertDoesNotExist()
 }
 @Test fun seriesNextEpisodeOpensAndBackReleasesPlayer() {
  backend(Backend());val title=Title("qa-next-series","Serie: siguiente",Kind.SERIES,durationSeconds=12)
  scenario.onActivity {vm.detail(title)};compose.waitUntil(30000){!vm.state.value.loading&&vm.state.value.details?.episodes?.size==3}
  compose.onNodeWithText("Ver episodio").performClick();ready();val first=vm.player.player
  scenario.onActivity {vm.player.seek(7500);vm.player.pause()};compose.waitUntil(15000){vm.player.snapshot.value.positionMs>=7000}
  compose.onNodeWithText("Siguiente capítulo 2",substring=true).performClick()
  compose.waitUntil(30000){vm.state.value.playing?.episode?.number==2&&vm.player.snapshot.value.width==640}
  assertNotSame(first,vm.player.player)
  scenario.onActivity {vm.back()};compose.waitUntil(15000){vm.state.value.screen==Screen.DETAILS};assertNull(vm.player.player)
 }
 @Test fun delayedSearchCannotCancelOpeningDetailsOrVideo() {
  backend(Backend(resolveDelay=700,detailDelay=700));val title=Title("qa-search-movie","Película: búsqueda",Kind.MOVIE,durationSeconds=12)
  scenario.onActivity {vm.query(Query(text="Viaje"));vm.detail(title)}
  compose.waitUntil(30000){vm.state.value.screen==Screen.DETAILS&&!vm.state.value.loading}
  SystemClock.sleep(600);assertEquals(Screen.DETAILS,vm.state.value.screen);assertEquals(title.id,vm.state.value.details?.title?.id);assertEquals("Ficha de prueba resuelta",vm.state.value.details?.title?.synopsis)
  scenario.onActivity {vm.query(Query(text="Viaje"));vm.play(title,overridePosition=0)};ready()
  assertEquals(Screen.PLAYER,vm.state.value.screen);assertNull(vm.state.value.error)
 }
 @Test fun resumeAnotherSeasonRefreshesNextEpisodeContext() {
  val backend=Backend();backend(backend);val title=Title("qa-season-series","Serie: temporada",Kind.SERIES,durationSeconds=12)
  scenario.onActivity {vm.detail(title)};compose.waitUntil(30000){vm.state.value.details!=null&&!vm.state.value.loading}
  val progress=WatchProgress(title,"s2-1",1,2,"season-2",2000,12000,System.currentTimeMillis())
  scenario.onActivity {vm.resume(progress)};ready()
  compose.waitUntil(30000){vm.nextEpisode()?.id=="s2-2"}
  assertEquals("season-2",backend.requestedSeason);assertEquals(2,vm.state.value.playing!!.episode!!.season)
 }
 @Test fun backWhileResolvingCannotStartALateVideo() {
  val backend=Backend(resolveDelay=900);backend(backend);val title=Title("qa-cancel-movie","Película: cancelar",Kind.MOVIE,durationSeconds=12)
  scenario.onActivity {vm.play(title)};compose.waitUntil(15000){backend.attempts.get()>0&&vm.state.value.loading}
  scenario.onActivity {vm.back()};SystemClock.sleep(1200)
  assertEquals(Screen.HOME,vm.state.value.screen);assertNull(vm.state.value.playing);assertNull(vm.player.player);assertFalse(vm.state.value.loading)
 }
 @Test fun backgroundDuringResolveCannotStartPlaybackAndCanRetry() {
  val backend=Backend(resolveDelay=700);backend(backend);val title=Title("qa-background-movie","Película: segundo plano",Kind.MOVIE,durationSeconds=12)
  scenario.onActivity {vm.play(title)};compose.waitUntil(15000){backend.attempts.get()>0&&vm.state.value.loading}
  scenario.onActivity {vm.background()};SystemClock.sleep(1100)
  assertNull(vm.player.player);assertNull(vm.state.value.playing);assertFalse(vm.state.value.loading)
  compose.onNodeWithText("Reintentar").assertIsEnabled().performClick();ready()
  assertEquals(2,backend.attempts.get())
 }

 @Test fun pauseAndSeekDuringRenewalArePreserved() {
  val title=Title("qa-renew-intent","Renovación",Kind.MOVIE)
  scenario.onActivity {vm.play(title)};ready()
  scenario.onActivity {
   val native=vm.player.player!!;native.stop();native.playWhenReady=true
   assertFalse(native.isPlaying);vm.player.toggle();assertFalse(native.playWhenReady)
  }
  val stream=kotlinx.coroutines.runBlocking {FixtureRepository().resolve(title)}
  val requested=kotlinx.coroutines.CompletableDeferred<Unit>();val resume=kotlinx.coroutines.CompletableDeferred<Unit>()
  scenario.onActivity {vm.player.prepare(Playing(title,stream=stream),Settings(),null,renew={requested.complete(Unit);resume.await();stream})}
  compose.waitUntil(30000){vm.player.snapshot.value.width==640}
  scenario.onActivity {assertTrue(vm.player.recoverConnection())}
  compose.waitUntil(10000){requested.isCompleted}
  scenario.onActivity {vm.player.pause();vm.player.seek(4000)}
  resume.complete(Unit)
  compose.waitUntil(30000){!vm.player.snapshot.value.loading&&vm.player.snapshot.value.positionMs>=3800}
  assertFalse(vm.player.snapshot.value.playWhenReady);assertFalse(vm.player.snapshot.value.playing)
 }
 @Test fun failedRenewalStopsSpinnerAndReleaseCancelsLateResults() {
  val title=Title("qa-renew-error","Renovación fallida",Kind.MOVIE);scenario.onActivity {vm.play(title)};ready();val stream=kotlinx.coroutines.runBlocking {FixtureRepository().resolve(title)}
  scenario.onActivity {vm.player.prepare(Playing(title,stream=stream),Settings(),null,renew={throw IOException("fixture")})}
  compose.waitUntil(30000){vm.player.snapshot.value.width==640}
  scenario.onActivity {assertTrue(vm.player.recoverConnection())}
  compose.waitUntil(10000){vm.player.snapshot.value.error!=null}
  Thread.sleep(1200)
  assertFalse(vm.player.snapshot.value.loading)
  val requested=kotlinx.coroutines.CompletableDeferred<Unit>();val resume=kotlinx.coroutines.CompletableDeferred<Unit>()
  scenario.onActivity {vm.player.prepare(Playing(title,stream=stream),Settings(),null,renew={requested.complete(Unit);resume.await();stream});assertTrue(vm.player.recoverConnection())}
  compose.waitUntil(10000){requested.isCompleted}
  scenario.onActivity {vm.player.release()};resume.complete(Unit)
  compose.waitForIdle();assertNull(vm.player.player);assertFalse(vm.player.snapshot.value.loading)
 }

}
