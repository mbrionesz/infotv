package com.matiasb.xuperandroid.data

import kotlinx.coroutines.*
import okhttp3.*
import okio.Buffer
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class PortalSessionTest {
 private class Store(initial: JSONObject?): PortalSessionStore {
  override val installationId="fixture-installation-0000000000000000"
  @Volatile var value=initial
  val saves=AtomicInteger();val clears=AtomicInteger()
  override fun read()=value
  override fun save(session: JSONObject){value=session;saves.incrementAndGet()}
  override fun clear(){value=null;clears.incrementAndGet()}
 }
 private fun session(profile: String=PortalClient.PROFILE)=JSONObject().put("sn","fixture-old-sn").put("userId","fixture-user").put("userToken","fixture-old-token").put("profile",profile).put("at",System.currentTimeMillis())
 private fun client(store: Store,reply: (Request,String,JSONObject)->JSONObject): PortalClient {
  // Intercept every request before DNS/TLS. No portal session or network is used.
  val http=OkHttpClient.Builder().addInterceptor {chain->
   val request=chain.request();val buffer=Buffer();request.body!!.writeTo(buffer)
   val payload=JSONObject(PortalCrypto.decrypt(buffer.readUtf8()))
   val route=request.url.encodedPath.removePrefix("/api/portalCore/")
   Response.Builder().request(request).protocol(Protocol.HTTP_1_1).code(200).message("fixture")
    .body(ResponseBody.create(null,reply(request,route,payload).toString())).build()
  }.build()
  return PortalClient(store,http,deviceInfo={JSONObject().put("model","fixture-tablet")},fingerprintInfo={JSONObject().put("brand","fixture")})
 }
 private fun ok(data: JSONObject)=JSONObject().put("returnCode","0").put("data",PortalCrypto.encrypt(data.toString()))
 private fun activation()=ok(JSONObject().put("userId","fixture-user").put("userToken","fixture-fresh-token"))
 private fun identity()=ok(JSONObject().put("snToken","fixture-bootstrap").put("sn","fixture-fresh-sn"))
 private fun rejected()=JSONObject().put("returnCode","aaa100083")

 @Test fun oldProfileRenewsBeforeCatalogAndSendsEffectiveProfileInHeadersAndBody()=runBlocking {
  val store=Store(session("2024-09-10 06:25:30_33_13_"));val calls=java.util.Collections.synchronizedList(mutableListOf<String>())
  val api=client(store){request,route,body->
   calls+=route
   assertEquals(PortalClient.APP_ID,request.header("apk"));assertEquals(PortalClient.APK_HEADER,request.header("apkVer"));assertEquals(PortalClient.PROFILE,request.header("spkgVer"))
   assertEquals(PortalClient.APP_ID,body.getString("appId"));assertEquals(PortalClient.PROFILE,body.getString("sysVersion"));assertEquals(PortalClient.PROTOCOL_SDK,body.getInt("sdkVer"));assertEquals(PortalClient.APK_VERSION,body.getString("apkVersion"))
   when(route){
    "v3/snToken"->{assertFalse(body.has("userToken"));assertEquals(store.installationId.replace("-","").take(16),body.getString("androidId"));identity()}
    "v8/active"->{assertEquals("fixture-fresh-sn",body.getString("sn"));activation()}
    else->{assertEquals("fixture-fresh-token",body.getString("userToken"));assertEquals("fixture-fresh-sn",body.getString("sn"));ok(JSONObject().put("catalog",true))}
   }
  }
  assertTrue(api.request("v7/getLiveData",JSONObject()).getBoolean("catalog"))
  assertEquals(listOf("v3/snToken","v8/active","v7/getLiveData"),calls.toList());assertEquals(1,store.saves.get());assertEquals(PortalClient.PROFILE,store.value!!.getString("profile"))
 }

 @Test fun lateRejectionFromOldRequestCannotInvalidateFreshConcurrentSession()=runBlocking {
  val store=Store(session());val started=CountDownLatch(2);val freshUsed=CountDownLatch(1);val activations=AtomicInteger()
  val api=client(store){_,route,body->when(route){
   "v3/snToken"->identity()
   "v8/active"->{activations.incrementAndGet();activation()}
   else->if(body.optString("userToken")=="fixture-old-token"){
    started.countDown();check(started.await(5,TimeUnit.SECONDS))
    if(route=="v1/second")check(freshUsed.await(5,TimeUnit.SECONDS))
    rejected()
   }else{
    assertEquals("fixture-fresh-token",body.getString("userToken"));assertEquals("fixture-fresh-sn",body.getString("sn"))
    freshUsed.countDown();ok(JSONObject().put("route",route))
   }
  }}
  val first=async(Dispatchers.Default){api.request("v1/first",JSONObject())}
  val second=async(Dispatchers.Default){api.request("v1/second",JSONObject())}
  assertEquals("v1/first",first.await().getString("route"));assertEquals("v1/second",second.await().getString("route"))
  assertEquals("Only the rejected session should be replaced",1,activations.get());assertEquals(1,store.clears.get());assertEquals(1,store.saves.get())
 }

 @Test fun continuedSessionRejectionHasBoundedRetryAndKeepsExactCode()=runBlocking {
  val store=Store(session());val activations=AtomicInteger()
  val api=client(store){_,route,_->when(route){"v3/snToken"->identity();"v8/active"->{activations.incrementAndGet();activation()};else->rejected()}}
  try {api.request("v7/getLiveData",JSONObject());fail("A repeated rejection must be reported")}
  catch(error: PortalException){assertEquals("aaa100083",error.code);assertTrue(error.message!!.contains("sesión"))}
  assertEquals(1,activations.get());assertEquals(1,store.saves.get())
 }
}
