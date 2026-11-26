package com.matiasb.xuperandroid
import android.os.SystemClock
import android.view.WindowManager
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.focus.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.*
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.ui.PlayerView
import com.matiasb.xuperandroid.data.Settings
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.delay
@androidx.annotation.OptIn(markerClass = [androidx.media3.common.util.UnstableApi::class])
@Composable internal fun PlayerScreen(vm: XuperViewModel,state: UiState,settings: Settings,tv: Boolean=false,pip: Boolean=false) {
 val snapshot by vm.player.snapshot.collectAsStateWithLifecycle();var controls by remember { mutableStateOf(true) };var activity by remember { mutableLongStateOf(SystemClock.uptimeMillis()) };var tracks by remember { mutableStateOf(false) };var seek by remember { mutableStateOf<Float?>(null) };val stage=remember { FocusRequester() };val playFocus=remember { FocusRequester() };val context=LocalContext.current
 LaunchedEffect(snapshot.playWhenReady,snapshot.error,snapshot.width,snapshot.height){(context as? MainActivity)?.updatePip(snapshot)}
 val playing=state.playing
 // Capture the current engine in the AndroidView callbacks: Compose may skip an
 // unchanged callback when an episode replaces the released ExoPlayer instance.
 val nativePlayer=vm.player.player
 DisposableEffect(Unit) { val window=(context as? MainActivity)?.window;window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  window?.let {androidx.core.view.WindowCompat.getInsetsController(it,it.decorView).apply {hide(androidx.core.view.WindowInsetsCompat.Type.systemBars());systemBarsBehavior=androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE}}
  onDispose {window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);window?.let {androidx.core.view.WindowCompat.getInsetsController(it,it.decorView).show(androidx.core.view.WindowInsetsCompat.Type.systemBars())}} }
 LaunchedEffect(activity,controls,tracks) { if(controls&&!tracks){delay(3000);controls=false} }
 LaunchedEffect(controls,playing?.title?.id) { if(!controls)stage.requestFocus()else if(tv&&playing!=null)playFocus.requestFocus() }
 fun touch() { controls=true;activity=SystemClock.uptimeMillis() }
 Box(Modifier.fillMaxSize().background(Color.Black).focusRequester(stage).onPreviewKeyEvent { event->
  if(event.type!=KeyEventType.KeyDown)return@onPreviewKeyEvent false
  if(!controls){when(event.key){Key.DirectionLeft->{vm.player.seek(snapshot.positionMs-10_000);touch();true};Key.DirectionRight->{vm.player.seek(snapshot.positionMs+10_000);touch();true};Key.DirectionCenter,Key.Enter->{vm.player.toggle();touch();true};Key.DirectionUp,Key.DirectionDown->{if(playing?.title?.kind==Kind.LIVE)vm.changeChannel(if(event.key==Key.DirectionUp)1 else -1);touch();true};else->false}}else {activity=SystemClock.uptimeMillis();false}
 }.focusable().pointerInput(Unit){detectTapGestures(onTap={if(controls)controls=false else touch()})}) {
  if(playing!=null)AndroidView(factory={c->PlayerView(c).apply { useController=false;player=nativePlayer;keepScreenOn=true }},onRelease={it.player=null},update={view->view.player=nativePlayer;vm.player.style(view,settings);view.subtitleView?.setBottomPaddingFraction(if(controls&&!pip).38f else .08f)},modifier=Modifier.fillMaxSize())
  if(state.loading||snapshot.loading)CircularProgressIndicator(Modifier.align(Alignment.Center),color=Color(0xFF64D9FF))
  val error=state.error?:snapshot.error
  if(error!=null&&!pip)Column(Modifier.align(Alignment.Center).fillMaxWidth(.85f).background(Color(0xE6192231)).padding(22.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {Text(error,color=Color.White);Row(horizontalArrangement=Arrangement.spacedBy(12.dp)){XuperButton(onClick=vm::retry,enabled=!state.loading&&!snapshot.loading){Text("Reintentar")};XuperOutlinedButton(onClick={vm.back()}){Text("Volver")}}}
  if(controls&&!pip)Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(Brush.verticalGradient(listOf(Color.Transparent,Color.Black.copy(alpha=.8f)))).safeDrawingPadding().padding(horizontal=20.dp,vertical=16.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
   val title=playing?.let {it.title.name+(it.episode?.takeIf {_ ->it.title.kind==Kind.SERIES}?.let {ep->" · EP. ${ep.number} · T${ep.season}"}?:"")}
    ?:state.playRequest?.let {it.title.name+(it.episode?.let {ep->" · EP. ${ep.number} · T${ep.season}"}?:"")}
    ?:"Preparando reproducción…"
   Text(title,color=Color.White,fontWeight=FontWeight.SemiBold,fontSize=19.sp,maxLines=2,overflow=TextOverflow.Ellipsis)
   Text(listOf(if(snapshot.height>0)"${snapshot.width} × ${snapshot.height}" else "",if(snapshot.fps>0)"${"%.2f".format(snapshot.fps)} FPS" else "", "Búfer ${snapshot.bufferMs/1000} s").filter { it.isNotBlank() }.joinToString(" · "),color=Color(0xFFB6C8DA),fontSize=12.sp)
   if(playing?.title?.kind!=Kind.LIVE&&snapshot.durationMs>0) {
    Slider(value=seek?:(snapshot.positionMs.toFloat()/snapshot.durationMs).coerceIn(0f,1f),onValueChange={seek=it;touch()},onValueChangeFinished={seek?.let {vm.player.seek((it*snapshot.durationMs).toLong())};seek=null;touch()},modifier=Modifier.fillMaxWidth().semantics { contentDescription="Posición de reproducción" })
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(clock(snapshot.positionMs),color=Color.White,fontSize=12.sp);Text(clock(snapshot.durationMs),color=Color.White,fontSize=12.sp)}
   }
   Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(6.dp),verticalAlignment=Alignment.CenterVertically) {
    if((context as? MainActivity)?.canUsePip()==true)IconButton(onClick={(context as MainActivity).enterMiniPlayer()}){Icon(Icons.Default.PictureInPictureAlt,"Ventana flotante",tint=Color.White)}
    IconButton(onClick={vm.back()}){Icon(Icons.AutoMirrored.Filled.ArrowBack,"Volver a la ficha",tint=Color.White)}
    IconButton(onClick={vm.player.seek(snapshot.positionMs-10_000);touch()}){Icon(Icons.Default.Replay10,"Retroceder 10 segundos",tint=Color.White)}
    FilledTonalButton(shape=XuperStyle.control,onClick={vm.player.toggle();touch()},modifier=Modifier.focusRequester(playFocus)){Icon(if(snapshot.playWhenReady)Icons.Default.Pause else Icons.Default.PlayArrow,if(snapshot.playWhenReady)"Pausar" else "Continuar")}
    IconButton(onClick={vm.player.seek(snapshot.positionMs+10_000);touch()}){Icon(Icons.Default.Forward10,"Adelantar 10 segundos",tint=Color.White)}
    XuperOutlinedButton(onClick={tracks=true;touch()}){Icon(Icons.Default.Subtitles,null);Text("Audio",fontSize=12.sp)}
   }
  }
  val next=vm.nextEpisode()
  if(!pip&&next!=null&&snapshot.positionMs>=PlaybackPolicy.nextEpisodeThreshold(snapshot.durationMs)&&!tracks)XuperButton(onClick=vm::next,modifier=Modifier.align(Alignment.CenterEnd).safeDrawingPadding().padding(20.dp)){Text("Siguiente capítulo ${next.number} ›")}
 }
 if(tracks&&!pip)AlertDialog(onDismissRequest={tracks=false;touch()},title={Text("Audio y subtítulos")},text={LazyColumn(Modifier.heightIn(max=420.dp),verticalArrangement=Arrangement.spacedBy(5.dp)) {
  item {FilterPicker("Imagen",listOf("Ajustar","Ampliar","Estirar").mapIndexed {i,s->Choice(i.toString(),s)},settings.videoFit.toString(),allowAll=false){vm.changeSetting("videoFit",it.toIntOrNull()?:0)}}
  item{Text("Idioma de audio",fontWeight=FontWeight.Bold)}
  if((playing?.stream?.portalAudio?.size?:0)>1)items(playing!!.stream.portalAudio,key={"portal-audio:${it.id}"}){track->TextButton(onClick={vm.choosePortalAudio(track)},modifier=Modifier.fillMaxWidth()){Text((if(track.selected)"✓ " else "")+languageLabel(track.language,track.name))}}
  items(if((playing?.stream?.portalAudio?.size?:0)>1&&snapshot.audio.size<=1)emptyList()else snapshot.audio,key={"audio:${it.id}"}){track->TextButton(onClick={vm.chooseAudio(track)},modifier=Modifier.fillMaxWidth()){Text((if(track.selected)"✓ " else "")+languageLabel(track.language,track.name))}}
  item{HorizontalDivider();Text("Subtítulos",fontWeight=FontWeight.Bold)}
  item{TextButton(onClick={vm.player.subtitles(null)}){Text((if(snapshot.subtitles.none {it.selected})"✓ " else "")+"Desactivados")}}
  item {HorizontalDivider();Text("Estilo de subtítulos",fontWeight=FontWeight.Bold)}
  item {FilterPicker("Fuente",listOf("Sistema","Condensada","Serif","Monoespaciada").mapIndexed { i,s->Choice(i.toString(),s) },settings.font.toString(),allowAll=false){vm.changeSetting("font",it.toIntOrNull()?:0)}}
  item {FilterPicker("Tamaño",listOf("Normal","Grande","Pequeño").mapIndexed { i,s->Choice(i.toString(),s) },settings.fontSize.toString(),allowAll=false){vm.changeSetting("fontSize",it.toIntOrNull()?:0)}}
  item {FilterPicker("Color",listOf("Blanco","Amarillo","Cian").mapIndexed { i,s->Choice(i.toString(),s) },settings.fontColor.toString(),allowAll=false){vm.changeSetting("fontColor",it.toIntOrNull()?:0)}}
  items(snapshot.subtitles,key={"sub:${it.id}"}){track->TextButton(onClick={vm.player.subtitles(track.id)},modifier=Modifier.fillMaxWidth()){Text((if(track.selected)"✓ " else "")+languageLabel(track.language,track.name))}}
 }},confirmButton={TextButton(onClick={tracks=false;touch()}){Text("Listo")}})
}
private fun clock(ms: Long): String {val seconds=ms.coerceAtLeast(0)/1000;return if(seconds>=3600)"%d:%02d:%02d".format(seconds/3600,seconds/60%60,seconds%60)else "%02d:%02d".format(seconds/60,seconds%60)}
private fun languageLabel(language: String,name: String): String {if(name.isNotBlank()&&name!=language)return name;return when(language.lowercase()){ "es-419","es-mx"->"Español latino";"es-es"->"Español (España)";"es","spa"->"Español";"en","eng"->"Inglés";"ja","jpn"->"Japonés";"ko","kor"->"Coreano";"pt","por"->"Portugués";else->name.ifBlank { language.ifBlank { "Pista sin idioma" } }}}
