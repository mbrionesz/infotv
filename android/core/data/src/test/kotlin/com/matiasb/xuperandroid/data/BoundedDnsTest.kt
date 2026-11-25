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
 @Test fun lastResolverCanSucceedAfterEarlierEndpointsFail() {
  val calls=AtomicInteger()
  val resolvers=List(17) {index->dns {calls.incrementAndGet();if(index==16)listOf(address)else throw UnknownHostException("fixture-$index")} }
  assertEquals(listOf(address),BoundedDns(resolvers,failed,1500,0).lookup("portal.example"))
  assertEquals(17,calls.get())
 }

}
