package com.matiasb.xuperandroid.player
import android.app.ActivityManager
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import androidx.media3.common.*
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.*
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.session.MediaSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import androidx.media3.ui.CaptionStyleCompat
import androidx.media3.ui.PlayerView
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import okhttp3.HttpUrl.Companion.toHttpUrl
@androidx.annotation.OptIn(markerClass = [UnstableApi::class])
class AndroidPlayer(private val context: Context,private val http: okhttp3.OkHttpClient) {
 private val selector=DefaultTrackSelector(context);private var scope=CoroutineScope(SupervisorJob()+Dispatchers.Main.immediate)
 private var active: Playing?=null;private var sourceIndex=0;private var engine: ExoPlayer?=null;private var session: MediaSession?=null
 private var renewer: (suspend ()->Stream)?=null;private var renewal: Job?=null;private var renewals=0;private var renewedAt=0L
 private var pendingSeek: Long?=null
 private var generation=0;private var manualAudio: Pair<String,String>?=null;private var audioApplied="";private var settings=Settings();private var subtitlesManual=false;private var manualSubtitle: Pair<String,String>?=null
 private val mutable=MutableStateFlow(PlaybackSnapshot());val snapshot: StateFlow<PlaybackSnapshot> = mutable.asStateFlow()
 val player: ExoPlayer? get()=engine
 fun prepare(playing: Playing,preferences: Settings,preferredAudio: Pair<String,String>?,renew: (suspend ()->Stream)?=null) {
  require(playing.stream.sources.isNotEmpty()) {"El portal no entregó un enlace de vídeo"}
  release();scope=CoroutineScope(SupervisorJob()+Dispatchers.Main.immediate);generation++;val run=generation;active=playing;renewer=renew;renewals=0;renewedAt=0;sourceIndex=0;settings=preferences;manualAudio=preferredAudio;audioApplied="";subtitlesManual=false;manualSubtitle=null
  val network=context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
  val cap=DataPolicy.maxHeight(network.getNetworkCapabilities(network.activeNetwork)?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR)==true,network.restrictBackgroundStatus==android.net.ConnectivityManager.RESTRICT_BACKGROUND_STATUS_ENABLED)
  val lowRam=(context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).isLowRamDevice
  selector.setParameters(selector.buildUponParameters().clearOverridesOfType(C.TRACK_TYPE_AUDIO).clearOverridesOfType(C.TRACK_TYPE_TEXT).setPreferredAudioLanguages(preferences.audio,"es","spa").setTrackTypeDisabled(C.TRACK_TYPE_TEXT,true))
  selector.setParameters(selector.buildUponParameters().setMaxVideoSize(Int.MAX_VALUE,if(cap>0)cap else Int.MAX_VALUE))
  val renderer=DefaultRenderersFactory(context).setEnableDecoderFallback(true)
  engine=ExoPlayer.Builder(context,renderer).setTrackSelector(selector).setLoadControl(DefaultLoadControl.Builder().setBufferDurationsMs(15_000,if(lowRam)30_000 else 60_000,1500,3000).setTargetBufferBytes(if(cap==480)8*1024*1024 else PlaybackPolicy.bufferBytes(lowRam)).setPrioritizeTimeOverSizeThresholds(false).build()).build().apply {
   setAudioAttributes(AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),true);setHandleAudioBecomingNoisy(true)
   addListener(object: Player.Listener {
    override fun onTracksChanged(tracks: Tracks) { if(run!=generation)return;chooseAudio(tracks);if(!subtitlesManual)automaticSubtitles(tracks) else applyManualSubtitle();publish() }
    override fun onPlayerError(error: PlaybackException) {
     if(run!=generation)return
     val status=generateSequence(error as Throwable?){it.cause}.filterIsInstance<androidx.media3.datasource.HttpDataSource.InvalidResponseCodeException>().firstOrNull()?.responseCode
     if(status in listOf(401,403,404,410)&&recoverConnection())return
     val network=error.errorCode in 2000..2999
     if(network&&sourceIndex+1<(active?.stream?.sources?.size?:0)){sourceIndex++;openSource(currentPosition,playWhenReady)}else if(!network||!recoverConnection())mutable.value=mutable.value.copy(error=when(error.errorCode){PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS->"El servidor rechazó la conexión. Vuelve a intentar desde la ficha.";PlaybackException.ERROR_CODE_DECODING_FAILED,PlaybackException.ERROR_CODE_DECODER_INIT_FAILED->"El equipo no pudo decodificar este vídeo.";else->"No se pudo reproducir el vídeo (${error.errorCodeName})."},loading=false)
    }
    override fun onPlaybackStateChanged(playbackState: Int) { publish() }
    override fun onPlayWhenReadyChanged(playWhenReady: Boolean,reason: Int) {if(run==generation)publish()}
   })
  }
  session=MediaSession.Builder(context,engine!!).build();openSource(playing.resumeMs,true)
  scope.launch { while(isActive){publish();delay(500)} }
 }
 private fun openSource(position: Long,autoplay: Boolean) {
  val current=active?:return;val source=current.stream.sources.getOrNull(sourceIndex)?:run {mutable.value=mutable.value.copy(error="No hay enlace de vídeo disponible",loading=false);return};mutable.value=mutable.value.copy(error=null,loading=true)
  try {
  audioApplied=""
  selector.setParameters(selector.buildUponParameters().clearOverridesOfType(C.TRACK_TYPE_AUDIO).clearOverridesOfType(C.TRACK_TYPE_TEXT))
  val item=MediaItem.Builder().setMediaId(current.title.id).setUri(source.url).setMimeType(current.stream.mime.takeIf {it.isNotBlank()}).setMediaMetadata(MediaMetadata.Builder().setTitle(current.title.name).build()).setSubtitleConfigurations(current.stream.subtitles.map { MediaItem.SubtitleConfiguration.Builder(android.net.Uri.parse(it.url)).setMimeType(it.mime).setLanguage(it.language).setLabel(it.label.ifBlank { it.language }).build() }).build()
  // Capture the fresh stream's credentials for this source; later renewals cannot mutate in-flight requests.
  val headers=current.stream.sources.filter {it.url.startsWith("http")}.associate {OriginCredentials.origin(it.url.toHttpUrl()) to it.headers}
  val transport=http.newBuilder().callTimeout(0,java.util.concurrent.TimeUnit.MILLISECONDS).readTimeout(15,java.util.concurrent.TimeUnit.SECONDS).addInterceptor(OriginCredentials {headers}).build()
  val media=DefaultMediaSourceFactory(DefaultDataSource.Factory(context,OkHttpDataSource.Factory(transport))).createMediaSource(item)
  engine?.apply { setMediaSource(media,position.coerceAtLeast(0));prepare();playWhenReady=autoplay }
  } catch(_: Exception) {mutable.value=mutable.value.copy(error="No se pudo preparar el enlace de vídeo. Puedes reintentar.",loading=false);engine?.stop()}
 }
 fun recoverConnection(): Boolean {
  val refresh=renewer?:return false;if(renewal?.isActive==true)return true
  if(System.currentTimeMillis()-renewedAt>60000)renewals=0
  if(renewals>=2)return false
  val old=active?:return false;val position=engine?.currentPosition?:0;val autoplay=engine?.playWhenReady?:false;val run=generation
  pendingSeek=null
  renewals++;renewedAt=System.currentTimeMillis();mutable.value=mutable.value.copy(loading=true,error=null)
  renewal=scope.launch {try {
   val fresh=withTimeout(25000){refresh()};if(run!=generation)return@launch;require(fresh.sources.isNotEmpty());active=old.copy(stream=fresh);sourceIndex=0;audioApplied=""
   val target=pendingSeek?:position;pendingSeek=null
   openSource(target,engine?.playWhenReady?:autoplay)
  }catch(error: CancellationException){if(error is TimeoutCancellationException&&run==generation)mutable.value=mutable.value.copy(loading=false,error="La renovación tardó demasiado") else throw error}
   catch(_: Exception){if(run==generation)mutable.value=mutable.value.copy(loading=false,error="No se pudo renovar la conexión del vídeo. Vuelve a intentar desde la ficha.")}}
  return true
 }
 private fun groupTracks(type: Int): List<Triple<Tracks.Group,Int,Track>> = engine?.currentTracks?.groups.orEmpty().filter { it.type==type }.flatMapIndexed { groupIndex,group->(0 until group.length).filter { group.isTrackSupported(it) }.map { i->val f=group.getTrackFormat(i);Triple(group,i,Track("$type:$groupIndex:$i",f.language.orEmpty(),f.label?:f.language?:"Pista ${i+1}",group.isTrackSelected(i))) } }
 private fun chooseAudio(tracks: Tracks) {
  val available=groupTracks(C.TRACK_TYPE_AUDIO);val signature=available.joinToString { it.first.mediaTrackGroup.hashCode().toString()+":"+it.third.language+it.third.name };if(signature==audioApplied||available.isEmpty())return;audioApplied=signature
  val desired=manualAudio;val best=available.maxByOrNull { (_,_,track)->if(desired!=null){if(track.language==desired.first&&track.name==desired.second)1000 else if(track.language==desired.first)900 else 0}else if(settings.audio.startsWith("es"))PlaybackPolicy.audioScore(track.language,track.name)else if(track.language.startsWith(settings.audio.take(2)))100 else 0 }?:return
  if(desired!=null||settings.audio.startsWith("es")&&PlaybackPolicy.audioScore(best.third.language,best.third.name)>0||best.third.language.startsWith(settings.audio.take(2)))selector.setParameters(selector.buildUponParameters().setOverrideForType(TrackSelectionOverride(best.first.mediaTrackGroup,listOf(best.second))))
 }
 private fun automaticSubtitles(tracks: Tracks) {
  val audio=groupTracks(C.TRACK_TYPE_AUDIO).firstOrNull { it.third.selected }?.third
  val enable=active?.title?.kind!=Kind.LIVE&&(settings.subtitleMode==2 || settings.subtitleMode==0&&audio!=null&&PlaybackPolicy.audioScore(audio.language,audio.name)==0)
  val track=groupTracks(C.TRACK_TYPE_TEXT).maxByOrNull { PlaybackPolicy.audioScore(it.third.language,it.third.name) }
  val params=selector.buildUponParameters().setTrackTypeDisabled(C.TRACK_TYPE_TEXT,!enable||track==null)
  if(enable&&track!=null)params.setOverrideForType(TrackSelectionOverride(track.first.mediaTrackGroup,listOf(track.second)))
  if(selector.parameters!=params.build())selector.setParameters(params)
 }
 fun audio(id: String): Track? { val selected=groupTracks(C.TRACK_TYPE_AUDIO).firstOrNull { it.third.id==id }?:return null;manualAudio=selected.third.language to selected.third.name;selector.setParameters(selector.buildUponParameters().setOverrideForType(TrackSelectionOverride(selected.first.mediaTrackGroup,listOf(selected.second))));return selected.third }
 fun subtitles(id: String?) {
  val track=groupTracks(C.TRACK_TYPE_TEXT).firstOrNull {it.third.id==id}?.third
  subtitlesManual=true;manualSubtitle=track?.let {it.language to it.name};applyManualSubtitle()
 }
 private fun applyManualSubtitle() {
  val desired=manualSubtitle
  val selected=desired?.let {wanted->groupTracks(C.TRACK_TYPE_TEXT).firstOrNull {it.third.language==wanted.first&&it.third.name==wanted.second}?:groupTracks(C.TRACK_TYPE_TEXT).firstOrNull {it.third.language==wanted.first}}
  val params=selector.buildUponParameters().clearOverridesOfType(C.TRACK_TYPE_TEXT).setTrackTypeDisabled(C.TRACK_TYPE_TEXT,selected==null)
  selected?.let {params.setOverrideForType(TrackSelectionOverride(it.first.mediaTrackGroup,listOf(it.second)))}
  if(selector.parameters!=params.build())selector.setParameters(params)
 }

 fun style(view: PlayerView,settings: Settings) {view.resizeMode=intArrayOf(androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT,androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_ZOOM,androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FILL)[settings.videoFit.coerceIn(0,2)];val font=arrayOf("sans-serif","sans-serif-condensed","serif","monospace")[settings.font.coerceIn(0,3)];val color=intArrayOf(Color.WHITE,Color.YELLOW,Color.CYAN)[settings.fontColor.coerceIn(0,2)];view.subtitleView?.apply { setApplyEmbeddedStyles(false);setStyle(CaptionStyleCompat(color,Color.TRANSPARENT,Color.TRANSPARENT,CaptionStyleCompat.EDGE_TYPE_OUTLINE,Color.BLACK,Typeface.create(font,Typeface.NORMAL)));setFractionalTextSize(floatArrayOf(.045f,.055f,.035f)[settings.fontSize.coerceIn(0,2)]) } }
 private fun publish() { val p=engine?:return;val duration=p.duration.takeIf { it>0&&it!=C.TIME_UNSET }?:active?.stream?.durationSeconds?.times(1000)?:0;mutable.value=mutable.value.copy(positionMs=p.currentPosition.coerceAtLeast(0),durationMs=duration,bufferMs=(p.bufferedPosition-p.currentPosition).coerceAtLeast(0),playing=p.isPlaying,playWhenReady=p.playWhenReady,loading=mutable.value.error==null&&(renewal?.isActive==true||p.playbackState==Player.STATE_BUFFERING),width=p.videoSize.width,height=p.videoSize.height,fps=p.videoFormat?.frameRate?.takeIf { it>0 }?:0f,audio=groupTracks(C.TRACK_TYPE_AUDIO).map { it.third },subtitles=groupTracks(C.TRACK_TYPE_TEXT).map { it.third }) }
 fun pause() { engine?.pause() }
 fun toggle() { engine?.let { if(it.playWhenReady)it.pause() else it.play() } }
 fun seek(position: Long) { val p=engine?:return;if(p.isCurrentMediaItemSeekable){val target=position.coerceIn(0,(p.duration.takeIf { it>0 }?:Long.MAX_VALUE));if(renewal?.isActive==true)pendingSeek=target;p.seekTo(target)} }
 fun release() { pendingSeek=null;generation++;renewal?.cancel();renewer=null;scope.cancel();session?.release();session=null;engine?.release();engine=null;active=null;mutable.value=PlaybackSnapshot() }
}
