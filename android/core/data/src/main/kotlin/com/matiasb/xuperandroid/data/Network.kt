package com.matiasb.xuperandroid.data
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.dnsoverhttps.DnsOverHttps
import java.net.InetAddress
import java.util.concurrent.*
import java.io.IOException
internal data class ResolverEndpoint(val ip: String,val host: String,val path: String,val provider: String)

/** Race independent secure resolvers; retain Android DNS as a bounded, delayed fallback. */
class BoundedDns(
 private val resolvers: List<Dns> = secureResolvers(),
 private val systemDns: Dns = Dns.SYSTEM,
 private val budgetMs: Long = 3500,
 private val systemDelayMs: Long = 350
) : Dns {
 private val cache=ConcurrentHashMap<String,Pair<Long,List<InetAddress>>>()
 override fun lookup(hostname: String): List<InetAddress> {
  cache[hostname]?.takeIf { System.currentTimeMillis()-it.first<60_000 }?.let { return it.second }
  val answers=LinkedBlockingQueue<Result<List<InetAddress>>>()
  val tasks=mutableListOf<Future<*>>()
  fun submit(pool: ThreadPoolExecutor,dns: Dns,delayMs: Long=0) {
   try { tasks+=pool.submit {
    val result=runCatching {
     if(delayMs>0)Thread.sleep(delayMs)
     dns.lookup(hostname).distinct().sortedBy { if(it is java.net.Inet4Address)0 else 1 }
      .also { if(it.isEmpty())throw java.net.UnknownHostException(hostname) }
    }
    answers.offer(result)
   } } catch(error: RejectedExecutionException) { answers.offer(Result.failure(error)) }
  }
  resolvers.forEach {submit(securePool,it)}
  submit(systemPool,systemDns,systemDelayMs)
  val deadline=System.nanoTime()+TimeUnit.MILLISECONDS.toNanos(budgetMs)
  var last: Throwable?=null
  try {
   repeat(resolvers.size+1) {
    val remaining=deadline-System.nanoTime()
    if(remaining<=0)throw java.net.UnknownHostException("DNS agotó su tiempo de espera: $hostname")
    val result=answers.poll(remaining,TimeUnit.NANOSECONDS)
     ?:throw java.net.UnknownHostException("DNS agotó su tiempo de espera: $hostname")
    result.getOrNull()?.let { addresses->
     if(cache.size>=64)cache.clear()
     cache[hostname]=System.currentTimeMillis() to addresses
     return addresses
    }
    last=result.exceptionOrNull()
   }
   throw java.net.UnknownHostException("No se pudo resolver $hostname").apply {initCause(last)}
  } catch(error: InterruptedException) {
   Thread.currentThread().interrupt()
   throw java.net.UnknownHostException("Consulta DNS cancelada: $hostname").apply {initCause(error)}
  } finally {tasks.forEach {it.cancel(true)};securePool.purge();systemPool.purge()}
 }
 companion object {
  // Separate bounded pools keep a stuck platform resolver from starving secure DNS.
  private fun pool(size: Int,name: String)=ThreadPoolExecutor(size,size,0L,TimeUnit.MILLISECONDS,ArrayBlockingQueue<Runnable>(128),{task->Thread(task,name).apply {isDaemon=true}})
  private val securePool=pool(6,"xuper-secure-dns")
  private val systemPool=pool(2,"xuper-system-dns")
  private fun secureResolvers(): List<Dns> {
   val http=OkHttpClient.Builder().callTimeout(2500,TimeUnit.MILLISECONDS).build()
   return SHARED_RESOLVERS.map { endpoint->DnsOverHttps.Builder().client(http)
    .url(("https://"+endpoint.host+endpoint.path).toHttpUrl())
    .bootstrapDnsHosts(InetAddress.getByName(endpoint.ip))
    .includeIPv6(false).build() }
  }
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
