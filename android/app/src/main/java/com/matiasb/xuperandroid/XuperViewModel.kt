package com.matiasb.xuperandroid
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
enum class Screen { HOME, DETAILS, SEARCH, SETTINGS, PLAYER, FAVORITES }
data class PlaybackRequest(val title: Title,val episode: Episode?=null,val resume: WatchProgress?=null,val position: Long?=null,val audio: String="",val autoplay: Boolean=true)
data class UiState(val screen: Screen=Screen.HOME,val section: Section=Section.MOVIES,val items: List<Title> = emptyList(),val columns: List<Choice> = emptyList(),val filters: Filters=Filters(),val query: Query=Query(),val page: Int=0,val hasMore: Boolean=false,val total: Int?=null,val loading: Boolean=false,val error: String?=null,val details: Details?=null,val seasonId: String="",val playing: Playing?=null,val playRequest: PlaybackRequest?=null,val demo: Boolean=false,val similar: List<Title> = emptyList())
class XuperViewModel(application: Application): AndroidViewModel(application) {
 private val app=application as XuperApplication
 val library=app.library;val player by lazy { app.player }
 private val mutable=MutableStateFlow(UiState());val state=mutable.asStateFlow()
 val history=library.progress.stateIn(viewModelScope,SharingStarted.WhileSubscribed(5000),emptyList())
 val favorites=library.favorites.stateIn(viewModelScope,SharingStarted.WhileSubscribed(5000),emptyList())
 val stats=app.insights.stats.stateIn(viewModelScope,SharingStarted.Eagerly,CatalogStats())
 val networkReport=MutableStateFlow<NetworkReport?>(null)
 val diagnosing=MutableStateFlow(false)
 private var countJob: Job?=null;private var diagnosticJob: Job?=null
 private var lastOrigins=listOf("https://ftmrmy.jdfey0cd.com","https://fuxok.nguvmqhpk.com")
 val settings=library.settings.stateIn(viewModelScope,SharingStarted.Eagerly,Settings())
 private var request: Job?=null;private var searchJob: Job?=null;private var beforePlayer=Screen.HOME
 private val repository: CatalogRepository get()=app.repository(state.value.demo)
 init { request=viewModelScope.launch { yield();reload() };viewModelScope.launch { while(isActive){delay(5000);checkpoint()} } }
 fun demo(enabled: Boolean) { countJob?.cancel();request?.cancel();mutable.value=UiState(demo=enabled,section=state.value.section);reload() }
 fun select(section: Section) { if(state.value.section==section&&state.value.screen==Screen.HOME)return;request?.cancel();searchJob?.cancel();mutable.value=UiState(section=section,demo=state.value.demo);reload() }
 fun reload() {
  request?.cancel();request=viewModelScope.launch {
   val section=state.value.section;val query=state.value.query
   mutable.update {it.copy(loading=true,error=null,page=0,items=emptyList())}
   try { withTimeout(60_000) { supervisorScope {
    val repo=withContext(Dispatchers.IO){repository}
    val categories=async(Dispatchers.IO) { try {repo.categories(section)} catch(error: CancellationException){throw error} catch(_: Exception){emptyList()} }
    val filters=async(Dispatchers.IO) { try {repo.filters(section)} catch(error: CancellationException){throw error} catch(_: Exception){Filters()} }
    val page=withContext(Dispatchers.IO){repo.browse(section,query,1)};ensureActive()
    // Render usable results immediately; optional metadata must not hold the spinner open.
    mutable.update {it.copy(items=page.items,page=page.page,hasMore=page.hasMore,total=page.reportedTotal,loading=false)}
    val loadedCategories=categories.await();val loadedFilters=filters.await();ensureActive()
    mutable.update {it.copy(columns=loadedCategories,filters=loadedFilters)}
   } };if(!state.value.demo)refreshStats()
   } catch(error: CancellationException){if(error is TimeoutCancellationException)mutable.update {it.copy(loading=false,error=if(it.items.isEmpty())message(error)else it.error)} else throw error
   } catch(error: Exception){mutable.update {it.copy(loading=false,error=message(error))}}
  }
 }
 fun more() { if(state.value.loading||!state.value.hasMore)return;request?.cancel();request=viewModelScope.launch { val old=state.value;mutable.update { it.copy(loading=true,error=null) };try { val page=repository.browse(old.section,old.query,old.page+1);ensureActive();mutable.update { it.copy(items=(it.items+page.items).distinctBy { title->title.id },page=page.page,hasMore=page.hasMore,loading=false) } }catch(error: CancellationException){if(error is TimeoutCancellationException)mutable.update { it.copy(loading=false,error=message(error)) } else throw error}catch(error: Exception){mutable.update { it.copy(loading=false,error=message(error)) }} } }
 fun category(choice: Choice) { openCategory(Query(column=choice.id)) }
 fun openCategory(query: Query) { mutable.update { it.copy(screen=Screen.SEARCH,query=query) };reload() }
 fun search() { request?.cancel();mutable.update { it.copy(screen=Screen.SEARCH,query=Query()) };reload() }
 fun query(query: Query) { mutable.update { it.copy(query=query) };searchJob?.cancel();searchJob=viewModelScope.launch { delay(350);reload() } }
 fun settingsScreen() { searchJob?.cancel();request?.cancel();mutable.update { it.copy(screen=Screen.SETTINGS,query=Query(),loading=false) } }
 fun detail(title: Title, season: String = "") {
  if (title.kind == Kind.LIVE) { play(title); return }
  searchJob?.cancel();request?.cancel()
  request = viewModelScope.launch {
   mutable.update { it.copy(screen=Screen.DETAILS, details=if(season.isBlank()) Details(title) else it.details, seasonId=season.ifBlank { title.id }, loading=true, error=null, query=Query(), similar=emptyList()) }
   try {
    val details = withTimeout(60_000){repository.details(title, season)}
    ensureActive()
    mutable.update { it.copy(details=details, loading=false) }
    val genre = details.title.genres.firstOrNull()
    if (genre != null) {
     try {
      val related = repository.browse(if(title.kind==Kind.SERIES) Section.SERIES else Section.MOVIES, Query(genre=genre), 1)
      ensureActive()
      mutable.update { it.copy(similar=related.items.filter { candidate -> candidate.id != title.id }.take(12)) }
     } catch (error: CancellationException) { throw error }
       catch (_: Exception) { /* Optional recommendations cannot invalidate the detail view. */ }
    }
   } catch (error: CancellationException) {
    if(error is TimeoutCancellationException) mutable.update { it.copy(loading=false,error=message(error)) } else throw error
   } catch (error: Exception) { ensureActive();mutable.update { it.copy(loading=false,error=message(error)) } }
  }
 }

 fun play(title: Title,episode: Episode?=null,resume: WatchProgress?=null,overridePosition: Long?=null,audioChoice: String="",autoplay: Boolean=true) {
  val previous=state.value
  if(previous.screen!=Screen.PLAYER)beforePlayer=previous.screen
  val intent=PlaybackRequest(title,episode.takeIf {title.kind==Kind.SERIES},resume,overridePosition,audioChoice,autoplay)
  searchJob?.cancel();request?.cancel()
  request=viewModelScope.launch {
   checkpoint();player.release()
   mutable.update {it.copy(screen=Screen.PLAYER,loading=true,error=null,playing=null,playRequest=intent)}
   val started=try {withTimeout(60_000) {
    val saved=resume?:library.find(title)
    val selectedEpisode=if(title.kind!=Kind.SERIES)null else intent.episode
     ?:saved?.episodeId?.takeIf {it.isNotBlank()}?.let {Episode(it,saved.episodeNumber,"Episodio ${saved.episodeNumber}",season=saved.seasonNumber)}
     ?:previous.details?.takeIf {it.title.id==title.id&&it.title.kind==Kind.SERIES}?.episodes?.firstOrNull()
    if(title.kind==Kind.SERIES&&selectedEpisode?.id.isNullOrBlank())throw java.io.IOException("Selecciona un episodio desde la ficha")
    val seasonId=saved?.seasonId?.takeIf {selectedEpisode?.id==saved.episodeId&&it.isNotBlank()}
     ?:previous.seasonId.takeIf {previous.details?.title?.id==title.id&&it.isNotBlank()}?:title.id
    val sameEpisode=title.kind==Kind.MOVIE||saved?.episodeId==selectedEpisode?.id
    val start=overridePosition?:if(saved!=null&&!saved.completed&&sameEpisode)saved.positionMs else 0
    mutable.update {it.copy(playRequest=intent.copy(episode=selectedEpisode,resume=saved,position=start))}
    val connectivity=getApplication<Application>().getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
    val cap=DataPolicy.maxHeight(connectivity.getNetworkCapabilities(connectivity.activeNetwork)?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR)==true,connectivity.restrictBackgroundStatus==android.net.ConnectivityManager.RESTRICT_BACKGROUND_STATUS_ENABLED)
    val manual=library.titleAudio(title)
    val desiredAudio=audioChoice.ifBlank {manual?.first?.takeIf {it.isNotBlank()}?:settings.value.audio.takeUnless {it=="es-419"}.orEmpty()}
    val repo=withContext(Dispatchers.IO){repository}
    val resolved=repo.resolve(title,selectedEpisode,seasonId,cap,desiredAudio,manual?.second.orEmpty())
    require(resolved.sources.isNotEmpty()) {"El portal no entregó un enlace de vídeo"}
    val stream=resolved.copy(durationSeconds=resolved.durationSeconds.takeIf {it>0}?:selectedEpisode?.durationSeconds?.takeIf {it>0}?:title.durationSeconds)
    ensureActive()
    val currentDetails=previous.details?.takeIf {it.title.id==title.id&&it.title.kind==title.kind&&previous.seasonId==seasonId}
    val playing=Playing(title,selectedEpisode,seasonId,stream,start)
    lastOrigins=stream.sources.mapNotNull {runCatching {java.net.URI(it.url).let {uri->if(uri.scheme in listOf("http","https"))"${uri.scheme}://${uri.rawAuthority}"else null}}.getOrNull()}.take(4)
    mutable.update {it.copy(playing=playing,loading=false,details=currentDetails,seasonId=seasonId)}
    val selectedAudio=if(audioChoice.isNotBlank())stream.portalAudio.firstOrNull {it.selected}?.let {it.language to it.name}?:manual else manual
    player.prepare(playing,settings.value,selectedAudio,renew={repo.resolve(title,selectedEpisode,seasonId,cap,desiredAudio,manual?.second.orEmpty())})
    if(!autoplay)player.pause()
    playing
   }} catch(error: CancellationException) {
    if(error is TimeoutCancellationException&&isActive){player.release();mutable.update {it.copy(loading=false,error=message(error))};null}else throw error
   } catch(error: Exception) {ensureActive();player.release();mutable.update {it.copy(loading=false,error=message(error))};null}
   // Details fetched for a resumed season are optional; they cannot invalidate a playing video.
   if(started!=null&&title.kind==Kind.SERIES&&state.value.details==null) {
    try {
     val details=withTimeout(25_000){repository.details(title,started.seasonId)};ensureActive()
     mutable.update {it.copy(details=details,seasonId=started.seasonId)}
    } catch(error: TimeoutCancellationException){ensureActive()}
      catch(error: CancellationException){throw error}
      catch(_: Exception){ensureActive()}
   }
  }
 }

 fun openFavorites() {searchJob?.cancel();request?.cancel();mutable.update { it.copy(screen=Screen.FAVORITES,loading=false,query=Query()) }}
 fun refreshStats(force: Boolean=false) {if(state.value.demo||countJob?.isActive==true||!force&&System.currentTimeMillis()-stats.value.checkedAt<1800000)return;countJob=viewModelScope.launch {try {withTimeout(30000){val repo=withContext(Dispatchers.IO){repository};val movies=repo.browse(Section.MOVIES,Query(),1).reportedTotal;val series=repo.browse(Section.SERIES,Query(),1).reportedTotal;if(movies!=null&&series!=null)app.insights.record(movies,series)}}catch(error: CancellationException){throw error}catch(_: Exception){} } }
 fun diagnose() {if(diagnosticJob?.isActive==true)return;diagnosticJob=viewModelScope.launch {diagnosing.value=true;try{networkReport.value=app.diagnostics.run(lastOrigins)}finally{diagnosing.value=false}}}
 fun resume(progress: WatchProgress)=play(progress.title,resume=progress)
 fun retry() {
  val current=state.value;if(current.screen!=Screen.PLAYER||current.loading)return
  val intent=current.playRequest?:return
  val at=player.snapshot.value.positionMs.takeIf {it>0}?:intent.position
  val autoplay=player.player?.playWhenReady?:intent.autoplay
  play(intent.title,intent.episode,intent.resume,at,intent.audio,autoplay)
 }
 fun changeChannel(direction: Int) {val current=state.value.playing?.title?:return;if(current.kind!=Kind.LIVE)return;val channels=state.value.items.filter {it.kind==Kind.LIVE};val index=channels.indexOfFirst {it.id==current.id};if(index>=0&&channels.isNotEmpty())play(channels[Math.floorMod(index+direction,channels.size)])}
 fun nextEpisode(): Episode? { val playing=state.value.playing?:return null;if(playing.title.kind!=Kind.SERIES)return null;val list=state.value.details?.takeIf {it.title.id==playing.title.id&&state.value.seasonId==playing.seasonId}?.episodes.orEmpty();val index=list.indexOfFirst { it.id==playing.episode?.id };return list.getOrNull(index+1).takeIf { index>=0 } }
 fun next() { val ep=nextEpisode()?:return;val title=state.value.playing?.title?:return;play(title,ep) }
 fun choosePortalAudio(track: Track) {
  val current=state.value.playing?:return
  val snapshot=player.snapshot.value
  viewModelScope.launch {library.saveTitleAudio(current.title,track.language,track.name)}
  play(current.title,current.episode,overridePosition=snapshot.positionMs,audioChoice=track.id,autoplay=snapshot.playing)
 }
 fun chooseAudio(track: Track) { val selected=player.audio(track.id)?:return;val title=state.value.playing?.title?:return;viewModelScope.launch { library.saveTitleAudio(title,selected.language,selected.name) } }
 fun favorite(title: Title) { viewModelScope.launch { library.favorite(title,favorites.value.none { it.id==title.id&&it.kind==title.kind }) } }
 fun remove(title: Title) { viewModelScope.launch { library.remove(title) } }
 fun changeAudioPreference(value: String) {viewModelScope.launch {library.audio(value)}}
 fun changeSetting(key: String,value: Int) { viewModelScope.launch { library.set(key,value) } }
 fun checkpoint() { val playing=state.value.playing?:return;val snapshot=player.snapshot.value;if(snapshot.positionMs<=0)return;viewModelScope.launch { library.checkpoint(playing,snapshot.positionMs,snapshot.durationMs) } }
 fun background() {
  checkpoint();player.pause()
  val current=state.value
  if(current.screen==Screen.PLAYER&&current.loading&&current.playing==null) {
   request?.cancel()
   mutable.update {it.copy(loading=false,error="La preparación se interrumpió al salir. Pulsa Reintentar para continuar.")}
  }
 }
 fun stopPlayer() { checkpoint();player.release() }
 fun back(): Boolean {
  val old=state.value;if(old.screen==Screen.HOME)return false
  request?.cancel();searchJob?.cancel()
  if(old.screen==Screen.PLAYER){stopPlayer();mutable.update { it.copy(screen=beforePlayer,playing=null,playRequest=null,error=null,loading=false) };return true}
  mutable.update { it.copy(screen=Screen.HOME,query=Query(),error=null,loading=false) };reload();return true
 }
 private fun message(error: Exception)=if(error is TimeoutCancellationException)"El portal tardó demasiado. Puedes reintentar." else error.message?.take(180)?:"No se pudo completar la operación"
 override fun onCleared() { player.release() }
}
