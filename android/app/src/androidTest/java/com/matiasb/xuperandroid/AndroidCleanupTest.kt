package com.matiasb.xuperandroid

import android.content.Intent
import androidx.lifecycle.ViewModelProvider
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import coil3.SingletonImageLoader
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import org.json.JSONObject
import org.junit.*
import org.junit.Assert.*
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.atomic.AtomicInteger

@RunWith(AndroidJUnit4::class)
class AndroidCleanupTest {
 @get:Rule val compose=createEmptyComposeRule()
 private lateinit var scenario: ActivityScenario<MainActivity>
 private lateinit var vm: XuperViewModel
 private lateinit var app: XuperTestApplication
 private val favorite=Title("cleanup-favorite","Favorito conservado",Kind.MOVIE)
 @Before fun start() {
  app=ApplicationProvider.getApplicationContext<XuperApplication>() as XuperTestApplication
  app.catalogOverride=null
  File(app.filesDir,"hero-artwork.json").deleteRecursively()
  scenario=ActivityScenario.launch(Intent(app,MainActivity::class.java).putExtra("demo",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  scenario.onActivity {vm=ViewModelProvider(it)[XuperViewModel::class.java]}
  compose.waitUntil(60000){vm.state.value.demo&&!vm.state.value.loading&&vm.state.value.items.isNotEmpty()}
 }
 @After fun stop() {
  scenario.onActivity {vm.stopPlayer();it.clearPip()};scenario.close();app.catalogOverride=null
  File(app.filesDir,"hero-artwork.json").deleteRecursively()
  runBlocking {
   app.library.favorite(favorite,false)
   app.library.remove(Title("cleanup-progress","",Kind.SERIES));app.library.remove(Title("cleanup-active","",Kind.MOVIE))
   app.library.audio("es-419");app.library.set("font",0)
  }
 }
 @Test fun settingsCleanupRecreatesActivityAndKeepsPersonalData() {
  val title=Title("cleanup-progress","Progreso conservado",Kind.SERIES)
  val playing=Playing(title,Episode("ep-clean",2,"Episodio 2",12,1),"season-clean",Stream(emptyList()),4000)
  val vault=SessionVault(app);val installation=vault.installationId
  runBlocking {
   app.library.favorite(favorite,true);app.library.checkpoint(playing,4000,12000)
   app.insights.record(123,456);app.library.saveTitleAudio(title,"es-419","Latino")
  }
  vault.save(JSONObject().put("userToken","local-test-token"))
  File(app.filesDir,"hero-artwork.json").writeText("{}")
  File(app.filesDir,"hero-artwork.tmp").writeText("temporary")
  val oldLoader=SingletonImageLoader.get(app);val disk=oldLoader.diskCache!!
  disk.openEditor("cleanup-image")!!.let {editor->editor.metadata.toFile().writeText("cached metadata");editor.data.toFile().writeText("cached image");editor.commit()}
  assertNotNull(disk.openSnapshot("cleanup-image")?.also {it.close()})
  lateinit var old: MainActivity
  scenario.onActivity {old=it;vm.changeSetting("font",3);vm.changeAudioPreference("pt")}
  compose.onNodeWithContentDescription("Ajustes").performClick()
  compose.onNodeWithTag("settings-navigation-list").performScrollToNode(hasTestTag("settings-section-storage"))
  compose.onNodeWithTag("settings-section-storage").performClick()
  compose.onNodeWithText("Limpiar caché y reiniciar").performClick()
  compose.waitUntil(60000){!vm.cleaning.value&&vm.state.value.screen==Screen.HOME&&!vm.state.value.loading}
  compose.waitUntil(30000){
   var destroyed=false
   androidx.test.platform.app.InstrumentationRegistry.getInstrumentation().runOnMainSync {destroyed=old.isDestroyed}
   destroyed
  }
  scenario.onActivity {assertNotSame("The native Activity must be recreated",old,it)}
  compose.onNodeWithTag("catalog-heading").assertTextEquals("Películas")
  assertFalse(File(app.filesDir,"hero-artwork.json").exists());assertFalse(File(app.filesDir,"hero-artwork.tmp").exists())
  assertNotSame(oldLoader,SingletonImageLoader.get(app))
  assertNull(SingletonImageLoader.get(app).diskCache!!.openSnapshot("cleanup-image"))
  assertNull(SessionVault(app).read());assertEquals(installation,SessionVault(app).installationId)
  runBlocking {
   assertTrue(app.library.favorites.first().any {it.id==favorite.id})
   assertEquals(4000L,app.library.find(title)!!.positionMs)
   assertEquals("ep-clean",app.library.find(title)!!.episodeId)
   assertEquals(3,app.library.settings.first().font);assertEquals("pt",app.library.settings.first().audio)
   assertEquals("es-419" to "Latino",app.library.titleAudio(title))
   assertTrue(app.insights.stats.first().history.any {it.movies==123&&it.series==456})
   app.library.audio("es-419");app.library.set("font",0)
  }
 }
 @Test fun cleanupCancelsPendingPlaybackAndDoesNotRunTwice() {
  val active=Title("cleanup-active","Vídeo activo",Kind.MOVIE)
  scenario.onActivity {vm.play(active)}
  compose.waitUntil(90000){vm.player.snapshot.value.width==640&&!vm.state.value.loading}
  scenario.onActivity {vm.player.pause();vm.player.seek(4000)}
  compose.waitUntil(15000){vm.player.snapshot.value.positionMs>=3800}
  scenario.onActivity {vm.cleanTemporaryData {}}
  compose.waitUntil(60000){!vm.cleaning.value&&vm.state.value.screen==Screen.HOME&&!vm.state.value.loading}
  runBlocking {assertTrue(app.library.find(active)!!.positionMs>=3800)}
  assertNull(vm.player.player)
  val started=CompletableDeferred<Unit>();val cancelled=CompletableDeferred<Unit>();val restarts=AtomicInteger()
  app.catalogOverride=object: CatalogRepository by FixtureRepository() {
   override suspend fun resolve(title: Title,episode: Episode?,seasonId: String,maxHeight: Int,preferredAudio: String,preferredAudioName: String): Stream {
    started.complete(Unit)
    try {awaitCancellation()} finally {cancelled.complete(Unit)}
   }
  }
  scenario.onActivity {vm.play(Title("cleanup-pending","Preparación pendiente",Kind.MOVIE))}
  compose.waitUntil(30000){started.isCompleted}
  scenario.onActivity {vm.cleanTemporaryData {restarts.incrementAndGet()};vm.cleanTemporaryData {restarts.incrementAndGet()}}
  compose.waitUntil(60000){!vm.cleaning.value&&vm.state.value.screen==Screen.HOME&&!vm.state.value.loading}
  assertTrue(cancelled.isCompleted);assertEquals(1,restarts.get());assertNull(vm.player.player);assertNull(vm.state.value.playRequest)
 }
 @Test fun failedCleanupShowsErrorAndKeepsLibraryWithoutRestarting() {
  runBlocking {app.library.favorite(favorite,true)}
  // A nonempty directory at the artwork file path cannot be removed as a file.
  val blocked=File(app.filesDir,"hero-artwork.json");blocked.mkdir();File(blocked,"blocked").writeText("fixture")
  val restarts=AtomicInteger()
  scenario.onActivity {vm.settingsScreen();vm.cleanTemporaryData {restarts.incrementAndGet()}}
  compose.waitUntil(60000){!vm.cleaning.value&&vm.cleanupError.value!=null}
  assertEquals(0,restarts.get());assertEquals(Screen.SETTINGS,vm.state.value.screen)
  compose.onNodeWithText("Limpiar caché y reiniciar").assertIsDisplayed().assertIsEnabled()
  compose.onNodeWithText("No se pudo completar la limpieza.",substring=true).assertIsDisplayed()
  runBlocking {assertTrue(app.library.favorites.first().any {it.id==favorite.id})}
  blocked.deleteRecursively()
  scenario.onActivity {vm.cleanTemporaryData {restarts.incrementAndGet()}}
  compose.waitUntil(60000){!vm.cleaning.value&&vm.state.value.screen==Screen.HOME&&!vm.state.value.loading}
  assertEquals(1,restarts.get());assertNull(vm.cleanupError.value)
 }
}
