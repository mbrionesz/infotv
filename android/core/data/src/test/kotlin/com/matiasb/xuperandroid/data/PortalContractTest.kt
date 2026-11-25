package com.matiasb.xuperandroid.data
import org.junit.Test
import org.junit.Assert.*
import org.json.JSONObject
import okhttp3.*
class PortalContractTest {
 private val fixture=JSONObject(javaClass.getResourceAsStream("/portal-contract.json")!!.bufferedReader().readText())
 @Test fun encryptionMatchesArchivedJavaScriptClient() { assertEquals(fixture.getString("encrypted"),PortalCrypto.encrypt(fixture.getString("plain")));assertEquals(fixture.getString("plain"),PortalCrypto.decrypt(fixture.getString("encrypted"))) }
 @Test fun liveSignatureMatchesJavaScriptForTwoDifferentRequests() { val values=fixture.getJSONArray("signs");for(i in 0 until values.length()){val f=values.getJSONObject(i);assertEquals(f.getString("signature"),PortalCrypto.liveSign(f.getString("token"),f.getLong("moment"))) } }
 @Test fun redirectDoesNotLeakOriginSpecificCredentialsAndKeepsRange() {
  val requests=mutableListOf<Request>();val client=OkHttpClient.Builder().followRedirects(false).addInterceptor(OriginCredentials { mapOf("https://primary.example:443" to mapOf("Content-Auth" to "fixture-primary","Content-License" to "fixture-license")) }).addInterceptor { chain->requests+=chain.request();Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).message("fixture").code(if(requests.size==1)302 else 206).apply { if(requests.size==1)header("Location","https://backup.example/video.ts") }.body(ResponseBody.create(null,byteArrayOf(1,2))).build() }.build()
  client.newCall(Request.Builder().url("https://primary.example/video.ts").header("Range","bytes=40-43").build()).execute().close()
  assertEquals("fixture-primary",requests[0].header("Content-Auth"));assertNull(requests[1].header("Content-Auth"));assertNull(requests[1].header("Content-License"));assertEquals("bytes=40-43",requests[1].header("Range"))
 }
 @Test fun unapprovedHttpEndpointIsRejected() { val client=OkHttpClient.Builder().addInterceptor(OriginCredentials { emptyMap() }).build();assertThrows(java.io.IOException::class.java){client.newCall(Request.Builder().url("http://unknown.example/video.ts").build()).execute()} }
}
