package com.matiasb.xuperandroid.data
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.io.IOException
class VodFlowTest {
 private val movie=Title("movie-root","Película de prueba",Kind.MOVIE)
 private val series=Title("series-root","Serie de prueba",Kind.SERIES)
 private fun track(id: String,height: Int,audio: String="es-419",licensed: Boolean=true)=JSONObject().put("contentId",id).put("videoHeight",height).put("quality","${height}p").put("audioInfo",audio).put("videoFormat","ts").put("frameRate","24000/1001").put("licenseList",JSONArray().apply {if(licensed)put(JSONObject().put("license","fixture-license"))})
 private fun vod(vararg tracks: JSONObject)=JSONObject().put("duration","01:00:00").put("episodeList",JSONArray().put(JSONObject().put("totalMovieList",JSONArray().put(JSONObject().put("movieList",JSONArray(tracks.toList())))).put("subtitleList",JSONArray().put(JSONObject().put("language","es").put("file",JSONArray().put(JSONObject().put("url","https://subtitles.example/es.srt").put("fileType","srt")))))))
 private fun cdn()=JSONObject().put("cdn_list",JSONArray().put(JSONObject().put("tag","vod").put("main_addr","https://video.example").put("spared_addr","https://backup.example").put("url_list",JSONArray().put(JSONObject().put("tag","free").put("url","fixture-auth")))))
 private fun repo(video: JSONObject,calls: MutableList<Pair<String,JSONObject>> = mutableListOf(),extra: (String,JSONObject)->JSONObject?={_,_->null})=PortalRepository(PortalRequests {route,bean->
  calls+=route to JSONObject(bean.toString())
  extra(route,bean)?:when(route){"v10/startPlayVOD"->video;"v15/getSlbInfo","v14/getSlbInfo"->cdn();else->throw IOException("Unexpected route: $route")}
 })
 @Test fun movieNeverSendsSeriesIdentifiersEvenIfGivenAnEpisode()=runBlocking {
  val calls=mutableListOf<Pair<String,JSONObject>>()
  val stream=repo(vod(track("video-1080",1080)),calls).resolve(movie,Episode("accidental-episode",1,""),"accidental-season")
  val request=calls.first().second
  assertEquals("movie-root",request.getString("contentId"));assertEquals("",request.getString("seriesContentId"))
  assertEquals(2,stream.sources.size);assertEquals("https://video.example/vod/video-1080_media.ts",stream.sources.first().url)
  assertEquals("fixture-license",stream.sources.first().headers["Content-License"]);assertEquals(3600L,stream.durationSeconds);assertEquals(1,stream.subtitles.size)
 }
 @Test fun seriesUsesExplicitEpisodeAndSeasonAndRequiresAnEpisode()=runBlocking {
  val calls=mutableListOf<Pair<String,JSONObject>>();val repository=repo(vod(track("video-720",720)),calls)
  repository.resolve(series,Episode("episode-2",2,"Episodio 2"),"season-3")
  assertEquals("episode-2",calls.first().second.getString("contentId"));assertEquals("season-3",calls.first().second.getString("seriesContentId"))
  try {repository.resolve(series);fail("Missing episode must be reported before contacting portal")}catch(_: IOException){}
  assertEquals(2,calls.size)
 }
 @Test fun highestAuthorizedQualityWinsAndBlankFirstLicenseIsIgnored()=runBlocking {
  val high=track("licensed-1080",1080).put("licenseList",JSONArray().put(JSONObject().put("license","")).put(JSONObject().put("license","fixture-valid")))
  val stream=repo(vod(track("unlicensed-4k",2160,licensed=false),track("licensed-720",720),high)).resolve(movie)
  assertEquals("1080p",stream.quality);assertTrue(stream.sources.first().url.contains("licensed-1080"));assertEquals("fixture-valid",stream.sources.first().headers["Content-License"])
 }
 @Test fun explicitAudioCanUseDifferentQualityAndAllLanguagesRemainSelectable()=runBlocking {
  val repository=repo(vod(track("spanish-1080",1080),track("japanese-720",720,"ja")))
  val automatic=repository.resolve(movie);assertEquals("1080p",automatic.quality);assertEquals(2,automatic.portalAudio.size)
  val selected=repository.resolve(movie,preferredAudio="japanese-720")
  assertEquals("720p",selected.quality);assertEquals("ja",selected.portalAudio.single {it.selected}.language)
 }
 @Test fun cellularCapStillAppliesToSelectedAudio()=runBlocking {
  val stream=repo(vod(track("spanish-1080",1080),track("spanish-720",720))).resolve(movie,maxHeight=720,preferredAudio="es-419")
  assertEquals("720p",stream.quality)
 }
 @Test fun slbNetworkFailureUsesAlternativeRouteButRegionalRejectionDoesNot()=runBlocking {
  val calls=mutableListOf<Pair<String,JSONObject>>()
  val repository=repo(vod(track("video",720)),calls){route,_->if(route=="v15/getSlbInfo")throw IOException("fixture network failure")else null}
  assertTrue(repository.resolve(movie).sources.isNotEmpty());assertEquals(listOf("v10/startPlayVOD","v15/getSlbInfo","v14/getSlbInfo"),calls.map {it.first})
  calls.clear()
  val blocked=repo(vod(track("video",720)),calls){route,_->if(route=="v15/getSlbInfo")throw PortalException("portal100024")else null}
  try {blocked.resolve(movie);fail("Regional rejection must be reported")}catch(error: PortalException){assertEquals("portal100024",error.code)}
  assertFalse(calls.any {it.first=="v14/getSlbInfo"})
 }
 @Test fun detailCompatibilityFallbackKeepsMoviesSeparateFromEpisodes()=runBlocking {
  val calls=mutableListOf<Pair<String,JSONObject>>()
  val repository=repo(JSONObject(),calls){route,bean->
   require(route=="v4/getItemData")
   if(bean.getString("type")=="0")throw PortalException("portal100006")
   JSONObject().put("assetData",JSONObject().put("contentId","movie-root").put("name","Película").put("simpleProgramList",JSONArray().put(JSONObject().put("contentId","program-1").put("seriesNumber",1))))
  }
  val details=repository.details(movie)
  assertTrue(details.episodes.isEmpty());assertEquals(listOf("0","1"),calls.map {it.second.getString("type")})
 }
 @Test fun malformedResponseAndMissingLicenseAreErrorsNotEmptySuccessfulStreams()=runBlocking {
  for(response in listOf(JSONObject(),vod(track("unlicensed",1080,licensed=false)))) {
   try {repo(response).resolve(movie);fail("Invalid response must fail cleanly")}catch(_: IOException){}
  }
 }
 @Test fun explicitVariantStaysMarkedAndSavedLanguageNameDisambiguatesSpanishTracks()=runBlocking {
  val latin=track("latin-1080",1080,"es").put("languageName","Español latino")
  val spain=track("spain-720",720,"es").put("languageName","Castellano")
  val repository=repo(vod(latin,spain,track("latin-720",720,"es").put("languageName","Español latino")))
  val manual=repository.resolve(movie,preferredAudio="latin-720")
  assertEquals("latin-720",manual.portalAudio.single {it.selected}.id)
  val restored=repository.resolve(movie,preferredAudio="es",preferredAudioName="Castellano")
  assertTrue(restored.sources.first().url.contains("spain-720"));assertEquals("Castellano",restored.portalAudio.single {it.selected}.name)
 }

}
