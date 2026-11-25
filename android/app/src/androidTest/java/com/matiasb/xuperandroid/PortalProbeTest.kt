package com.matiasb.xuperandroid
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class PortalProbe
/** Optional real-network diagnostic. A recorded server rejection is not a successful playback test. */
@PortalProbe
@RunWith(AndroidJUnit4::class)
class PortalProbeTest {
 private fun shell(command: String) {ParcelFileDescriptor.AutoCloseInputStream(InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(command)).use {it.readBytes()}}
 @Test fun recordOwnSessionMetadataFlow()=runBlocking {
  check(InstrumentationRegistry.getArguments().getString("allowPortalNetwork")=="true") {"Real portal diagnostic requires explicit authorization; no network request was sent"}
  val app=ApplicationProvider.getApplicationContext<XuperApplication>()
  val report=JSONObject().put("diagnosticOnly",true).put("mode","metadata-resolution-only").put("usesOwnInstallationSession",true)
  val rows=JSONArray();report.put("sections",rows);val started=SystemClock.elapsedRealtime();var row: JSONObject?=null
  try {withTimeout(90_000) {
   val repository=PortalRepository(PortalClient(SessionVault(app)))
   for(section in listOf(Section.MOVIES,Section.SERIES)) {
    val current=JSONObject().put("section",section.name).put("stage","catalogue");row=current;rows.put(current)
    val title=repository.browse(section).items.firstOrNull()?:throw java.io.IOException("No sample item")
    current.put("stage","details").put("title",title.name.take(120))
    val details=repository.details(title)
    val episode=if(title.kind==Kind.SERIES)details.episodes.firstOrNull()?:throw java.io.IOException("No episode")else null
    current.put("stage","resolve")
    val stream=repository.resolve(details.title,episode,title.id,720)
    current.put("result","resolved").put("sourceCount",stream.sources.size).put("quality",stream.quality).put("audioOptions",stream.portalAudio.size).put("subtitleOptions",stream.subtitles.size)
   }
   report.put("outcome","metadata-resolved")
  }}catch(error: PortalException){report.put("outcome","portal-rejected").put("portalCode",error.code)}
    catch(_: TimeoutCancellationException){report.put("outcome","timeout")}
    catch(error: CancellationException){throw error}
    catch(error: Exception){report.put("outcome","error").put("errorType",error.javaClass.simpleName)}
  report.put("elapsedMs",SystemClock.elapsedRealtime()-started)
  java.io.File(app.filesDir,"portal-probe.json").writeText(report.toString(2))
  // Only the redacted report leaves app storage; URLs, authorization and installation IDs are omitted.
  shell("mkdir -p /data/local/tmp/xuperandroid-qa")
  shell("run-as com.matiasb.xuperandroid cat files/portal-probe.json > /data/local/tmp/xuperandroid-qa/portal-probe.json")
 }
}
