package com.matiasb.xuperandroid.data
import com.matiasb.xuperandroid.model.*
import org.json.JSONArray
import org.json.JSONObject
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
interface CatalogRepository {
 suspend fun browse(section: Section,query: Query=Query(),page: Int=1): Page
 suspend fun categories(section: Section): List<Choice>
 suspend fun filters(section: Section): Filters
 suspend fun details(title: Title,seasonId: String=""): Details
 suspend fun resolve(title: Title,episode: Episode?=null,seasonId: String="",maxHeight: Int=0,preferredAudio: String=""): Stream
}
internal fun JSONArray?.objects() = (0 until (this?.length()?:0)).mapNotNull { this?.optJSONObject(it) }
internal fun JSONObject.text(key: String) = optString(key,"").takeUnless { it=="null" }.orEmpty()
private fun JSONObject.image(type: String): String = optJSONArray("posterList").objects().firstOrNull { it.text("fileType")==type }?.text("fileUrl").orEmpty()
internal fun JSONObject.title(kind: Kind): Title {
 val actual=if(kind==Kind.LIVE)Kind.LIVE else if(text("programType") in listOf("teleplay","series") || optInt("volumnCount")>1 || kind==Kind.SERIES)Kind.SERIES else Kind.MOVIE
 return Title(text(if(actual==Kind.LIVE)"channelCode" else "contentId"),text("name").ifBlank { text("title") },actual,image("icon").ifBlank { text("posterUrl").ifBlank { image("poster") } },image("stage").ifBlank { image("poster") },text("releaseTime").take(4),text("description").ifBlank { text("synopsis") },text("tags").split(',').filter { it.isNotBlank() },text("originalCountry"),PlaybackPolicy.duration(text("duration")))
}
class PortalRepository(private val client: PortalClient): CatalogRepository {
 private val columns=java.util.concurrent.ConcurrentHashMap<Section,List<Choice>>()
 private val columnLocks=Section.entries.associateWith {Mutex()}
 private suspend fun call(path: String,bean: JSONObject): JSONObject=client.request(path,bean)
 override suspend fun categories(section: Section): List<Choice> = columnLocks.getValue(section).withLock {
  columns[section]?.let { return@withLock it }
  val result=if(section==Section.TV)call("getNextColumns",JSONObject().put("columnCode","masnew_live").put("pageNum",1).put("pageSize",200).put("version","")) else call("v3/getColumnContents",JSONObject().put("columnId",section.columnId).put("pageNum",1).put("pageSize",1000))
  result.optJSONArray(if(section==Section.TV)"recommendList" else "childColumnList").objects().filter { !it.optBoolean("restricted",false) && it.text("restricted")!="1" }.map { Choice(it.text(if(section==Section.TV)"columnId" else "id"),it.text("name").ifBlank { it.text("title") }) }.filter { it.id.isNotBlank()&&it.label.isNotBlank() }.also { columns[section]=it }
 }
 override suspend fun filters(section: Section): Filters {
  if(section==Section.TV)return Filters()
  val data=call("v3/filterGenre",JSONObject().put("columnId",section.columnId))
  fun values(key: String): List<Choice> {val array=data.optJSONArray(key)?:return emptyList();return (0 until array.length()).map { index->val obj=array.optJSONObject(index);val id=obj?.let { it.text("key").ifBlank { it.text("id").ifBlank { it.text("value").ifBlank { it.text("name") } } } }?:array.optString(index);Choice(id,obj?.text("label")?.ifBlank { obj.text("name") }?.ifBlank { id }?:id) }.filter { it.id.isNotBlank() }.distinctBy { it.id }.take(250)}
  return Filters(values("tags"),values("year"),values("originalCountry"))
 }
 override suspend fun browse(section: Section,query: Query,page: Int): Page {
  val size=36;val bean=JSONObject().put("pageNum",page).put("pageSize",size)
  val path: String
  if(section==Section.TV){path="v6/getLiveData";bean.put("columnId",query.column.toLongOrNull()?:section.columnId.toLong()).put("dataVersion","").put("expireTimeStr","")}
  else if(query.text.isNotBlank()){path="v3/searchByName";bean.put("value",query.text).put("type","0").put("columnId",query.column.toLongOrNull()?:section.columnId.toLong()).put("filter","")}
  else {
   val filtered=listOf(query.genre,query.year,query.country).any { it.isNotBlank() }
   val all=if(!filtered&&query.column.isBlank())categories(section).firstOrNull { it.label.lowercase() in listOf("all","todos","todas","todo") }?.id.orEmpty() else ""
   val column=query.column.ifBlank { all }
   path=if(column.isNotBlank()&&!filtered)"v3/getShelveData" else "v3/filterByContent"
   bean.put("columnId",column.toLongOrNull()?:section.columnId.toLong());if(path.endsWith("getShelveData"))bean.put("columnType","2")
   if(query.genre.isNotBlank())bean.put("tags",query.genre);if(query.year.isNotBlank())bean.put("year",query.year);if(query.country.isNotBlank())bean.put("originalCountry",query.country)
  }
  val result=try { call(path,bean) } catch(error: PortalException) { if(section==Section.TV&&error.code!="portal200001"&&error.code!="portal100024")call("v7/getLiveData",bean) else throw error }
  val assets=when {section==Section.TV->result.optJSONArray("channelList").objects();query.text.isNotBlank()->result.optJSONArray("searchItemList").objects().flatMap { it.optJSONArray("itemList").objects() };else->result.optJSONArray("assetList").objects()}
  val parsed=assets.filter { it.text("restricted")!="1"&&it.text("isAdult")!="1"&&!it.optBoolean("isAdult",false) }.map { it.title(section.kind) }.filter { it.id.isNotBlank() }.distinctBy { it.id }
  val searchFiltered=query.text.isNotBlank()&&(section==Section.TV||listOf(query.genre,query.year,query.country).any { it.isNotBlank() })
  val items=if(!searchFiltered)parsed else parsed.filter { item ->
   (section!=Section.TV||item.name.contains(query.text,true)) &&
   (query.genre.isBlank()||item.genres.any { it.equals(query.genre,true) }) &&
   (query.year.isBlank()||item.year==query.year) &&
   (query.country.isBlank()||item.country.equals(query.country,true))
  }
  val totalKey=if(path.endsWith("getShelveData"))"assetListTotalSize" else "totalSize";val total=result.optInt(totalKey,-1).takeIf { it>=0&&!searchFiltered }
  return Page(items,page,assets.isNotEmpty()&&(total?.let { page*size<it }?: (assets.size>=size)),total)
 }
 override suspend fun details(title: Title,seasonId: String): Details {
  val result=call("v4/getItemData",JSONObject().put("contentId",seasonId.ifBlank { title.id }).put("type","0").put("sortType","0").put("language","en").put("macAddr","02:00:00:00:00:00"))
  val asset=result.optJSONObject("assetData")?:throw java.io.IOException("El portal no devolvió la ficha")
  val episodes=asset.optJSONArray("simpleProgramList").objects().mapIndexed { index, it->Episode(it.text("contentId"),it.optInt("seriesNumber",index+1),it.text("name"),PlaybackPolicy.duration(it.text("duration")),asset.optInt("seasonNumber",1)) }
  val seasons=asset.optJSONArray("sameSeasonSeriesList").objects().map { Season(it.text("contentId"),it.optInt("seasonNumber",1)) }
  return Details(asset.title(title.kind).copy(id=title.id,kind=title.kind),episodes,seasons)
 }
 override suspend fun resolve(title: Title,episode: Episode?,seasonId: String,maxHeight: Int,preferredAudio: String): Stream {
  if(title.kind==Kind.LIVE)return resolveLive(title)
  val play=call("v10/startPlayVOD",JSONObject().put("contentId",episode?.id?:title.id).put("seriesContentId",if(episode!=null)seasonId.ifBlank { title.id } else "").put("startTime",0).put("type","1").put("columnId",0).put("authType",""))
  val program=play.optJSONArray("episodeList")?.optJSONObject(0)?:throw java.io.IOException("No hay pistas disponibles")
  val tracks=program.optJSONArray("totalMovieList").objects().flatMap { group->group.optJSONArray("movieList").objects().map { if(it.text("quality").isBlank())it.put("quality",group.text("quality"));it } }.filter { it.text("contentId").isNotBlank() }

  val chosenHeight=DataPolicy.chooseHeight(tracks.map { vodHeight(it) },maxHeight)
  val available=tracks.filter { chosenHeight==0||vodHeight(it)==chosenHeight }
  val selected=available.sortedWith(compareByDescending<JSONObject> { if(preferredAudio.isNotBlank()&&(it.text("contentId")==preferredAudio||vodAudio(it).equals(preferredAudio,true)))1 else 0 }.thenByDescending { vodHeight(it) }.thenByDescending { PlaybackPolicy.audioScore(vodAudio(it),it.text("languageName")) }).firstOrNull()?:throw java.io.IOException("No hay vídeo disponible")
  val license=selected.optJSONArray("licenseList")?.optJSONObject(0)?.text("license").orEmpty();if(license.isBlank())throw java.io.IOException("El portal no entregó autorización de vídeo")
  val extension=if(selected.text("videoFormat").equals("ts",true))"ts" else "mp4"
  val sources=cdnSources("vod",license,"/vod/${selected.text("contentId")}_media.$extension")
  val subtitles=program.optJSONArray("subtitleList").objects().mapNotNull { item->val file=item.optJSONArray("file")?.optJSONObject(0)?:return@mapNotNull null;val url=file.text("url");if(!url.startsWith("http"))return@mapNotNull null;Subtitle(url,item.text("language"),if(file.text("fileType").equals("vtt",true))"text/vtt" else "application/x-subrip",item.text("name")) }
  return Stream(sources,if(extension=="ts")"video/mp2t" else "video/mp4",PlaybackPolicy.duration(selected.text("duration").ifBlank { program.text("duration") }),subtitles,selected.text("quality"),vodFps(selected),available.distinctBy {vodAudio(it)+it.text("languageName")}.map {Track(it.text("contentId"),vodAudio(it),it.text("languageName").ifBlank {vodAudio(it)},it.text("contentId")==selected.text("contentId"))})
 }
 private suspend fun resolveLive(title: Title): Stream {
  val result=call("v4/startPlayLive",JSONObject().put("channelCode",title.id).put("type","1"));val address=result.optJSONArray("liveAddressList").objects().firstOrNull { it.text("license").isNotBlank() }?:throw java.io.IOException("No hay autorización para el canal")
  return Stream(cdnSources("live",address.text("license"),"/live/${address.text("playCode").ifBlank { title.id }}.m3u8"),"application/x-mpegURL")
 }
 private suspend fun cdnSources(tag: String,license: String,path: String): List<Source> {
  val bean=JSONObject().put("hasPay","0").put("userIdentity","1").put("type","merge").put("appVer","49902").put("lang","es").put("encMediaSupported",1).put("liveCodeList",JSONArray().put("masnew_live")).put("appParams","").put("reserve1","583442714b345572434a4d5769637461545a735936413d3d").put("pipFlag","0")
  for(route in listOf("v15/getSlbInfo","v14/getSlbInfo")) {
   val data=try { call(route,bean) } catch(error: PortalException) { if(error.code=="portal200001"||error.code=="portal100024")throw error else continue }
   val sources=data.optJSONArray("cdn_list").objects().filter { it.text("tag")==tag }.flatMap { cdn->
    val urls=cdn.optJSONArray("url_list").objects();val signed=urls.firstOrNull { (tag=="live"||it.text("tag")=="free"||it.text("url").contains("tag=free"))&&it.text("url").isNotBlank() }?:return@flatMap emptyList()
    var auth=signed.text("url");if(tag=="live"){val token=Regex("token=([a-fA-F0-9]{32})").find(auth)?.groupValues?.get(1).orEmpty();val now=System.currentTimeMillis();auth+="&sign2_method=sign_o3&instance=0&start_moment=$now&sign2=${PortalCrypto.liveSign(token,now)}"}
    listOf(cdn.text("main_addr"),cdn.text("spared_addr")).filter { it.isNotBlank() }.distinct().map { base->Source((if(base.startsWith("http"))base else "https://$base").trimEnd('/')+path,mapOf("Content-Auth" to auth,"Content-License" to license,"User-Agent" to "Ranger/4.9.4-17294ac0","App" to PortalClient.APP_ID,"App-Version" to "49902")) }
   }.distinctBy { it.url }.take(6)
   if(sources.isNotEmpty())return sources
  }
  throw java.io.IOException("El portal no entregó servidores de reproducción")
 }
}
class FixtureRepository: CatalogRepository {
 private fun items(section: Section)=(1..12).map { Title("demo-${section.name}-$it",if(section==Section.TV)"Canal de prueba $it" else if(section==Section.SERIES)"Horizontes · Serie $it" else "Viaje a la luz $it",section.kind,year="2026",synopsis="Contenido de prueba local para comprobar la interfaz, la navegación y el reproductor. No pertenece al catálogo del portal.",genres=listOf("Action","Drama"),durationSeconds=12) }
 override suspend fun browse(section: Section,query: Query,page: Int)=Page(if(page>1)emptyList() else items(section).filter { query.text.isBlank()||it.name.contains(query.text,true) },page,false,12)
 override suspend fun categories(section: Section)=listOf(Choice("action","Acción"),Choice("drama","Drama"),Choice("crime","Crimen"),Choice("thriller","Suspenso"))
 override suspend fun filters(section: Section)=Filters(listOf(Choice("Action","Acción"),Choice("Drama","Drama")),listOf(Choice("2026","2026")))
 override suspend fun details(title: Title,seasonId: String)=Details(title,if(title.kind==Kind.SERIES)(1..3).map { Episode("demo-episode-$it",it,"Episodio $it",12) } else emptyList(),if(title.kind==Kind.SERIES)listOf(Season(title.id,1)) else emptyList())
 override suspend fun resolve(title: Title,episode: Episode?,seasonId: String,maxHeight: Int,preferredAudio: String)=Stream(listOf(Source("asset:///demo.mp4")),"video/mp4",12,listOf(Subtitle("asset:///demo.srt","es","application/x-subrip","Español de prueba")))
}
