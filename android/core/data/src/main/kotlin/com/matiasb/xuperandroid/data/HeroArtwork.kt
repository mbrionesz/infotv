package com.matiasb.xuperandroid.data
import android.content.Context
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

/** Only the three visible showcase titles use TMDB. Positive and negative matches survive restarts. */
class HeroArtwork(context: Context,client: OkHttpClient) {
 private val file=File(context.filesDir,"hero-artwork.json")
 private val gate=Mutex()
 private val http=client.newBuilder().callTimeout(8,TimeUnit.SECONDS).build()
 private var cache: JSONObject?=null
 suspend fun image(title: Title): String?=withContext(Dispatchers.IO){gate.withLock {
  val entries=cache?:runCatching {JSONObject(file.readText())}.getOrDefault(JSONObject()).also {cache=it}
  val key="${title.kind}:${title.id}:${title.name}:${title.year}"
  val old=entries.optJSONObject(key)
  if(old!=null&&System.currentTimeMillis()-old.optLong("at")<30*86400000L)return@withLock old.optString("url").ifBlank {null}
  if(title.kind==Kind.LIVE)return@withLock null
  // Public application key explicitly authorized by the owner; never a portal credential.
  val type=if(title.kind==Kind.SERIES)"tv" else "movie"
  val url=okhttp3.HttpUrl.Builder().scheme("https").host("api.themoviedb.org").addPathSegments("3/search/$type").addQueryParameter("api_key",PUBLIC_KEY).addQueryParameter("query",title.name).addQueryParameter("language","es-MX").addQueryParameter("include_adult","false").build()
  val result=try {http.newCall(Request.Builder().url(url).build()).await().use {response->if(!response.isSuccessful)return@withLock null;val source=response.body?.source()?:return@withLock null;source.request(1024*1024L+1);if(source.buffer.size>1024*1024)return@withLock null;JSONObject(source.readUtf8())}}catch(error: CancellationException){throw error}catch(_: Exception){return@withLock null}
  fun normalized(value: String)=java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFD).replace(Regex("\\p{M}"),"").lowercase().replace(Regex("[^\\p{L}\\p{N}]"),"")
  val match=result.optJSONArray("results").objects().firstOrNull {row->listOf("title","original_title","name","original_name").any {normalized(row.optString(it))==normalized(title.name)}&&(title.year.isBlank()||row.optString(if(type=="tv")"first_air_date" else "release_date").startsWith(title.year))}
  val path=match?.optString("backdrop_path").orEmpty();val image=path.takeIf {it.startsWith('/') }?.let {"https://image.tmdb.org/t/p/w1280$it"}
  entries.put(key,JSONObject().put("at",System.currentTimeMillis()).put("url",image.orEmpty()))
  val sorted=entries.keys().asSequence().toList().sortedByDescending {entries.getJSONObject(it).optLong("at")}
  sorted.drop(60).forEach {entries.remove(it)}
  // A failed disk write must never hide the portal's own image or block the catalogue.
  runCatching {val temp=File(file.parentFile,"hero-artwork.tmp");temp.writeText(entries.toString());if(!temp.renameTo(file))temp.delete()}
  image
 }}
 companion object {private const val PUBLIC_KEY="1e45919b1db4079b3fd3b2be76e2e107"}
}
