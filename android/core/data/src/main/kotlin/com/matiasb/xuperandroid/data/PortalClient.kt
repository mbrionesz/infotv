package com.matiasb.xuperandroid.data
import android.os.Build
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.sync.withPermit
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.security.MessageDigest
import java.util.Base64
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
class PortalException(val code: String): IOException(when(code){"portal100024"->"El portal restringe el acceso en esta región";"portal200001"->"El portal requiere actualizar el perfil de conexión";else->"El portal respondió $code"})
suspend fun Call.await(): Response = suspendCancellableCoroutine { continuation ->
 continuation.invokeOnCancellation { cancel() }
 enqueue(object: Callback {
  override fun onFailure(call: Call,e: IOException) { if(continuation.isActive)continuation.resumeWithException(e) }
  override fun onResponse(call: Call,response: Response) { if(continuation.isActive)continuation.resume(response) else response.close() }
 })
}
fun interface PortalRequests { suspend fun request(route: String,bean: JSONObject): JSONObject }
class PortalClient(private val vault: SessionVault, val http: OkHttpClient=networkClient(),private val observe: suspend (Map<String,String>)->Unit={}) : PortalRequests {
 private val mutex=Mutex();@Volatile private var session: JSONObject?=vault.read();@Volatile private var preferred=""
 private val hosts=listOf("ftmrmy.jdfey0cd.com","fuxok.nguvmqhpk.com","eajmnp.hcgv1dt8.com","mptec.dhkrxuzcy.com","hinumz.a878kkoyc.com","krdwvd.swcaw7qx.com","osuhk.m3x8o50te.com","oogoy.f30c96w8.com","dtgrd.txhnojlbu.com","c2tgd.izvhrdcjb.com")
 private fun device()=JSONObject().put("loginType","2").put("appLanguage","en").put("hardwareInfo",Build.HARDWARE).put("model",Build.MODEL).put("product",Build.PRODUCT).put("cpu",Build.SUPPORTED_ABIS.firstOrNull().orEmpty()).put("B29","").put("reserve1","583442714b345572434a4d5769637461545a735936413d3d").put("deviceToken","").put("drmId",Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(vault.installationId.toByteArray()))).put("sdkVer",PROTOCOL_SDK).put("apkVersion",APK_VERSION).put("sysVersion",PROFILE).put("appId",APP_ID).put("sn",session?.optString("sn").orEmpty())
 private suspend fun rpc(route: String, bean: JSONObject, authenticated: Boolean=true): JSONObject = withContext(Dispatchers.IO) { withTimeout(22_000) {
  require(route.matches(Regex("[a-zA-Z0-9/]+")))
  val payload=device();if(authenticated){payload.put("portalCode","masnew");payload.put("userId",session?.optString("userId"));payload.put("userToken",session?.optString("userToken"))};bean.keys().forEach { key->payload.put(key,bean.get(key)) }
  val encoded=PortalCrypto.encrypt(payload.toString())
  coroutineScope {
   val replies=Channel<Result<JSONObject>>(Channel.UNLIMITED);val gate=Semaphore(3);val ordered=(listOf(preferred)+hosts).filter { it.isNotBlank() }.distinct();var last: Throwable=IOException("El portal no respondió");var retired: PortalException?=null
   val jobs=ordered.mapIndexed { index, host->launch { delay(index*250L);gate.withPermit {
    val result=runCatching {
     val request=Request.Builder().url("https://$host/api/portalCore/$route").header("apk",APP_ID).header("apkVer",APK_HEADER).header("spkgVer",PROFILE).header("User-Agent","okhttp/3.12.12").post(encoded.toRequestBody("application/json;charset=utf-8".toMediaType())).build()
     http.newBuilder().callTimeout(7,java.util.concurrent.TimeUnit.SECONDS).build().newCall(request).await().use { response->
      if(!response.isSuccessful)throw IOException("El portal respondió HTTP ${response.code}")
      val source=response.body?.source() ?: throw IOException("Respuesta vacía");source.request(8*1024*1024L+1);if(source.buffer.size>8*1024*1024)throw IOException("Respuesta del portal demasiado grande")
      val envelope=JSONObject(source.readUtf8());val code=envelope.optString("returnCode",envelope.optString("code","0"));if(code.isNotEmpty()&&code!="0")throw PortalException(code)
      val raw=envelope.opt("data");val data=when(raw){is String->if(raw.isNotBlank())JSONObject(PortalCrypto.decrypt(raw)) else JSONObject();is JSONObject->raw;else->envelope}
      val versions=mutableMapOf<String,String>();for(obj in listOf(envelope,data))for(key in listOf("apkVersion","apkver","apkVer","spkgVer","sysVersion")){val value=obj.opt(key);if(value is String||value is Number)versions[key]=value.toString().take(100)};observe(versions)
      preferred=host;data
     }
    }
    if(isActive)replies.send(result)
   } } }
   try { repeat(ordered.size) { val result=replies.receive();if(result.isSuccess)return@coroutineScope result.getOrThrow();last=result.exceptionOrNull()!!;if(last is PortalException){val error=last as PortalException;if(error.code=="portal200001")retired=error else throw error} };throw retired ?: last }
   finally { jobs.forEach { it.cancel() };replies.close() }
  }
 }
 }
 override suspend fun request(route: String,bean: JSONObject): JSONObject {
  ensureSession()
  try { return rpc(route,bean) } catch(error: PortalException) {
   if(error.code !in setOf("aaa100027","aaa100028","aaa100080","aaa100082","aaa100083"))throw error
   mutex.withLock { session=null;vault.clear() };ensureSession();return rpc(route,bean)
  }
 }
 private suspend fun ensureSession()=mutex.withLock {
  val old=session;if(old!=null&&old.optString("userToken").isNotBlank()&&old.optString("profile")==PROFILE&&System.currentTimeMillis()-old.optLong("at")<6*60*60*1000L)return@withLock
  session=null
  val identity=vault.installationId.replace("-","");val fingerprint=JSONObject().put("board",Build.BOARD).put("brand",Build.BRAND).put("cpuAbi",Build.SUPPORTED_ABIS.firstOrNull().orEmpty()).put("device",Build.DEVICE).put("diskInfo","8GB").put("display",Build.DISPLAY).put("fingerprint",Build.FINGERPRINT).put("hardware",Build.HARDWARE).put("host",Build.HOST).put("manufacturer",Build.MANUFACTURER).put("ramSize","4GB").put("romSize","8GB").put("tags",Build.TAGS).put("verId",Build.ID).put("androidId",identity.take(16)).put("cpuId",identity.takeLast(16)).put("serialNumber",identity.take(16)).put("etheMac","02:00:00:00:00:00").put("gatewayMac","02:00:00:00:00:00").put("wifiMac","02:00:00:00:00:00")
  val token=rpc("v3/snToken",fingerprint,false);val snToken=token.optString("snToken");if(snToken.isBlank())throw IOException("El portal no devolvió identidad de instalación")
  val sn=token.optString("sn").ifBlank { PortalCrypto.md5(snToken+"ntFT65w6itH!lHCPw7D=@qnsFC5adD28") };session=JSONObject().put("sn",sn)
  val active=rpc("v8/active",JSONObject().put("snToken",snToken).put("authVersion","").put("authCode","").put("preCode","").put("macAddr","02:00:00:00:00:00").put("reserve1","").put("openNum",4).put("channel","default").put("matadata","").put("signdata",""),false)
  if(active.optString("userToken").isBlank())throw IOException("La sesión propia no pudo activarse")
  session=JSONObject().put("sn",sn).put("userId",active.optString("userId")).put("userToken",active.optString("userToken")).put("at",System.currentTimeMillis()).put("profile",PROFILE);vault.save(session!!)
 }

 fun reset() { session=null;vault.clear() }
 companion object { const val APP_ID="com.android.msandroid";const val PROFILE="2024-09-10 06:25:30_33_13_";const val PROTOCOL_SDK=33;const val APK_VERSION="49902";const val APK_HEADER="43404" }
}
