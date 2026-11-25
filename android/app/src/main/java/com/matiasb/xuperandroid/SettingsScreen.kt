package com.matiasb.xuperandroid

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.ui.platform.testTag
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.*
import androidx.compose.ui.focus.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.*
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.model.Choice
import kotlinx.coroutines.*

private enum class SettingsPage(val key: String,val group: String,val title: String,val description: String,val icon: ImageVector) {
 LIBRARY("library","TU CUENTA","Mi lista","Historial y favoritos",Icons.Default.GridView),
 PLAYBACK("playback","APLICACIÓN","Reproducción","Audio y subtítulos",Icons.Default.PlayCircleOutline),
 DISPLAY("display","APLICACIÓN","Pantalla","Ajuste de imagen",Icons.Default.AspectRatio),
 NETWORK("network","SISTEMA","Diagnóstico","Conexión y servidores",Icons.Default.Wifi),
 CATALOG("catalog","SISTEMA","Catálogo y portal","Conteo y actualizaciones",Icons.Default.Collections),
 STORAGE("storage","SISTEMA","Almacenamiento","Caché temporal",Icons.Default.Storage),
 ABOUT("about","SISTEMA","Acerca de","Versión e información",Icons.Default.Info)
}

/** Mirrors the shared Tizen/Windows sidebar and detail surfaces using native controls. */
@Composable internal fun SettingsScreen(vm: XuperViewModel,settings: Settings,demo: Boolean,tv: Boolean) {
 var selectedKey by rememberSaveable {mutableStateOf(if(vm.cleanupError.value!=null)SettingsPage.STORAGE.key else SettingsPage.PLAYBACK.key)}
 var opened by rememberSaveable {mutableStateOf(vm.cleanupError.value!=null)}
 val selected=SettingsPage.entries.first {it.key==selectedKey}
 val navState=rememberLazyListState();val bodyState=rememberLazyListState();val initialFocus=remember {FocusRequester()}
 var focusReady by remember(tv) {mutableStateOf(!tv)}
 val stats by vm.stats.collectAsStateWithLifecycle();val report by vm.networkReport.collectAsStateWithLifecycle();val diagnosing by vm.diagnosing.collectAsStateWithLifecycle()
 val context=LocalContext.current;val cleaning by vm.cleaning.collectAsStateWithLifecycle();val cleanupError by vm.cleanupError.collectAsStateWithLifecycle()
 fun select(page: SettingsPage) {selectedKey=page.key;opened=true}
 BoxWithConstraints(Modifier.fillMaxSize().backgroundForSettings().safeDrawingPadding()) {
  val wide=maxWidth>=840.dp&&LocalConfiguration.current.fontScale<1.6f
  BackHandler(enabled=!wide&&opened){opened=false}
  LaunchedEffect(selectedKey){bodyState.scrollToItem(0)}
  Column(Modifier.fillMaxSize().padding(horizontal=if(tv)32.dp else 16.dp)) {
   Row(Modifier.fillMaxWidth().padding(vertical=18.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
    IconButton(onClick={if(!wide&&opened)opened=false else vm.back()}) {Icon(Icons.AutoMirrored.Filled.ArrowBack,if(!wide&&opened)"Volver a Ajustes"else "Volver al catálogo")}
    Text("Ajustes",fontSize=28.sp,lineHeight=36.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.weight(1f).testTag("settings-heading"))
    if(wide)Text("XuperAndroid",fontSize=13.sp,lineHeight=17.sp,color=XuperStyle.muted)
   }
   Row(Modifier.fillMaxWidth().weight(1f).padding(bottom=20.dp),horizontalArrangement=Arrangement.spacedBy(18.dp)) {
    if(wide||!opened)Surface(Modifier.then(if(wide)Modifier.width(if(tv)260.dp else 230.dp)else Modifier.fillMaxWidth()).fillMaxHeight().testTag("settings-navigation"),shape=RoundedCornerShape(18.dp),color=XuperStyle.card,border=BorderStroke(1.dp,XuperStyle.secondary),shadowElevation=3.dp) {
     LazyColumn(modifier=Modifier.testTag("settings-navigation-list"),state=navState,contentPadding=PaddingValues(10.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
      itemsIndexed(SettingsPage.entries,key={_,page->page.key}) {index,page->
       Column {
        if(index==0||SettingsPage.entries[index-1].group!=page.group)Text(page.group,fontSize=11.sp,lineHeight=14.sp,fontWeight=FontWeight.SemiBold,letterSpacing=1.sp,color=XuperStyle.muted,modifier=Modifier.padding(start=12.dp,top=14.dp,bottom=12.dp))
        SettingsNavigationItem(page,selected==page,tv&&focusReady,if(page==selected)Modifier.focusRequester(initialFocus)else Modifier){select(page)}
       }
      }
     }
     LaunchedEffect(tv,wide){if(tv){withFrameNanos {};if(!runCatching {initialFocus.requestFocus()}.getOrDefault(false)){navState.scrollToItem(SettingsPage.entries.indexOf(selected));withFrameNanos {};runCatching {initialFocus.requestFocus()}};focusReady=true}}
    }
    if(wide||opened)Surface(Modifier.weight(1f).fillMaxHeight().testTag("settings-panel"),shape=RoundedCornerShape(18.dp),color=XuperStyle.card,border=BorderStroke(1.dp,XuperStyle.secondary),shadowElevation=3.dp) {
     if(selected==SettingsPage.LIBRARY)Box(Modifier.fillMaxSize().padding(20.dp)){FavoritesScreen(vm)}
     else LazyColumn(state=bodyState,contentPadding=PaddingValues(if(wide)24.dp else 18.dp),verticalArrangement=Arrangement.spacedBy(22.dp),modifier=Modifier.fillMaxSize().testTag("settings-content")) {
      item {Column(verticalArrangement=Arrangement.spacedBy(6.dp)){Text(selected.title,modifier=Modifier.testTag("settings-panel-title"),fontSize=24.sp,lineHeight=31.sp,fontWeight=FontWeight.SemiBold);Text(selected.description,color=XuperStyle.muted,fontSize=14.sp,lineHeight=18.sp)}}
      when(selected) {
       SettingsPage.PLAYBACK->{
        item {SettingsChoices("Audio preferido","Se prioriza entre las pistas disponibles. Tus elecciones por título tienen prioridad.",listOf(Choice("es-419","Español latino"),Choice("en","Inglés"),Choice("pt","Portugués")),settings.audio,"audio",vm::changeAudioPreference)}
        item {HorizontalDivider(color=XuperStyle.secondary)}
        item {SettingsChoices("Subtítulos","En TV en vivo comienzan desactivados.",listOf(Choice("0","Automáticos"),Choice("1","Desactivados"),Choice("2","Activados")),settings.subtitleMode.toString(),"subtitles"){vm.changeSetting("subtitles",it.toInt())}}
        item {SettingsChoices("Fuente","",listOf("Sistema","Condensada","Serif","Monoespaciada").mapIndexed {i,value->Choice(i.toString(),value)},settings.font.toString(),"font"){vm.changeSetting("font",it.toInt())}}
        item {SettingsChoices("Tamaño de subtítulos","",listOf("Normal","Grande","Pequeño").mapIndexed {i,value->Choice(i.toString(),value)},settings.fontSize.toString(),"fontSize"){vm.changeSetting("fontSize",it.toInt())}}
        item {SettingsChoices("Color de subtítulos","",listOf("Blanco","Amarillo","Cian").mapIndexed {i,value->Choice(i.toString(),value)},settings.fontColor.toString(),"fontColor"){vm.changeSetting("fontColor",it.toInt())}}
        item {SettingsInset {Text("Vista previa",color=XuperStyle.muted,fontSize=12.sp,lineHeight=16.sp);Text("Así se verán tus subtítulos",fontSize=listOf(20,25,17)[settings.fontSize.coerceIn(0,2)].sp,color=listOf(Color.White,Color.Yellow,Color.Cyan)[settings.fontColor.coerceIn(0,2)],fontFamily=listOf(androidx.compose.ui.text.font.FontFamily.SansSerif,androidx.compose.ui.text.font.FontFamily(android.graphics.Typeface.create("sans-serif-condensed",android.graphics.Typeface.NORMAL)),androidx.compose.ui.text.font.FontFamily.Serif,androidx.compose.ui.text.font.FontFamily.Monospace)[settings.font.coerceIn(0,3)],modifier=Modifier.padding(vertical=12.dp))}}
       }
       SettingsPage.DISPLAY->{
        item {SettingsChoices("Formato de pantalla","Conserva las proporciones originales con Ajustar.",listOf("Ajustar","Ampliar","Estirar").mapIndexed {i,value->Choice(i.toString(),value)},settings.videoFit.toString(),"videoFit"){vm.changeSetting("videoFit",it.toInt())}}
        item {SettingsInset {Icon(Icons.Default.AspectRatio,null,tint=XuperStyle.muted,modifier=Modifier.size(30.dp));Text("La imagen se adapta a tu pantalla",fontWeight=FontWeight.SemiBold);Text("Ampliar puede recortar los bordes. Estirar cambia las proporciones.",fontSize=14.sp,lineHeight=18.sp,color=XuperStyle.muted)}}
       }
       SettingsPage.NETWORK->{
        item {Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text("Estado de conexión",fontSize=17.sp,lineHeight=22.sp,fontWeight=FontWeight.SemiBold);XuperButton(onClick=vm::diagnose,enabled=!diagnosing){Text(if(diagnosing)"Comprobando…"else "Diagnosticar")}}}
        if(diagnosing)item {LinearProgressIndicator(Modifier.fillMaxWidth())}
        if(report==null)item {SettingsInset {Icon(Icons.Default.Wifi,null,tint=XuperStyle.muted,modifier=Modifier.size(30.dp));Text("Comprueba tu conexión",fontWeight=FontWeight.SemiBold);Text("Revisa latencia, respuesta de servidores y una estimación de descarga.",fontSize=14.sp,lineHeight=18.sp,color=XuperStyle.muted)}}
        report?.let {network->
         item {SettingsMetric("Velocidad estimada",network.megabits?.let {"%.1f Mbps".format(it)}?:"No disponible",Icons.Default.Speed,network.error?:"Medición puntual con una descarga de hasta 1 MiB.")}
         item {SettingsMetric("Latencia",when(network.consistent){true->"Consistente";false->"Variable";null->"Sin datos suficientes"},Icons.Default.NetworkCheck,"Compara los servidores medidos; no es un seguimiento continuo.")}
         items(network.hosts,key={it.host}) {host->SettingsInset {
          Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp),verticalAlignment=Alignment.CenterVertically){val ok=host.status in 200..399;Icon(if(ok)Icons.Default.CheckCircle else Icons.Default.Info,null,tint=if(ok)Color(0xFF86EFAC)else Color(0xFFFCD34D),modifier=Modifier.size(22.dp));Column(Modifier.weight(1f)){Text(host.host,fontWeight=FontWeight.SemiBold,maxLines=2,overflow=TextOverflow.Ellipsis);Text(host.status?.let {"${host.elapsedMs} ms · HTTP $it"}?:"No respondió",fontSize=13.sp,lineHeight=17.sp,color=XuperStyle.muted)}}
         }}
        }
       }
       SettingsPage.CATALOG->{
        item {SettingsMetric("Títulos en el catálogo",stats.history.lastOrNull()?.let {"%,d".format(it.total)}?:"Sin conteo confirmado",Icons.Default.Collections,stats.history.lastOrNull()?.let {"Películas ${it.movies} · Series ${it.series}"}?:if(demo)"Catálogo de prueba activo"else "Se confirma al recibir los totales del portal.",confirmed=stats.history.isNotEmpty())}
        item {XuperOutlinedButton(onClick={vm.refreshStats(true)},enabled=!demo){Icon(Icons.Default.Refresh,null,Modifier.size(18.dp));Spacer(Modifier.width(8.dp));Text("Actualizar conteo")}}
        if(stats.history.isNotEmpty())item {Text("Últimos cambios",fontWeight=FontWeight.SemiBold,fontSize=17.sp,lineHeight=22.sp)}
        items(stats.history.asReversed(),key={"count:${it.at}"}) {record->SettingsInset {Text("${record.total} títulos",fontWeight=FontWeight.SemiBold);Text(java.text.DateFormat.getDateTimeInstance().format(java.util.Date(record.at)),fontSize=12.sp,lineHeight=16.sp,color=XuperStyle.muted)}}
        item {HorizontalDivider(color=XuperStyle.secondary)}
        item {SettingsInset {Text("Versión del portal",fontWeight=FontWeight.SemiBold);Text(stats.version.ifBlank {"Versión no informada"},fontSize=14.sp,lineHeight=18.sp);Text("Se revisa cada siete días cuando el portal publica este dato.",fontSize=12.sp,lineHeight=16.sp,color=XuperStyle.muted)}}
       }
       SettingsPage.STORAGE->{
        item {SettingsInset {Icon(Icons.Default.Storage,null,tint=XuperStyle.muted,modifier=Modifier.size(30.dp));Text("Caché y datos temporales",fontSize=18.sp,lineHeight=23.sp,fontWeight=FontWeight.SemiBold);Text("Limpia portadas, metadatos, búsquedas, DNS y conexiones temporales. Cierra el reproductor y reinicia la interfaz desde Películas.",fontSize=14.sp,lineHeight=18.sp,color=XuperStyle.muted);Text("Se conservan progreso, historial, favoritos, estadísticas y preferencias.",fontSize=14.sp,lineHeight=18.sp,color=XuperStyle.muted)}}
        item {XuperOutlinedButton(enabled=!cleaning,onClick={vm.cleanTemporaryData {(context as? MainActivity)?.restartAfterCleanup()}}){Icon(Icons.Default.CleaningServices,null,Modifier.size(18.dp));Spacer(Modifier.width(8.dp));Text(if(cleaning)"Limpiando…"else "Limpiar caché y reiniciar")}}
        if(cleanupError!=null)item {Text(cleanupError.orEmpty(),fontSize=14.sp,lineHeight=18.sp,color=XuperStyle.foreground)}
       }
       SettingsPage.ABOUT->{
        item {SettingsInset {Text("XuperAndroid",fontSize=24.sp,lineHeight=31.sp,fontWeight=FontWeight.SemiBold);Text("Versión ${BuildConfig.VERSION_NAME}",fontSize=14.sp,lineHeight=18.sp,color=XuperStyle.muted);Text("by Matias",color=XuperStyle.muted,fontSize=12.sp,lineHeight=16.sp);Text("Para teléfono, tablet y Android TV.",fontSize=14.sp,lineHeight=18.sp)}}
        item {Text("Imágenes de presentación",fontWeight=FontWeight.SemiBold,fontSize=17.sp,lineHeight=22.sp);Text("TMDB · This product uses the TMDB API but is not endorsed or certified by TMDB.",fontSize=12.sp,lineHeight=16.sp,color=XuperStyle.muted)}
        item {HorizontalDivider(color=XuperStyle.secondary)}
        item {Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){Column(Modifier.weight(1f)){Text("Catálogo de prueba",fontWeight=FontWeight.SemiBold);Text("Contenido local para comprobar navegación y reproducción.",fontSize=12.sp,lineHeight=16.sp,color=XuperStyle.muted)};Switch(checked=demo,onCheckedChange={vm.demo(it)})}}
       }
       SettingsPage.LIBRARY->Unit
      }
     }
    }
   }
  }
 }
}

@Composable private fun SettingsNavigationItem(page: SettingsPage,isSelected: Boolean,activateOnFocus: Boolean,modifier: Modifier,onClick: ()->Unit) {
 var focused by remember {mutableStateOf(false)}
 val color=if(focused)XuperStyle.primaryText else XuperStyle.foreground
 Surface(onClick=onClick,modifier=modifier.fillMaxWidth().heightIn(min=68.dp).testTag("settings-section-${page.key}").semantics {selected=isSelected}.onFocusChanged {focused=it.hasFocus;if(it.hasFocus&&activateOnFocus)onClick()},shape=RoundedCornerShape(12.dp),color=if(focused)XuperStyle.foreground else if(isSelected)XuperStyle.secondary else Color.Transparent,contentColor=color,border=BorderStroke(if(focused)2.dp else 1.dp,if(focused)XuperStyle.ring else Color.Transparent)) {
  Row(Modifier.padding(12.dp),horizontalArrangement=Arrangement.spacedBy(12.dp),verticalAlignment=Alignment.CenterVertically){Icon(page.icon,null,Modifier.size(22.dp));Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(4.dp)){Text(page.title,fontSize=15.sp,lineHeight=20.sp,fontWeight=FontWeight.SemiBold,maxLines=2,overflow=TextOverflow.Ellipsis);Text(page.description,fontSize=12.sp,lineHeight=16.sp,color=if(focused)Color(0xFF3F3F46)else XuperStyle.muted,maxLines=2,overflow=TextOverflow.Ellipsis)};if(!activateOnFocus)Icon(Icons.Default.ChevronRight,null,Modifier.size(18.dp))}
 }
}
@Composable private fun SettingsInset(content: @Composable ColumnScope.()->Unit) {Surface(Modifier.fillMaxWidth(),shape=RoundedCornerShape(12.dp),color=Color(0xFF19191C),border=BorderStroke(1.dp,XuperStyle.secondary)){Column(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(8.dp),content=content)}}
@Composable private fun SettingsMetric(label: String,value: String,icon: ImageVector,description: String,confirmed: Boolean=false) {SettingsInset {Row(horizontalArrangement=Arrangement.spacedBy(12.dp),verticalAlignment=Alignment.CenterVertically){Icon(icon,null,Modifier.size(24.dp),tint=XuperStyle.muted);Text(label,fontSize=14.sp,lineHeight=18.sp,color=XuperStyle.muted)};Row(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalAlignment=Alignment.CenterVertically){if(confirmed)Icon(Icons.Default.CheckCircle,null,tint=Color(0xFF86EFAC),modifier=Modifier.size(22.dp));Text(value,fontSize=25.sp,lineHeight=32.sp,fontWeight=FontWeight.SemiBold)};Text(description,fontSize=13.sp,lineHeight=17.sp,color=XuperStyle.muted)}}
@OptIn(ExperimentalLayoutApi::class)
@Composable private fun SettingsChoices(label: String,description: String,choices: List<Choice>,selectedId: String,key: String,onChoose: (String)->Unit) {
 @Composable fun options(modifier: Modifier) {FlowRow(modifier,horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){choices.forEach {choice->
  val chosen=choice.id==selectedId;var focused by remember {mutableStateOf(false)}
  XuperOutlinedButton(onClick={onChoose(choice.id)},modifier=Modifier.testTag("setting-$key-${choice.id}").semantics {selected=chosen}.onFocusChanged {focused=it.hasFocus},colors=ButtonDefaults.outlinedButtonColors(containerColor=if(chosen)XuperStyle.foreground else XuperStyle.secondary,contentColor=if(chosen)XuperStyle.primaryText else XuperStyle.foreground),border=BorderStroke(if(focused)2.dp else 1.dp,if(focused)XuperStyle.ring else if(chosen)XuperStyle.foreground else Color(0xFF3F3F46)),contentPadding=PaddingValues(horizontal=12.dp,vertical=10.dp)){Icon(Icons.Default.Check,null,Modifier.size(16.dp),tint=if(chosen)LocalContentColor.current else Color.Transparent);Spacer(Modifier.width(6.dp));Text(choice.label,fontSize=14.sp,lineHeight=18.sp,maxLines=2)}
 }}}
 BoxWithConstraints(Modifier.fillMaxWidth()) {
  @Composable fun title(modifier: Modifier) {Column(modifier,verticalArrangement=Arrangement.spacedBy(6.dp)){Text(label,fontSize=16.sp,lineHeight=21.sp,fontWeight=FontWeight.SemiBold);if(description.isNotBlank())Text(description,fontSize=12.sp,lineHeight=16.sp,color=XuperStyle.muted)}}
  if(maxWidth>=660.dp)Row(horizontalArrangement=Arrangement.spacedBy(20.dp),verticalAlignment=Alignment.Top){title(Modifier.width(160.dp));options(Modifier.weight(1f))}
  else Column(verticalArrangement=Arrangement.spacedBy(10.dp)){title(Modifier.fillMaxWidth());options(Modifier.fillMaxWidth())}
 }
}
private fun Modifier.backgroundForSettings()=this.then(Modifier.background(XuperStyle.background))
