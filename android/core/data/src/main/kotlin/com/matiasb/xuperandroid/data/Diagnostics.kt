package com.matiasb.xuperandroid.data
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import android.os.SystemClock

data class HostCheck(val host: String,val status: Int?,val elapsedMs: Long,val error: String?=null)
data class NetworkReport(val hosts: List<HostCheck> = emptyList(),val megabits: Double?=null,val bytes: Long=0,val error: String?=null){val consistent: Boolean? get()=hosts.filter {it.status!=null}.takeIf {it.size>=2}?.let {list->list.maxOf{it.elapsedMs}-list.minOf{it.elapsedMs}<200}}
class Diagnostics(private val client: OkHttpClient) {
 suspend fun run(origins: List<String>): NetworkReport=withContext(Dispatchers.IO) {
  val limited=client.newBuilder().callTimeout(5,TimeUnit.SECONDS).build()
  val hosts=supervisorScope { origins.distinct().take(4).map { origin->async { val start=SystemClock.elapsedRealtime();try { limited.newCall(Request.Builder().url(origin.trimEnd('/')+"/").head().build()).await().use { HostCheck(it.request.url.host,it.code,SystemClock.elapsedRealtime()-start) } }catch(error: CancellationException){throw error}catch(_: Exception){HostCheck(runCatching {java.net.URI(origin).host}.getOrDefault("Servidor"),null,SystemClock.elapsedRealtime()-start,"No respondió")} } }.awaitAll() }
  val start=SystemClock.elapsedRealtime();var bytes=0L
  try { limited.newCall(Request.Builder().url("https://speed.cloudflare.com/__down?bytes=1048576").build()).await().use { response->if(!response.isSuccessful)throw java.io.IOException("HTTP ${response.code}");val body=response.body?:throw java.io.IOException("Sin datos");val stream=body.byteStream();val buffer=ByteArray(16*1024);while(bytes<1048576){ensureActive();val read=stream.read(buffer,0,minOf(buffer.size,(1048576-bytes).toInt()));if(read<0)break;bytes+=read};NetworkReport(hosts,if(bytes>0)bytes*8.0/((SystemClock.elapsedRealtime()-start).coerceAtLeast(1)*1000.0)else null,bytes) } }
  catch(error: CancellationException){throw error}catch(_: Exception){NetworkReport(hosts,null,bytes,"La medición de descarga no estuvo disponible")}
 }
}
