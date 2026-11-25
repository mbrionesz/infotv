package com.matiasb.xuperandroid.data
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.dnsoverhttps.DnsOverHttps
import java.net.InetAddress
import java.util.concurrent.*
import java.io.IOException
class BoundedDns : Dns {
 private val executor=Executors.newFixedThreadPool(2) { task -> Thread(task,"xuper-dns").apply { isDaemon=true } }
 private val secure=DnsOverHttps.Builder().client(OkHttpClient.Builder().callTimeout(2500,TimeUnit.MILLISECONDS).build()).url("https://cloudflare-dns.com/dns-query".toHttpUrl()).bootstrapDnsHosts(InetAddress.getByName("1.1.1.1"),InetAddress.getByName("1.0.0.1")).build()
 private val cache=ConcurrentHashMap<String,Pair<Long,List<InetAddress>>>()
 override fun lookup(hostname: String): List<InetAddress> {
  cache[hostname]?.takeIf { System.currentTimeMillis()-it.first<60_000 }?.let { return it.second }
  val system=executor.submit<List<InetAddress>> { Dns.SYSTEM.lookup(hostname) }
  val addresses=try { system.get(1200,TimeUnit.MILLISECONDS) } catch (_: Exception) { system.cancel(true);secure.lookup(hostname) }
  if(addresses.isEmpty())throw java.net.UnknownHostException(hostname)
  if(cache.size>=64)cache.clear();cache[hostname]=System.currentTimeMillis() to addresses;return addresses
 }
}
/** Each request, including HLS segments, gets credentials only for its own origin. */
class OriginCredentials(private val credentials: () -> Map<String,Map<String,String>>) : Interceptor {
 override fun intercept(chain: Interceptor.Chain): Response {
  var request=chain.request();var previous=request.url
  for(attempt in 0..5){
   if(request.url.scheme=="http" && request.url.host !in LEGACY_HTTP)throw IOException("El portal entregó un servidor HTTP no habilitado en esta alpha")
   val builder=request.newBuilder();for(name in PRIVATE_HEADERS)builder.removeHeader(name)
   credentials()[origin(request.url)]?.forEach { (key,value)->require(!value.contains('\r')&&!value.contains('\n'));builder.header(key,value) }
   val response=chain.proceed(builder.build())
   if(response.code !in listOf(301,302,303,307,308))return response
   val next=response.header("Location")?.let { request.url.resolve(it) } ?: return response
   response.close();if(previous.isHttps && !next.isHttps)throw IOException("Redirección insegura del servidor")
   request=request.newBuilder().url(next).build();previous=next
  }
  throw IOException("Demasiadas redirecciones")
 }
 companion object {
  val LEGACY_HTTP=setOf("yuwc.swzablvpm.com","buec.kyalbhxgw.com")
  val PRIVATE_HEADERS=listOf("Content-Auth","Content-License","Authorization","Cookie","App","App-Version")
  fun origin(url: HttpUrl)="${url.scheme}://${url.host}:${url.port}"
 }
}
fun networkClient()=OkHttpClient.Builder().dns(BoundedDns()).connectTimeout(5,TimeUnit.SECONDS).readTimeout(12,TimeUnit.SECONDS).callTimeout(15,TimeUnit.SECONDS).followRedirects(false).followSslRedirects(false).build()
