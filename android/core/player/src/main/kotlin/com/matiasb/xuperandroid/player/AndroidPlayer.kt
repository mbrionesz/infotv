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
 private var generation=0;private var credentials=emptyMap<String,Map<String,String>>();private var manualAudio: Pair<String,String>?=null;private var audioApplied="";private var settings=Settings();private var subtitlesManual=false
 private val mutable=MutableStateFlow(PlaybackSnapshot());val snapshot: StateFlow<PlaybackSnapshot> = mutable.asStateFlow()
 val player: ExoPlayer? get()=engine
 fun prepare(playing: Playing,preferences: Settings,preferredAudio: Pair<String,String>?) {
  release();generation++;val run=generation;active=playing;sourceIndex=0;settings=preferences;manualAudio=preferredAudio;audioApplied="";subtitlesManual=false
  val lowRam=(context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).isLowRamDevice
  val requestCredentials=playing.stream.sources.filter { it.url.startsWith("http") }.associate { OriginCredentials.origin(it.url.toHttpUrl()) to it.headers }
  val transport=http.newBuilder().callTimeout(0,java.util.concurrent.TimeUnit.MILLISECONDS).readTimeout(15,java.util.concurrent.TimeUnit.SECONDS).addInterceptor(OriginCredentials { requestCredentials }).build()
  val sources=DefaultMediaSourceFactory(DefaultDataSource.Factory(context,OkHttpDataSource.Factory(transport)))
  selector.setParameters(selector.buildUponParameters().clearOverridesOfType(C.TRACK_TYPE_AUDIO).clearOverridesOfType(C.TRACK_TYPE_TEXT).setPreferredAudioLanguages(preferences.audio,"es","spa").setTrackTypeDisabled(C.TRACK_TYPE_TEXT,true))
  val renderer=DefaultRenderersFactory(context).setEnableDecoderFallback(true)
  engine=ExoPlayer.Builder(context,renderer).setTrackSelector(selector).setMediaSourceFactory(sources).setLoadControl(DefaultLoadControl.Builder().setBufferDurationsMs(15_000,if(lowRam)30_000 else 60_000,1500,3000).setTargetBufferBytes(PlaybackPolicy.bufferBytes(lowRam)).setPrioritizeTimeOverSizeThresholds(false).build()).build().apply {
   setAudioAttributes(AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),true);setHandleAudioBecomingNoisy(true)
   addListener(object: Player.Listener {
    override fun onTracksChanged(tracks: Tracks) { if(run!=generation)return;chooseAudio(tracks);if(!subtitlesManual)automaticSubtitles(tracks);publish() }
    override fun onPlayerError(error: PlaybackException) {
     if(run!=generation)return
     val network=error.errorCode in 2000..2999
     if(network&&sourceIndex+1<playing.stream.sources.size){sourceIndex++;openSource(currentPosition,playWhenReady)}else mutable.value=mutable.value.copy(error=when(error.errorCode){PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS->"El servidor rechazó la conexión. Vuelve a intentar desde la ficha.";PlaybackException.ERROR_CODE_DECODING_FAILED,PlaybackException.ERROR_CODE_DECODER_INIT_FAILED->"El equipo no pudo decodificar este vídeo.";else->"No se pudo reproducir el vídeo (${error.errorCodeName})."},loading=false)
    }
    override fun onPlaybackStateChanged(playbackState: Int) { publish() }
   })
  }
  session=MediaSession.Builder(context,engine!!).build();openSource(playing.resumeMs,true)
  scope=CoroutineScope(SupervisorJob()+Dispatchers.Main.immediate);scope.launch { while(isActive){publish();delay(500)} }
 }
 private fun openSource(position: Long,autoplay: Boolean) {
  val current=active?:return;val source=current.stream.sources.getOrNull(sourceIndex)?:return;mutable.value=mutable.value.copy(error=null,loading=true)
  val item=MediaItem.Builder().setMediaId(current.title.id).setUri(source.url).setMediaMetadata(MediaMetadata.Builder().setTitle(current.title.name).build()).setSubtitleConfigurations(current.stream.subtitles.map { MediaItem.SubtitleConfiguration.Builder(android.net.Uri.parse(it.url)).setMimeType(it.mime).setLanguage(it.language).setLabel(it.label.ifBlank { it.language }).build() }).build()
  engine?.apply { setMediaItem(item,position.coerceAtLeast(0));prepare();playWhenReady=autoplay }
 }
 private fun groupTracks(type: Int): List<Triple<Tracks.Group,Int,Track>> = engine?.currentTracks?.groups.orEmpty().filter { it.type==type }.flatMapIndexed { groupIndex,group->(0 until group.length).filter { group.isTrackSupported(it) }.map { i->val f=group.getTrackFormat(i);Triple(group,i,Track("$type:$groupIndex:$i",f.language.orEmpty(),f.label?:f.language?:"Pista ${i+1}",group.isTrackSelected(i))) } }
 private fun chooseAudio(tracks: Tracks) {
  val available=groupTracks(C.TRACK_TYPE_AUDIO);val signature=available.joinToString { it.third.language+it.third.name };if(signature==audioApplied||available.isEmpty())return;audioApplied=signature
  val desired=manualAudio;val best=available.maxByOrNull { (_,_,track)->if(desired!=null){if(track.language==desired.first&&track.name==desired.second)1000 else if(track.language==desired.first)900 else 0}else if(settings.audio.startsWith("es"))PlaybackPolicy.audioScore(track.language,track.name)else if(track.language.startsWith(settings.audio.take(2)))100 else 0 }?:return
  if(desired!=null||settings.audio.startsWith("es")&&PlaybackPolicy.audioScore(best.third.language,best.third.name)>0||best.third.language.startsWith(settings.audio.take(2)))selector.setParameters(selector.buildUponParameters().setOverrideForType(TrackSelectionOverride(best.first.mediaTrackGroup,listOf(best.second))))
 }
 private fun automaticSubtitles(tracks: Tracks) {
  val audio=groupTracks(C.TRACK_TYPE_AUDIO).firstOrNull { it.third.selected }?.third
  val enable=settings.subtitleMode==2 || settings.subtitleMode==0&&audio!=null&&PlaybackPolicy.audioScore(audio.language,audio.name)==0
  val track=groupTracks(C.TRACK_TYPE_TEXT).maxByOrNull { PlaybackPolicy.audioScore(it.third.language,it.third.name) }
  val params=selector.buildUponParameters().setTrackTypeDisabled(C.TRACK_TYPE_TEXT,!enable||track==null)
  if(enable&&track!=null)params.setOverrideForType(TrackSelectionOverride(track.first.mediaTrackGroup,listOf(track.second)))
  if(selector.parameters!=params.build())selector.setParameters(params)
 }
 fun audio(id: String): Track? { val selected=groupTracks(C.TRACK_TYPE_AUDIO).firstOrNull { it.third.id==id }?:return null;manualAudio=selected.third.language to selected.third.name;selector.setParameters(selector.buildUponParameters().setOverrideForType(TrackSelectionOverride(selected.first.mediaTrackGroup,listOf(selected.second))));return selected.third }
 fun subtitles(id: String?) { subtitlesManual=true;val params=selector.buildUponParameters().setTrackTypeDisabled(C.TRACK_TYPE_TEXT,id==null);groupTracks(C.TRACK_TYPE_TEXT).firstOrNull { it.third.id==id }?.let { params.setOverrideForType(TrackSelectionOverride(it.first.mediaTrackGroup,listOf(it.second))) };selector.setParameters(params) }
 fun style(view: PlayerView,settings: Settings) {val font=arrayOf("sans-serif","sans-serif-condensed","serif","monospace")[settings.font.coerceIn(0,3)];val color=intArrayOf(Color.WHITE,Color.YELLOW,Color.CYAN)[settings.fontColor.coerceIn(0,2)];view.subtitleView?.apply { setApplyEmbeddedStyles(false);setStyle(CaptionStyleCompat(color,Color.TRANSPARENT,Color.TRANSPARENT,CaptionStyleCompat.EDGE_TYPE_OUTLINE,Color.BLACK,Typeface.create(font,Typeface.NORMAL)));setFractionalTextSize(floatArrayOf(.045f,.055f,.035f)[settings.fontSize.coerceIn(0,2)]) } }
 private fun publish() { val p=engine?:return;val duration=p.duration.takeIf { it>0&&it!=C.TIME_UNSET }?:active?.stream?.durationSeconds?.times(1000)?:0;mutable.value=mutable.value.copy(positionMs=p.currentPosition.coerceAtLeast(0),durationMs=duration,bufferMs=(p.bufferedPosition-p.currentPosition).coerceAtLeast(0),playing=p.isPlaying,loading=p.playbackState==Player.STATE_BUFFERING,width=p.videoSize.width,height=p.videoSize.height,fps=p.videoFormat?.frameRate?.takeIf { it>0 }?:0f,audio=groupTracks(C.TRACK_TYPE_AUDIO).map { it.third },subtitles=groupTracks(C.TRACK_TYPE_TEXT).map { it.third }) }
 fun pause() { engine?.pause() }
 fun toggle() { engine?.let { if(it.isPlaying)it.pause() else it.play() } }
 fun seek(position: Long) { val p=engine?:return;if(p.isCurrentMediaItemSeekable)p.seekTo(position.coerceIn(0,(p.duration.takeIf { it>0 }?:Long.MAX_VALUE))) }
 fun release() { generation++;scope.cancel();session?.release();session=null;engine?.release();engine=null;credentials=emptyMap();active=null;mutable.value=PlaybackSnapshot() }
}
