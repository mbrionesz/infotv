package com.matiasb.xuperandroid.data
import okhttp3.Dns
import org.junit.Test
import org.junit.Assert.*
import java.net.InetAddress
import java.net.UnknownHostException
import java.util.concurrent.atomic.AtomicInteger
class BoundedDnsTest {
 private val address=InetAddress.getByAddress(byteArrayOf(1,1,1,1))
 private fun dns(block: ()->List<InetAddress>)=object:Dns {override fun lookup(hostname: String)=block()}
 private val failed=dns {throw UnknownHostException("fixture")}
 @Test fun slowPlatformDnsDoesNotBlockIndependentSecureResolvers() {
  val slow=dns {Thread.sleep(10_000);listOf(address)}
  val resolver=BoundedDns(listOf(failed,dns {listOf(address)}),slow,500,0)
  assertEquals(listOf(address),resolver.lookup("portal.example"))
 }
 @Test fun emptyAnswerDoesNotWinTheRace() {
  val resolver=BoundedDns(listOf(dns {emptyList()},dns {listOf(address)}),failed,500,0)
  assertEquals(listOf(address),resolver.lookup("portal.example"))
 }
 @Test fun platformRemainsAvailableWhenSecureDnsFails() {
  assertEquals(listOf(address),BoundedDns(listOf(failed),dns {listOf(address)},500,0).lookup("portal.example"))
 }
 @Test fun hungLookupsRespectOverallDeadline() {
  val slow=dns {Thread.sleep(10_000);listOf(address)};val start=System.nanoTime()
  assertThrows(UnknownHostException::class.java){BoundedDns(listOf(slow),slow,60,0).lookup("portal.example")}
  assertTrue("DNS must have a bounded wait",(System.nanoTime()-start)/1_000_000<1500)
 }
 @Test fun successfulAnswerIsCached() {
  val calls=AtomicInteger();val resolver=BoundedDns(listOf(dns {calls.incrementAndGet();listOf(address)}),failed,500,100)
  resolver.lookup("portal.example");resolver.lookup("portal.example");assertEquals(1,calls.get())
 }
 @Test fun explicitCleanupForcesFreshDns() {
  val calls=AtomicInteger();val resolver=BoundedDns(listOf(dns {calls.incrementAndGet();listOf(address)}),failed,500,100)
  resolver.lookup("portal.example");resolver.clear();resolver.lookup("portal.example")
  assertEquals(2,calls.get())
 }
 @Test fun lookupStartedBeforeCleanupCannotRepopulateTheCache() {
  val entered=java.util.concurrent.CountDownLatch(1);val resume=java.util.concurrent.CountDownLatch(1);val calls=AtomicInteger()
  val resolver=BoundedDns(listOf(dns {if(calls.incrementAndGet()==1){entered.countDown();assertTrue(resume.await(2,java.util.concurrent.TimeUnit.SECONDS))};listOf(address)}),failed,2000,100)
  val pool=java.util.concurrent.Executors.newSingleThreadExecutor()
  try {
   val pending=pool.submit<List<InetAddress>> {resolver.lookup("portal.example")}
   assertTrue(entered.await(2,java.util.concurrent.TimeUnit.SECONDS));resolver.clear();resume.countDown()
   assertEquals(listOf(address),pending.get(2,java.util.concurrent.TimeUnit.SECONDS))
   resolver.lookup("portal.example");assertEquals(2,calls.get())
  } finally {resume.countDown();pool.shutdownNow()}
 }
 @Test fun lastResolverCanSucceedAfterEarlierEndpointsFail() {
  val resolvers=List(17) {index->dns {if(index==16)listOf(address)else throw UnknownHostException("fixture-$index")} }
  // Only the last endpoint can return this address. Once it wins, earlier
  // queued failures may be cancelled before they run, which is valid.
  assertEquals(listOf(address),BoundedDns(resolvers,failed,1500,0).lookup("portal.example"))
 }

 @Test fun sinkholeAndPrivateAnswersDoNotWinOverPublicAnswers() {
  for(ip in listOf("0.0.0.0","127.0.0.1","10.0.0.1","192.168.1.1","100.64.0.1","198.18.0.1")) {
   val blocked=InetAddress.getByAddress(ip.split('.').map {it.toInt().toByte()}.toByteArray())
   assertEquals(listOf(address),BoundedDns(listOf(dns {listOf(blocked)},dns {listOf(address)}),failed,1000,0).lookup("portal.example"))
  }
 }

}
