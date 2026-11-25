package com.matiasb.xuperandroid
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.SystemBarStyle
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.draw.shadow
import androidx.activity.viewModels
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.*
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.*
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.ui.PlayerView
import coil3.compose.AsyncImage
import com.matiasb.xuperandroid.data.Settings
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
private val Background=XuperStyle.background
private val Panel=XuperStyle.card
private val Accent=XuperStyle.ring
class MainActivity: ComponentActivity() {
 private val model: XuperViewModel by viewModels()
 private var pipMode by mutableStateOf(false)
 fun canUsePip()=(getSystemService(Context.UI_MODE_SERVICE) as UiModeManager).currentModeType!=Configuration.UI_MODE_TYPE_TELEVISION&&!(BuildConfig.DEBUG&&intent.getBooleanExtra("force_tv",false))&&packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)
 fun updatePip(snapshot: PlaybackSnapshot) { if(!canUsePip())return;val ratio=if(snapshot.height>0)(snapshot.width.toFloat()/snapshot.height).coerceIn(.42f,2.39f) else 16f/9f;val params=android.app.PictureInPictureParams.Builder().setAspectRatio(android.util.Rational((ratio*1000).toInt(),1000));if(android.os.Build.VERSION.SDK_INT>=31)params.setAutoEnterEnabled(!model.cleaning.value&&snapshot.playing&&model.state.value.screen==Screen.PLAYER);runCatching { setPictureInPictureParams(params.build()) } }
 fun clearPip() {if(canUsePip()&&android.os.Build.VERSION.SDK_INT>=31)runCatching {setPictureInPictureParams(android.app.PictureInPictureParams.Builder().setAutoEnterEnabled(false).build())}}
 fun restartAfterCleanup() {clearPip();if(!isFinishing&&!isDestroyed)recreate()}
 fun enterMiniPlayer(): Boolean {if(!canUsePip()||model.cleaning.value||model.state.value.screen!=Screen.PLAYER||model.state.value.playing==null)return false;if(isInPictureInPictureMode)return true;updatePip(model.player.snapshot.value);return runCatching { enterPictureInPictureMode(android.app.PictureInPictureParams.Builder().build()) }.getOrDefault(false)}
 // Android 12+ uses auto-enter; invoking the legacy hook as well can request PiP twice.
 override fun onUserLeaveHint() {super.onUserLeaveHint();if(android.os.Build.VERSION.SDK_INT<31&&model.state.value.screen==Screen.PLAYER&&model.player.snapshot.value.playing)enterMiniPlayer()}
 override fun onPictureInPictureModeChanged(active: Boolean,newConfig: Configuration) {super.onPictureInPictureModeChanged(active,newConfig);pipMode=active;if(!active&&!lifecycle.currentState.isAtLeast(androidx.lifecycle.Lifecycle.State.STARTED))model.background()}

 override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState);enableEdgeToEdge(statusBarStyle=SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),navigationBarStyle=SystemBarStyle.dark(android.graphics.Color.TRANSPARENT));setContent {
  val tv=(getSystemService(Context.UI_MODE_SERVICE) as UiModeManager).currentModeType==Configuration.UI_MODE_TYPE_TELEVISION || BuildConfig.DEBUG&&intent.getBooleanExtra("force_tv",false)
  XuperTheme { XuperApp(model,tv,pipMode) }
 };if(BuildConfig.DEBUG&&intent.getBooleanExtra("demo",false))model.demo(true) }
 override fun onStop() { if(!isChangingConfigurations&&!isInPictureInPictureMode)model.background();super.onStop() }
}
@Composable private fun XuperApp(vm: XuperViewModel,tv: Boolean,pip: Boolean=false) {
 val context=LocalContext.current;var exitAt by remember {mutableLongStateOf(0)}
 val tabFocus=remember {Section.entries.associateWith {FocusRequester()}}
 var menuFocusReady by remember(tv) {mutableStateOf(!tv)}
 val stats by vm.stats.collectAsStateWithLifecycle()
 val state by vm.state.collectAsStateWithLifecycle();val history by vm.history.collectAsStateWithLifecycle();val settings by vm.settings.collectAsStateWithLifecycle();var removing by remember { mutableStateOf<Title?>(null) }
 val cleaning by vm.cleaning.collectAsStateWithLifecycle()
 LaunchedEffect(state.screen,cleaning){if(cleaning||state.screen!=Screen.PLAYER)(context as? MainActivity)?.clearPip()}
 if(cleaning) {
  BackHandler {}
  Box(Modifier.fillMaxSize().background(Background).safeDrawingPadding(),contentAlignment=Alignment.Center) {
   Column(Modifier.padding(24.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(16.dp)) {
    CircularProgressIndicator(color=Accent)
    Text("Limpiando y reiniciando…",color=XuperStyle.foreground)
    Text("Conservamos tu progreso, favoritos y ajustes.",color=XuperStyle.muted,textAlign=androidx.compose.ui.text.style.TextAlign.Center)
   }
  }
  return
 }
 BackHandler(enabled=state.screen==Screen.HOME){val now=android.os.SystemClock.uptimeMillis();if(now-exitAt<2000){vm.stopPlayer();(context as? MainActivity)?.finish()}else{exitAt=now;android.widget.Toast.makeText(context,"Pulsa Atrás otra vez para salir",android.widget.Toast.LENGTH_SHORT).show()}}
 BackHandler(enabled=state.screen!=Screen.HOME) { vm.back() }
 if(state.screen==Screen.PLAYER) { PlayerScreen(vm,state,settings,tv,pip);return }
 if(state.screen==Screen.SETTINGS) { SettingsScreen(vm,settings,state.demo,tv);return }
 BoxWithConstraints(Modifier.fillMaxSize().background(Background).safeDrawingPadding()) {
  val horizontalPadding=if(tv)32.dp else 16.dp
  val navigationWidth=(maxWidth-horizontalPadding*2-400.dp).coerceAtMost(520.dp)
  val compact=navigationWidth<330.dp||LocalConfiguration.current.fontScale>1.35f
  Column(Modifier.fillMaxSize().padding(horizontal=if(tv)32.dp else 16.dp)) {
   // Restore the active tab before enabling navigation by focus. This also applies after playback.
   DisposableEffect(tv){onDispose {if(tv)menuFocusReady=false}}
   if(compact) {
    Row(Modifier.fillMaxWidth().padding(top=10.dp),verticalAlignment=Alignment.CenterVertically) {Brand(Modifier.weight(1f),stats);Actions(vm)}
    Box(Modifier.fillMaxWidth().padding(vertical=12.dp),contentAlignment=Alignment.Center) {
     NavigationGroup(vm,state,tv,menuFocusReady,tabFocus,Modifier.widthIn(max=520.dp).fillMaxWidth()){menuFocusReady=true}
    }
   } else Row(Modifier.fillMaxWidth().padding(vertical=8.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
    Box(Modifier.weight(1f),contentAlignment=Alignment.CenterStart){Brand(stats=stats,dense=true)}
    NavigationGroup(vm,state,tv,menuFocusReady,tabFocus,Modifier.width(navigationWidth),dense=true){menuFocusReady=true}
    Box(Modifier.weight(1f),contentAlignment=Alignment.CenterEnd){Actions(vm,dense=true)}
   }
   if(state.demo) Text("MODO DE PRUEBA · Contenido local, no es el catálogo del portal",color=Accent,fontSize=12.sp,modifier=Modifier.padding(bottom=8.dp))
   when(state.screen) {
    Screen.HOME -> CatalogHome(vm,state,history.filter { it.title.kind==state.section.kind },compact,tv,{removing=it})
    Screen.SEARCH -> SearchScreen(vm,state)
    Screen.DETAILS -> DetailScreen(vm,state)
    Screen.FAVORITES -> FavoritesScreen(vm)
    Screen.SETTINGS -> Unit
    else -> Unit
   }
  }
 }
 removing?.let { title->AlertDialog(onDismissRequest={removing=null},title={Text("Quitar de Seguir viendo")},text={Text(title.name)},confirmButton={TextButton(onClick={vm.remove(title);removing=null}){Text("Eliminar")}},dismissButton={TextButton(onClick={removing=null}){Text("Cancelar")}}) }
}
@Composable private fun Brand(modifier: Modifier=Modifier,stats: com.matiasb.xuperandroid.data.CatalogStats=com.matiasb.xuperandroid.data.CatalogStats(),dense: Boolean=false) { Row(modifier,verticalAlignment=Alignment.CenterVertically) { Icon(painterResource(R.drawable.ic_xuper),null,tint=Color.Unspecified,modifier=Modifier.size(if(dense)36.dp else 44.dp));Spacer(Modifier.width(8.dp));Column { Text("XuperAndroid",fontWeight=FontWeight.Bold,fontSize=if(dense)18.sp else 19.sp,lineHeight=24.sp);Text("by Matias",fontSize=11.sp,lineHeight=14.sp,color=XuperStyle.muted);Text(stats.history.lastOrNull()?.let {"${it.total} títulos informados"}?:"Catálogo · sin conteo",fontSize=10.sp,lineHeight=13.sp,color=XuperStyle.muted) } } }
@Composable private fun NavigationGroup(vm: XuperViewModel,state: UiState,tv: Boolean,ready: Boolean,focus: Map<Section,FocusRequester>,modifier: Modifier=Modifier,dense: Boolean=false,onFocusReady: ()->Unit) {
 val inputMode=LocalInputModeManager.current
 Surface(modifier.testTag("navigation-group"),shape=RoundedCornerShape(16.dp),color=XuperStyle.secondary,contentColor=XuperStyle.foreground,border=BorderStroke(1.dp,XuperStyle.secondary),shadowElevation=2.dp) {
  BoxWithConstraints(Modifier.padding(4.dp)) {
   // These focus targets are subcomposed during layout; request focus only after placement.
   LaunchedEffect(tv){if(tv){withFrameNanos {};inputMode.requestInputMode(InputMode.Keyboard);if(!focus.getValue(state.section).requestFocus()){withFrameNanos {};focus.getValue(state.section).requestFocus()};onFocusReady()}}
   val stacked=maxWidth<280.dp || (maxWidth<440.dp&&LocalConfiguration.current.fontScale>1.25f)
   Column(verticalArrangement=Arrangement.spacedBy(4.dp)) {
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(2.dp),verticalAlignment=Alignment.CenterVertically) {
     Section.entries.forEach { section->NavigationButton(section.label,state.section==section,{vm.select(section)},Modifier.testTag("nav-${section.name}").focusRequester(focus.getValue(section)).focusProperties {canFocus=!tv||ready||state.section==section}.weight(1f),grouped=true,dense=dense,onFocus={if(tv&&ready&&state.section!=section)vm.select(section)}) }
     if(!stacked)HeaderAction(Icons.Default.Search,"Buscar",vm::search,grouped=true,dense=dense)
    }
    if(stacked)XuperOutlinedButton(onClick=vm::search,modifier=Modifier.fillMaxWidth().testTag("header-Buscar"),colors=ButtonDefaults.outlinedButtonColors(containerColor=Color.Transparent,contentColor=XuperStyle.foreground)){Icon(Icons.Default.Search,"Buscar");Spacer(Modifier.width(8.dp));Text("Buscar")}
   }
  }
 }
}
@Composable private fun Actions(vm: XuperViewModel,dense: Boolean=false) {
 Surface(shape=XuperStyle.control,color=Panel,contentColor=XuperStyle.foreground,border=BorderStroke(1.dp,XuperStyle.secondary)) {
  Row(Modifier.padding(2.dp),horizontalArrangement=Arrangement.spacedBy(2.dp)) {
   HeaderAction(Icons.Outlined.Settings,"Ajustes",vm::settingsScreen,grouped=true,dense=dense)
  }
 }
}
@Composable private fun HeaderAction(icon: ImageVector,label: String,click: ()->Unit,grouped: Boolean=false,dense: Boolean=false) {
 var focused by remember {mutableStateOf(false)}
 Surface(onClick=click,shape=RoundedCornerShape(10.dp),color=if(focused)XuperStyle.card else if(grouped)Color.Transparent else Panel,contentColor=XuperStyle.foreground,border=BorderStroke(if(focused)2.dp else 1.dp,if(focused)XuperStyle.ring else if(grouped)Color.Transparent else XuperStyle.secondary),modifier=Modifier.size(48.dp).testTag("header-$label").onFocusChanged {focused=it.hasFocus}) {
  Box(contentAlignment=Alignment.Center){Icon(icon,label,Modifier.size(if(dense)20.dp else 23.dp))}
 }
}
@Composable private fun NavigationButton(label: String,selected: Boolean,click: ()->Unit,modifier: Modifier=Modifier,grouped: Boolean=false,dense: Boolean=false,onFocus: ()->Unit={}) {
 var focused by remember {mutableStateOf(false)}
 val shape=RoundedCornerShape(if(grouped)10.dp else 12.dp)
 XuperOutlinedButton(onClick=click,modifier=modifier.shadow(if(selected||focused)2.dp else 0.dp,shape).onFocusChanged {focused=it.hasFocus;if(it.hasFocus)onFocus()},shape=shape,border=BorderStroke(if(focused)2.dp else 1.dp,if(focused)Accent else if(selected)XuperStyle.foreground else if(grouped)Color.Transparent else XuperStyle.secondary),colors=ButtonDefaults.outlinedButtonColors(containerColor=if(selected)XuperStyle.foreground else if(focused)XuperStyle.card else if(grouped)Color.Transparent else Panel,contentColor=if(selected)XuperStyle.primaryText else XuperStyle.foreground),contentPadding=PaddingValues(horizontal=if(grouped)6.dp else 12.dp,vertical=if(dense)8.dp else 12.dp)){Text(label,fontSize=if(dense)13.sp else 14.sp,maxLines=1,overflow=TextOverflow.Ellipsis)}
}
@Composable private fun CatalogHome(vm: XuperViewModel,state: UiState,history: List<WatchProgress>,compact: Boolean,tv: Boolean,remove: (Title)->Unit) {
 val cards=categoryCards(state);val grid=rememberLazyGridState();LaunchedEffect(state.section){grid.scrollToItem(0)};val pad=if(tv)20.dp else 12.dp
 LazyVerticalGrid(columns=if(tv)GridCells.Fixed(4)else GridCells.Adaptive(if(compact)135.dp else 170.dp),state=grid,verticalArrangement=Arrangement.spacedBy(16.dp),horizontalArrangement=Arrangement.spacedBy(14.dp),contentPadding=PaddingValues(bottom=32.dp),modifier=Modifier.fillMaxSize()) {
  item(span={GridItemSpan(maxLineSpan)}) { Text(if(state.section==Section.TV)"TV en vivo" else state.section.label,modifier=Modifier.testTag("catalog-heading"),fontSize=28.sp,fontWeight=FontWeight.Bold) }
  if(state.section!=Section.TV&&state.items.isNotEmpty())item(span={GridItemSpan(maxLineSpan)}) { Hero(state.items.take(3),vm::detail,compact,state.demo) }
  if(history.isNotEmpty()) {
   item(span={GridItemSpan(maxLineSpan)}) { Text("Seguir viendo",fontSize=21.sp,fontWeight=FontWeight.SemiBold) }
   item(span={GridItemSpan(maxLineSpan)}) { LazyRow(horizontalArrangement=Arrangement.spacedBy(14.dp)) { items(history,key={"${it.title.kind}:${it.title.id}"}) { progress->Column(Modifier.width(if(compact)145.dp else 190.dp)) { PosterCard(progress.title,{vm.resume(progress)},{remove(progress.title)},Modifier.fillMaxWidth(),progress.positionMs.toFloat()/progress.durationMs.coerceAtLeast(1));Text(progress.label,maxLines=2,overflow=TextOverflow.Ellipsis,fontSize=14.sp,fontWeight=FontWeight.Medium,modifier=Modifier.padding(top=7.dp));progress.remainingMinutes?.let { Text("Quedan $it min",fontSize=12.sp,color=Color(0xFFA3AFBE)) } } } } }
  }
  if(cards.isNotEmpty()) {
   item(span={GridItemSpan(maxLineSpan)}) { Text("Categorías",fontSize=21.sp,fontWeight=FontWeight.SemiBold) }
   items(cards,key={"category:${it.first.id}"}) { (choice,query)->CategoryCard(choice){vm.openCategory(query)} }
  }
  item(span={GridItemSpan(maxLineSpan)}) { Text(if(state.section==Section.TV)"Canales" else "Explorar catálogo",fontSize=21.sp,fontWeight=FontWeight.SemiBold) }
  if(state.error!=null)item(span={GridItemSpan(maxLineSpan)}) { ErrorCard(state.error,vm::reload,{vm.demo(true)}) }
  items(state.items,key={"title:${it.kind}:${it.id}"}) { title->if(title.kind==Kind.LIVE)ChannelCard(title,{vm.play(title)},{vm.favorite(title)}) else Column {PosterCard(title,{vm.detail(title)},modifier=Modifier.fillMaxWidth());Text(title.name,fontSize=14.sp,maxLines=2,overflow=TextOverflow.Ellipsis,modifier=Modifier.padding(top=8.dp))} }
  if(state.loading)item(span={GridItemSpan(maxLineSpan)}) { Box(Modifier.fillMaxWidth().padding(pad),contentAlignment=Alignment.Center){CircularProgressIndicator(Modifier.size(30.dp))} }
  if(state.hasMore&&!state.loading)item(span={GridItemSpan(maxLineSpan)}) { XuperOutlinedButton(onClick=vm::more){Text("Cargar más") } }
 }
 val nearEnd by remember { derivedStateOf { grid.layoutInfo.visibleItemsInfo.lastOrNull()?.index?.let { it>=grid.layoutInfo.totalItemsCount-5 }?:false } }
 LaunchedEffect(nearEnd,state.page) { if(nearEnd&&state.page>0&&state.hasMore&&!state.loading)vm.more() }
}
@Composable private fun Hero(titles: List<Title>,open: (Title)->Unit,compact: Boolean,demo: Boolean) {
 val app=LocalContext.current.applicationContext as XuperApplication
 var images by remember {mutableStateOf<Map<String,String>>(emptyMap())}
 LaunchedEffect(titles.map {it.id},demo){if(!demo)for(title in titles.take(3)){val image=app.artwork.image(title);if(image!=null)images=images+(title.id to image)}}
 var index by remember(titles.map { it.id }) { mutableIntStateOf(0) };var focused by remember { mutableStateOf(false) };val title=titles[index.coerceAtMost(titles.lastIndex)]
 LaunchedEffect(titles,focused) { if(titles.size>1&&!focused)while(true){delay(8000);index=(index+1)%titles.size} }
 Surface(onClick={open(title)},shape=RoundedCornerShape(18.dp),modifier=Modifier.fillMaxWidth().height(if(compact)210.dp else (LocalConfiguration.current.screenHeightDp*.32f).coerceIn(190f,290f).dp).onFocusChanged { focused=it.hasFocus },color=Panel,border=if(focused)BorderStroke(2.dp,Accent)else null) {
  Box { AsyncImage(images[title.id]?:title.backdrop.ifBlank { title.poster },null,Modifier.fillMaxSize(),contentScale=ContentScale.Crop);Box(Modifier.matchParentSize().background(Brush.horizontalGradient(listOf(Background.copy(alpha=.96f),Background.copy(alpha=.25f)))));Column(Modifier.align(Alignment.BottomStart).padding(22.dp).fillMaxWidth(if(compact).95f else .65f),verticalArrangement=Arrangement.spacedBy(10.dp)) {Text("PARA EXPLORAR",color=Accent,fontSize=12.sp);Text(title.name,fontSize=if(compact)24.sp else 32.sp,fontWeight=FontWeight.Bold,maxLines=2,overflow=TextOverflow.Ellipsis);Text(title.synopsis.ifBlank { title.genres.joinToString(" · ") },maxLines=2,fontSize=14.sp,overflow=TextOverflow.Ellipsis);Text("Ver ficha   ›",fontWeight=FontWeight.SemiBold)};Row(Modifier.align(Alignment.BottomEnd).padding(16.dp),horizontalArrangement=Arrangement.spacedBy(5.dp)) {titles.forEachIndexed { i,_->Box(Modifier.size(if(i==index)9.dp else 6.dp).background(if(i==index)Accent else Color.Gray,RoundedCornerShape(9.dp)))} } }
 }
}
@Composable private fun CategoryCard(choice: Choice,click: ()->Unit) { var focused by remember { mutableStateOf(false) };Surface(onClick=click,shape=RoundedCornerShape(15.dp),color=Panel,border=BorderStroke(if(focused)2.dp else 1.dp,if(focused)Accent else XuperStyle.secondary),modifier=Modifier.fillMaxWidth().height(90.dp).onFocusChanged { focused=it.isFocused }) { Box(Modifier.background(Brush.linearGradient(listOf(Color(0xFF232326),Color(0xFF141416)))).padding(16.dp)){Text(choice.label,fontWeight=FontWeight.SemiBold,fontSize=16.sp,modifier=Modifier.align(Alignment.CenterStart),maxLines=2,overflow=TextOverflow.Ellipsis)} } }
@Composable private fun PosterCard(title: Title,click: ()->Unit,longClick: ()->Unit={},modifier: Modifier=Modifier,progress: Float?=null) {
 var focused by remember { mutableStateOf(false) }
 Column(modifier.clip(RoundedCornerShape(13.dp)).background(Panel).border(if(focused)2.dp else 1.dp,if(focused)Accent else XuperStyle.secondary,RoundedCornerShape(13.dp)).onFocusChanged { focused=it.isFocused }.combinedClickable(onClick=click,onLongClick=longClick).semantics { contentDescription=title.name }) { Box(Modifier.fillMaxWidth().aspectRatio(2f/3f),contentAlignment=Alignment.Center){if(title.poster.isNotBlank())AsyncImage(title.poster,null,Modifier.fillMaxSize(),contentScale=ContentScale.Fit)else Icon(Icons.Default.Movie,null,Modifier.size(40.dp),tint=XuperStyle.muted)};if(progress!=null)Box(Modifier.fillMaxWidth().height(4.dp).background(Color.DarkGray)){Box(Modifier.fillMaxWidth(progress.coerceIn(0f,1f)).fillMaxHeight().background(Color(0xFFEF4359)))} }
}
@Composable private fun ChannelCard(title: Title,click: ()->Unit,favorite: ()->Unit={}) { var focused by remember { mutableStateOf(false) };Surface(onClick=click,shape=RoundedCornerShape(12.dp),color=Panel,border=if(focused)BorderStroke(2.dp,Accent)else null,modifier=Modifier.onFocusChanged { focused=it.isFocused }) { Column(Modifier.padding(14.dp),horizontalAlignment=Alignment.CenterHorizontally) { Box(Modifier.fillMaxWidth().height(70.dp).clip(RoundedCornerShape(8.dp)).background(Color.White),contentAlignment=Alignment.Center){if(title.poster.isBlank())Icon(Icons.Default.LiveTv,null,tint=Color.DarkGray)else AsyncImage(title.poster,null,Modifier.fillMaxSize().padding(8.dp),contentScale=ContentScale.Fit)};Text(title.name,maxLines=2,fontSize=14.sp,modifier=Modifier.padding(top=10.dp));IconButton(onClick=favorite){Icon(Icons.Default.FavoriteBorder,"Guardar canal")} } } }
@Composable private fun ErrorCard(message: String,retry: ()->Unit,demo: (()->Unit)?=null) { Column(Modifier.fillMaxWidth().background(Panel,RoundedCornerShape(14.dp)).padding(18.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {Text(message,color=Color(0xFFFFC9C9));Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){XuperOutlinedButton(retry){Text("Reintentar")};if(demo!=null)TextButton(demo){Text("Probar interfaz local")}} } }
@Composable private fun SearchScreen(vm: XuperViewModel,state: UiState) {
 Column(Modifier.fillMaxSize()) {
  OutlinedTextField(value=state.query.text,onValueChange={vm.query(state.query.copy(text=it))},label={Text(if(state.section==Section.TV)"Buscar canal" else "Buscar en ${state.section.label.lowercase()}")},leadingIcon={Icon(Icons.Default.Search,null)},singleLine=true,modifier=Modifier.fillMaxWidth(),trailingIcon={if(state.query.text.isNotBlank())IconButton(onClick={vm.query(state.query.copy(text=""))}){Icon(Icons.Default.Close,"Borrar búsqueda")}})
  LazyRow(Modifier.padding(vertical=12.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
   item { FilterPicker("Categoría",state.columns,state.query.column){vm.query(state.query.copy(column=it))} }
   if(state.section!=Section.TV){item {FilterPicker("Género",state.filters.genres,state.query.genre){vm.query(state.query.copy(genre=it))}};item {FilterPicker("Año",state.filters.years,state.query.year){vm.query(state.query.copy(year=it))}};item {FilterPicker("País",state.filters.countries,state.query.country){vm.query(state.query.copy(country=it))}}}
  }
  if(state.query.text.isNotBlank()&&listOf(state.query.genre,state.query.year,state.query.country,state.query.column).any { it.isNotBlank() })Text("Los filtros se aplican al explorar categorías; la búsqueda por título usa la ruta de búsqueda del portal.",fontSize=12.sp,color=XuperStyle.muted,modifier=Modifier.padding(bottom=8.dp))
  LazyVerticalGrid(GridCells.Adaptive(135.dp),horizontalArrangement=Arrangement.spacedBy(12.dp),verticalArrangement=Arrangement.spacedBy(16.dp),contentPadding=PaddingValues(bottom=30.dp)) {
   if(state.error!=null)item(span={GridItemSpan(maxLineSpan)}){ErrorCard(state.error,vm::reload)}
   items(state.items,key={it.id}) { title->Column { if(title.kind==Kind.LIVE)ChannelCard(title,{vm.play(title)},{vm.favorite(title)})else PosterCard(title,{vm.detail(title)},modifier=Modifier.fillMaxWidth());Text(title.name,maxLines=2,fontSize=13.sp,overflow=TextOverflow.Ellipsis) } }
   if(state.loading)item(span={GridItemSpan(maxLineSpan)}){CircularProgressIndicator(Modifier.padding(18.dp))}
   if(state.hasMore&&!state.loading)item(span={GridItemSpan(maxLineSpan)}){XuperOutlinedButton(vm::more){Text("Cargar más")}}
   if(!state.loading&&state.items.isEmpty()&&state.error==null)item(span={GridItemSpan(maxLineSpan)}){Text("No hay resultados para esta selección.",modifier=Modifier.padding(20.dp))}
  }
 }
}
@Composable internal fun FilterPicker(label: String,choices: List<Choice>,selected: String,allowAll: Boolean=true,select: (String)->Unit) {
 var open by remember { mutableStateOf(false) };XuperOutlinedButton(onClick={open=true}) {Text(label+" · "+(choices.firstOrNull { it.id==selected }?.label?:"Todos"));Icon(Icons.Default.ArrowDropDown,null)}
 if(open)AlertDialog(onDismissRequest={open=false},title={Text(label)},text={LazyColumn(Modifier.heightIn(max=380.dp)){if(allowAll)item{TextButton(onClick={select("");open=false}){Text((if(selected.isBlank())"✓ "else"")+"Todos")}};items(choices,key={it.id}){choice->TextButton(onClick={select(choice.id);open=false},modifier=Modifier.fillMaxWidth()){Text((if(choice.id==selected)"✓ "else"")+choice.label)}}}},confirmButton={TextButton(onClick={open=false}){Text("Cerrar")}})
}
@Composable private fun DetailScreen(vm: XuperViewModel,state: UiState) {
 val details=state.details?:return;val title=details.title;val favorite by vm.favorites.collectAsStateWithLifecycle()
 LazyColumn(contentPadding=PaddingValues(bottom=36.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
  item {Row(horizontalArrangement=Arrangement.spacedBy(18.dp),verticalAlignment=Alignment.Top){AsyncImage(title.poster,null,Modifier.width(110.dp).height(165.dp).clip(RoundedCornerShape(12.dp)),contentScale=ContentScale.Fit);Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){Text(title.name,fontSize=26.sp,fontWeight=FontWeight.Bold);Text(listOf(title.year,title.genres.joinToString(" · "),title.country).filter { it.isNotBlank() }.joinToString("  •  "),fontSize=13.sp,color=Color(0xFF9CADBF));XuperButton(onClick={vm.play(title,details.episodes.firstOrNull().takeIf {title.kind==Kind.SERIES})},enabled=!state.loading&&(title.kind==Kind.MOVIE||details.episodes.isNotEmpty())){Icon(Icons.Default.PlayArrow,null);Text(if(title.kind==Kind.SERIES)"Ver episodio" else "Reproducir")};XuperOutlinedButton(onClick={vm.favorite(title)}){Icon(if(favorite.any {it.id==title.id&&it.kind==title.kind})Icons.Default.Favorite else Icons.Default.FavoriteBorder,null);Text("Mi lista")}}} }
  if(title.synopsis.isNotBlank())item{Text(title.synopsis,fontSize=16.sp,lineHeight=24.sp)}
  if(state.loading)item{CircularProgressIndicator()}
  if(state.error!=null)item{ErrorCard(state.error,{vm.detail(title,state.seasonId)})}
  if(details.seasons.isNotEmpty())item{LazyRow(horizontalArrangement=Arrangement.spacedBy(10.dp)){items(details.seasons,key={it.id}){season->NavigationButton("Temporada ${season.number}",state.seasonId==season.id,{vm.detail(title,season.id)})}}}
  if(state.similar.isNotEmpty())item {Text("Similares",fontSize=21.sp,fontWeight=FontWeight.SemiBold);LazyRow(horizontalArrangement=Arrangement.spacedBy(12.dp)){items(state.similar,key={it.id}){related->Column(Modifier.width(145.dp)){PosterCard(related,{vm.detail(related)},modifier=Modifier.fillMaxWidth());Text(related.name,maxLines=2,fontSize=13.sp)}}}}
  items(details.episodes,key={it.id}){ep->XuperOutlinedButton(onClick={vm.play(title,ep)},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(12.dp)){Column(Modifier.fillMaxWidth().padding(6.dp)){Text("EP. ${ep.number} · ${ep.name}",fontWeight=FontWeight.Medium);if(ep.durationSeconds>0)Text("${ep.durationSeconds/60} min",fontSize=12.sp)}}}
 }
}

private fun categoryCards(state: UiState): List<Pair<Choice,Query>> {
 if(state.section==Section.TV)return state.columns.map { it to Query(column=it.id) }
 fun label(value: String)=mapOf("action" to "Acción","crime" to "Crimen","thriller" to "Suspenso","horror" to "Terror","drama" to "Drama","comedy" to "Comedia","adventure" to "Aventura","romance" to "Romance","animation" to "Animación","science fiction" to "Ciencia ficción")[value.lowercase()]?:value
 val genres=state.filters.genres.map { Choice("genre:${it.id}",label(it.label)) to Query(genre=it.id) }.toMutableList()
 if(state.section==Section.SERIES)for(country in state.filters.countries){val value=(country.id+" "+country.label).lowercase();val name=when{value.contains("turkey")||value.contains("turkiye")||value.contains("turquía")->"Serie Turca";value.contains("korea")||value.contains("corea")->"Serie Coreana";else->null};if(name!=null)genres.add(Choice("country:${country.id}",name) to Query(country=country.id))}
 return genres.take(24).ifEmpty { state.columns.take(20).map { it to Query(column=it.id) } }
}

@Composable internal fun FavoritesScreen(vm: XuperViewModel) {
 val favorites by vm.favorites.collectAsStateWithLifecycle()
 Column(Modifier.fillMaxSize()){Text("Mi lista",fontSize=28.sp,fontWeight=FontWeight.Bold,modifier=Modifier.padding(bottom=16.dp));if(favorites.isEmpty())Text("Guarda películas, series o canales en tu lista.");LazyVerticalGrid(GridCells.Adaptive(145.dp),horizontalArrangement=Arrangement.spacedBy(14.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){items(favorites,key={"${it.kind}:${it.id}"}){title->Column{PosterCard(title,{vm.detail(title)},modifier=Modifier.fillMaxWidth());Text(title.name,maxLines=2,fontSize=14.sp);TextButton(onClick={vm.favorite(title)}){Text("Quitar de mi lista")}}}}}
}
