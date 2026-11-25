package com.matiasb.xuperandroid
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.*
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
private val Background=Color(0xFF090B10)
private val Panel=Color(0xFF151D2B)
private val Accent=Color(0xFF64D9FF)
class MainActivity: ComponentActivity() {
 private val model: XuperViewModel by viewModels()
 override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState);enableEdgeToEdge();setContent {
  val tv=(getSystemService(Context.UI_MODE_SERVICE) as UiModeManager).currentModeType==Configuration.UI_MODE_TYPE_TELEVISION || BuildConfig.DEBUG&&intent.getBooleanExtra("force_tv",false)
  MaterialTheme(colorScheme=darkColorScheme(primary=Accent,background=Background,surface=Panel,onSurface=Color(0xFFE8EEF7))) { XuperApp(model,tv) }
 };if(BuildConfig.DEBUG&&intent.getBooleanExtra("demo",false))model.demo(true) }
 override fun onStop() { if(!isChangingConfigurations)model.background();super.onStop() }
}
@Composable private fun XuperApp(vm: XuperViewModel,tv: Boolean) {
 val state by vm.state.collectAsStateWithLifecycle();val history by vm.history.collectAsStateWithLifecycle();val settings by vm.settings.collectAsStateWithLifecycle();var removing by remember { mutableStateOf<Title?>(null) }
 BackHandler(enabled=state.screen!=Screen.HOME) { vm.back() }
 if(state.screen==Screen.PLAYER) { PlayerScreen(vm,state,settings,tv);return }
 BoxWithConstraints(Modifier.fillMaxSize().background(Background).safeDrawingPadding()) {
  val compact=maxWidth<600.dp
  Column(Modifier.fillMaxSize().padding(horizontal=if(tv)32.dp else 16.dp)) {
   if(compact) Row(Modifier.fillMaxWidth().padding(top=10.dp),verticalAlignment=Alignment.CenterVertically) { Brand(Modifier.weight(1f));Actions(vm) }
   Row(Modifier.fillMaxWidth().padding(vertical=12.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
    if(!compact)Brand(Modifier.weight(1f))
    Section.entries.forEach { section->NavigationButton(section.label,state.section==section,{vm.select(section)},Modifier.weight(if(compact)1f else .65f),onFocus={if(tv&&state.section!=section)vm.select(section)}) }
    if(!compact)Actions(vm)
   }
   if(state.demo) Text("MODO DE PRUEBA · Contenido local, no es el catálogo del portal",color=Accent,fontSize=12.sp,modifier=Modifier.padding(bottom=8.dp))
   when(state.screen) {
    Screen.HOME -> CatalogHome(vm,state,history.filter { it.title.kind==state.section.kind },compact,tv,{removing=it})
    Screen.SEARCH -> SearchScreen(vm,state)
    Screen.DETAILS -> DetailScreen(vm,state)
    Screen.SETTINGS -> SettingsScreen(vm,settings,state.demo)
    else -> Unit
   }
  }
 }
 removing?.let { title->AlertDialog(onDismissRequest={removing=null},title={Text("Quitar de Seguir viendo")},text={Text(title.name)},confirmButton={TextButton(onClick={vm.remove(title);removing=null}){Text("Eliminar")}},dismissButton={TextButton(onClick={removing=null}){Text("Cancelar")}}) }
}
@Composable private fun Brand(modifier: Modifier=Modifier) { Row(modifier,verticalAlignment=Alignment.CenterVertically) { Icon(painterResource(R.drawable.ic_xuper),null,tint=Color.Unspecified,modifier=Modifier.size(44.dp));Column { Text("XuperAndroid",fontWeight=FontWeight.Bold,fontSize=19.sp);Text("by Matias",fontSize=11.sp,color=Color(0xFF96A4B8)) } } }
@Composable private fun Actions(vm: XuperViewModel) { IconButton(onClick=vm::search,modifier=Modifier.semantics { contentDescription="Buscar películas y series" }){Icon(Icons.Default.Search,"Buscar")};IconButton(onClick=vm::settingsScreen){Icon(Icons.Default.Settings,"Ajustes")} }
@Composable private fun NavigationButton(label: String,selected: Boolean,click: ()->Unit,modifier: Modifier=Modifier,onFocus: ()->Unit={}) {
 var focused by remember { mutableStateOf(false) }
 OutlinedButton(onClick=click,modifier=modifier.onFocusChanged { focused=it.isFocused;if(it.isFocused)onFocus() },shape=RoundedCornerShape(12.dp),border=BorderStroke(if(focused)2.dp else 1.dp,if(focused)Accent else if(selected)Color(0xFF527285)else Color(0xFF293447)),colors=ButtonDefaults.outlinedButtonColors(containerColor=if(selected)Color(0xFF20384B)else Color.Transparent,contentColor=Color.White),contentPadding=PaddingValues(horizontal=12.dp,vertical=12.dp)){Text(label,maxLines=1)}
}
@Composable private fun CatalogHome(vm: XuperViewModel,state: UiState,history: List<WatchProgress>,compact: Boolean,tv: Boolean,remove: (Title)->Unit) {
 val cards=categoryCards(state);val grid=rememberLazyGridState();LaunchedEffect(state.section){grid.scrollToItem(0)};val pad=if(tv)20.dp else 12.dp
 LazyVerticalGrid(columns=GridCells.Adaptive(if(compact)135.dp else 170.dp),state=grid,verticalArrangement=Arrangement.spacedBy(16.dp),horizontalArrangement=Arrangement.spacedBy(14.dp),contentPadding=PaddingValues(bottom=32.dp),modifier=Modifier.fillMaxSize()) {
  item(span={GridItemSpan(maxLineSpan)}) { Text(if(state.section==Section.TV)"TV en vivo" else state.section.label,fontSize=28.sp,fontWeight=FontWeight.Bold) }
  if(state.section!=Section.TV&&state.items.isNotEmpty())item(span={GridItemSpan(maxLineSpan)}) { Hero(state.items.take(3),vm::detail,compact) }
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
  items(state.items,key={"title:${it.kind}:${it.id}"}) { title->if(title.kind==Kind.LIVE)ChannelCard(title){vm.play(title)} else Column {PosterCard(title,{vm.detail(title)},modifier=Modifier.fillMaxWidth());Text(title.name,fontSize=14.sp,maxLines=2,overflow=TextOverflow.Ellipsis,modifier=Modifier.padding(top=8.dp))} }
  if(state.loading)item(span={GridItemSpan(maxLineSpan)}) { Box(Modifier.fillMaxWidth().padding(pad),contentAlignment=Alignment.Center){CircularProgressIndicator(Modifier.size(30.dp))} }
  if(state.hasMore&&!state.loading)item(span={GridItemSpan(maxLineSpan)}) { OutlinedButton(onClick=vm::more){Text("Cargar más") } }
 }
 val nearEnd by remember { derivedStateOf { grid.layoutInfo.visibleItemsInfo.lastOrNull()?.index?.let { it>=grid.layoutInfo.totalItemsCount-5 }?:false } }
 LaunchedEffect(nearEnd,state.page) { if(nearEnd&&state.page>0&&state.hasMore&&!state.loading)vm.more() }
}
@Composable private fun Hero(titles: List<Title>,open: (Title)->Unit,compact: Boolean) {
 var index by remember(titles.map { it.id }) { mutableIntStateOf(0) };var focused by remember { mutableStateOf(false) };val title=titles[index.coerceAtMost(titles.lastIndex)]
 LaunchedEffect(titles,focused) { if(titles.size>1&&!focused)while(true){delay(8000);index=(index+1)%titles.size} }
 Surface(onClick={open(title)},shape=RoundedCornerShape(18.dp),modifier=Modifier.fillMaxWidth().height(if(compact)210.dp else 290.dp).onFocusChanged { focused=it.hasFocus },color=Panel,border=if(focused)BorderStroke(2.dp,Accent)else null) {
  Box { AsyncImage(title.backdrop.ifBlank { title.poster },null,Modifier.fillMaxSize(),contentScale=ContentScale.Crop);Box(Modifier.matchParentSize().background(Brush.horizontalGradient(listOf(Background.copy(alpha=.96f),Background.copy(alpha=.25f)))));Column(Modifier.align(Alignment.BottomStart).padding(22.dp).fillMaxWidth(if(compact).95f else .65f),verticalArrangement=Arrangement.spacedBy(10.dp)) {Text("PARA EXPLORAR",color=Accent,fontSize=12.sp);Text(title.name,fontSize=if(compact)24.sp else 32.sp,fontWeight=FontWeight.Bold,maxLines=2,overflow=TextOverflow.Ellipsis);Text(title.synopsis.ifBlank { title.genres.joinToString(" · ") },maxLines=2,fontSize=14.sp,overflow=TextOverflow.Ellipsis);Text("Ver ficha   ›",fontWeight=FontWeight.SemiBold)};Row(Modifier.align(Alignment.BottomEnd).padding(16.dp),horizontalArrangement=Arrangement.spacedBy(5.dp)) {titles.forEachIndexed { i,_->Box(Modifier.size(if(i==index)9.dp else 6.dp).background(if(i==index)Accent else Color.Gray,RoundedCornerShape(9.dp)))} } }
 }
}
@Composable private fun CategoryCard(choice: Choice,click: ()->Unit) { var focused by remember { mutableStateOf(false) };Surface(onClick=click,shape=RoundedCornerShape(15.dp),color=Panel,border=BorderStroke(if(focused)2.dp else 1.dp,if(focused)Accent else Color(0xFF2B3749)),modifier=Modifier.fillMaxWidth().height(90.dp).onFocusChanged { focused=it.isFocused }) { Box(Modifier.background(Brush.linearGradient(listOf(Color(0xFF203A4D),Panel))).padding(16.dp)){Text(choice.label,fontWeight=FontWeight.SemiBold,fontSize=16.sp,modifier=Modifier.align(Alignment.CenterStart),maxLines=2,overflow=TextOverflow.Ellipsis)} } }
@Composable private fun PosterCard(title: Title,click: ()->Unit,longClick: ()->Unit={},modifier: Modifier=Modifier,progress: Float?=null) {
 var focused by remember { mutableStateOf(false) }
 Column(modifier.clip(RoundedCornerShape(13.dp)).background(Panel).border(if(focused)2.dp else 1.dp,if(focused)Accent else Color(0xFF242E3A),RoundedCornerShape(13.dp)).onFocusChanged { focused=it.isFocused }.combinedClickable(onClick=click,onLongClick=longClick).semantics { contentDescription=title.name }) { Box(Modifier.fillMaxWidth().aspectRatio(2f/3f),contentAlignment=Alignment.Center){if(title.poster.isNotBlank())AsyncImage(title.poster,null,Modifier.fillMaxSize(),contentScale=ContentScale.Fit)else Icon(Icons.Default.Movie,null,Modifier.size(40.dp),tint=Color(0xFF657C92))};if(progress!=null)Box(Modifier.fillMaxWidth().height(4.dp).background(Color.DarkGray)){Box(Modifier.fillMaxWidth(progress.coerceIn(0f,1f)).fillMaxHeight().background(Color(0xFFEF4359)))} }
}
@Composable private fun ChannelCard(title: Title,click: ()->Unit) { var focused by remember { mutableStateOf(false) };Surface(onClick=click,shape=RoundedCornerShape(12.dp),color=Panel,border=if(focused)BorderStroke(2.dp,Accent)else null,modifier=Modifier.onFocusChanged { focused=it.isFocused }) { Column(Modifier.padding(14.dp),horizontalAlignment=Alignment.CenterHorizontally) { Box(Modifier.fillMaxWidth().height(70.dp).clip(RoundedCornerShape(8.dp)).background(Color.White),contentAlignment=Alignment.Center){if(title.poster.isBlank())Icon(Icons.Default.LiveTv,null,tint=Color.DarkGray)else AsyncImage(title.poster,null,Modifier.fillMaxSize().padding(8.dp),contentScale=ContentScale.Fit)};Text(title.name,maxLines=2,fontSize=14.sp,modifier=Modifier.padding(top=10.dp)) } } }
@Composable private fun ErrorCard(message: String,retry: ()->Unit,demo: (()->Unit)?=null) { Column(Modifier.fillMaxWidth().background(Panel,RoundedCornerShape(14.dp)).padding(18.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {Text(message,color=Color(0xFFFFC9C9));Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){OutlinedButton(retry){Text("Reintentar")};if(demo!=null)TextButton(demo){Text("Probar interfaz local")}} } }
@Composable private fun SearchScreen(vm: XuperViewModel,state: UiState) {
 Column(Modifier.fillMaxSize()) {
  OutlinedTextField(value=state.query.text,onValueChange={vm.query(state.query.copy(text=it))},label={Text(if(state.section==Section.TV)"Buscar canal" else "Buscar en ${state.section.label.lowercase()}")},leadingIcon={Icon(Icons.Default.Search,null)},singleLine=true,modifier=Modifier.fillMaxWidth(),trailingIcon={if(state.query.text.isNotBlank())IconButton(onClick={vm.query(state.query.copy(text=""))}){Icon(Icons.Default.Close,"Borrar búsqueda")}})
  LazyRow(Modifier.padding(vertical=12.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
   item { FilterPicker("Categoría",state.columns,state.query.column){vm.query(state.query.copy(column=it))} }
   if(state.section!=Section.TV){item {FilterPicker("Género",state.filters.genres,state.query.genre){vm.query(state.query.copy(genre=it))}};item {FilterPicker("Año",state.filters.years,state.query.year){vm.query(state.query.copy(year=it))}};item {FilterPicker("País",state.filters.countries,state.query.country){vm.query(state.query.copy(country=it))}}}
  }
  if(state.query.text.isNotBlank()&&listOf(state.query.genre,state.query.year,state.query.country,state.query.column).any { it.isNotBlank() })Text("Los filtros se aplican al explorar categorías; la búsqueda por título usa la ruta de búsqueda del portal.",fontSize=12.sp,color=Color.Gray,modifier=Modifier.padding(bottom=8.dp))
  LazyVerticalGrid(GridCells.Adaptive(135.dp),horizontalArrangement=Arrangement.spacedBy(12.dp),verticalArrangement=Arrangement.spacedBy(16.dp),contentPadding=PaddingValues(bottom=30.dp)) {
   if(state.error!=null)item(span={GridItemSpan(maxLineSpan)}){ErrorCard(state.error,vm::reload)}
   items(state.items,key={it.id}) { title->Column { if(title.kind==Kind.LIVE)ChannelCard(title){vm.play(title)}else PosterCard(title,{vm.detail(title)},modifier=Modifier.fillMaxWidth());Text(title.name,maxLines=2,fontSize=13.sp,overflow=TextOverflow.Ellipsis) } }
   if(state.loading)item(span={GridItemSpan(maxLineSpan)}){CircularProgressIndicator(Modifier.padding(18.dp))}
   if(state.hasMore&&!state.loading)item(span={GridItemSpan(maxLineSpan)}){OutlinedButton(vm::more){Text("Cargar más")}}
   if(!state.loading&&state.items.isEmpty()&&state.error==null)item(span={GridItemSpan(maxLineSpan)}){Text("No hay resultados para esta selección.",modifier=Modifier.padding(20.dp))}
  }
 }
}
@Composable internal fun FilterPicker(label: String,choices: List<Choice>,selected: String,select: (String)->Unit) {
 var open by remember { mutableStateOf(false) };OutlinedButton(onClick={open=true}) {Text(label+" · "+(choices.firstOrNull { it.id==selected }?.label?:"Todos"));Icon(Icons.Default.ArrowDropDown,null)}
 if(open)AlertDialog(onDismissRequest={open=false},title={Text(label)},text={LazyColumn(Modifier.heightIn(max=380.dp)){item{TextButton(onClick={select("");open=false}){Text("Todos")}};items(choices,key={it.id}){choice->TextButton(onClick={select(choice.id);open=false},modifier=Modifier.fillMaxWidth()){Text(choice.label)}}}},confirmButton={TextButton(onClick={open=false}){Text("Cerrar")}})
}
@Composable private fun DetailScreen(vm: XuperViewModel,state: UiState) {
 val details=state.details?:return;val title=details.title;val favorite by vm.favorites.collectAsStateWithLifecycle()
 LazyColumn(contentPadding=PaddingValues(bottom=36.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
  item {Row(horizontalArrangement=Arrangement.spacedBy(18.dp),verticalAlignment=Alignment.Top){AsyncImage(title.poster,null,Modifier.width(110.dp).height(165.dp).clip(RoundedCornerShape(12.dp)),contentScale=ContentScale.Fit);Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){Text(title.name,fontSize=26.sp,fontWeight=FontWeight.Bold);Text(listOf(title.year,title.genres.joinToString(" · "),title.country).filter { it.isNotBlank() }.joinToString("  •  "),fontSize=13.sp,color=Color(0xFF9CADBF));Button(onClick={vm.play(title,details.episodes.firstOrNull())},enabled=!state.loading&&(title.kind==Kind.MOVIE||details.episodes.isNotEmpty())){Icon(Icons.Default.PlayArrow,null);Text(if(title.kind==Kind.SERIES)"Ver episodio" else "Reproducir")};OutlinedButton(onClick={vm.favorite(title)}){Icon(if(favorite.any {it.id==title.id&&it.kind==title.kind})Icons.Default.Favorite else Icons.Default.FavoriteBorder,null);Text("Mi lista")}}} }
  if(title.synopsis.isNotBlank())item{Text(title.synopsis,fontSize=16.sp,lineHeight=24.sp)}
  if(state.loading)item{CircularProgressIndicator()}
  if(state.error!=null)item{ErrorCard(state.error,{vm.detail(title,state.seasonId)})}
  if(details.seasons.isNotEmpty())item{LazyRow(horizontalArrangement=Arrangement.spacedBy(10.dp)){items(details.seasons,key={it.id}){season->NavigationButton("Temporada ${season.number}",state.seasonId==season.id,{vm.detail(title,season.id)})}}}
  items(details.episodes,key={it.id}){ep->OutlinedButton(onClick={vm.play(title,ep)},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(12.dp)){Column(Modifier.fillMaxWidth().padding(6.dp)){Text("EP. ${ep.number} · ${ep.name}",fontWeight=FontWeight.Medium);if(ep.durationSeconds>0)Text("${ep.durationSeconds/60} min",fontSize=12.sp)}}}
 }
}
@Composable private fun SettingsScreen(vm: XuperViewModel,settings: Settings,demo: Boolean) {
 val context=LocalContext.current;val scope=rememberCoroutineScope();var status by remember { mutableStateOf("") }
 LazyColumn(verticalArrangement=Arrangement.spacedBy(14.dp),contentPadding=PaddingValues(bottom=32.dp)) {
  item {Text("Ajustes",fontSize=28.sp,fontWeight=FontWeight.Bold)}
  item {Text("XuperAndroid · 0.1.0 alpha 1",color=Accent);Text("TV, teléfono y tablet · Media3 nativo",fontSize=14.sp)}
  item {Text("Subtítulos",fontSize=20.sp,fontWeight=FontWeight.SemiBold)}
  item {FilterPicker("Modo",listOf(Choice("0","Automáticos si no hay español"),Choice("1","Desactivados"),Choice("2","Activados si existen")),settings.subtitleMode.toString()){vm.changeSetting("subtitles",it.toIntOrNull()?:0)}}
  item {FilterPicker("Fuente",listOf("Sistema","Condensada","Serif","Monoespaciada").mapIndexed { i,s->Choice(i.toString(),s) },settings.font.toString()){vm.changeSetting("font",it.toIntOrNull()?:0)}}
  item {FilterPicker("Tamaño",listOf("Normal","Grande","Pequeño").mapIndexed { i,s->Choice(i.toString(),s) },settings.fontSize.toString()){vm.changeSetting("fontSize",it.toIntOrNull()?:0)}}
  item {FilterPicker("Color",listOf("Blanco","Amarillo","Cian").mapIndexed { i,s->Choice(i.toString(),s) },settings.fontColor.toString()){vm.changeSetting("fontColor",it.toIntOrNull()?:0)}}
  item {Text("Audio: español latino cuando esté identificado. Las elecciones por título tienen prioridad.",fontSize=14.sp,color=Color(0xFF9CADBF))}
  item {Text("Almacenamiento",fontSize=20.sp,fontWeight=FontWeight.SemiBold);OutlinedButton(onClick={scope.launch { status="Limpiando…";val loader=coil3.SingletonImageLoader.get(context);loader.memoryCache?.clear();withContext(Dispatchers.IO){loader.diskCache?.clear()};status="Caché temporal eliminada. Se conservan progreso, favoritos y ajustes." }}){Text("Limpiar caché temporal")};if(status.isNotBlank())Text(status,fontSize=13.sp,color=Accent)}
  item {Text("Prueba local",fontSize=20.sp,fontWeight=FontWeight.SemiBold);Row(verticalAlignment=Alignment.CenterVertically){Switch(demo,{vm.demo(it)});Spacer(Modifier.width(12.dp));Text("Usar catálogo y vídeo de prueba")};Text("No utiliza el portal ni representa su catálogo. Sirve para probar mandos, pantallas y reproducción.",fontSize=12.sp,color=Color.Gray)}
 }
}

private fun categoryCards(state: UiState): List<Pair<Choice,Query>> {
 if(state.section==Section.TV)return state.columns.map { it to Query(column=it.id) }
 fun label(value: String)=mapOf("action" to "Acción","crime" to "Crimen","thriller" to "Suspenso","horror" to "Terror","drama" to "Drama","comedy" to "Comedia","adventure" to "Aventura","romance" to "Romance","animation" to "Animación","science fiction" to "Ciencia ficción")[value.lowercase()]?:value
 val genres=state.filters.genres.map { Choice("genre:${it.id}",label(it.label)) to Query(genre=it.id) }.toMutableList()
 if(state.section==Section.SERIES)for(country in state.filters.countries){val value=(country.id+" "+country.label).lowercase();val name=when{value.contains("turkey")||value.contains("turkiye")||value.contains("turquía")->"Serie Turca";value.contains("korea")||value.contains("corea")->"Serie Coreana";else->null};if(name!=null)genres.add(Choice("country:${country.id}",name) to Query(country=country.id))}
 return genres.take(24).ifEmpty { state.columns.take(20).map { it to Query(column=it.id) } }
}
