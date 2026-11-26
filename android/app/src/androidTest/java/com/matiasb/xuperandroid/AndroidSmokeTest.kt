package com.matiasb.xuperandroid
import android.content.Intent
import androidx.lifecycle.ViewModelProvider
import android.graphics.Bitmap
import android.os.ParcelFileDescriptor
import android.view.KeyEvent
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.semantics.SemanticsActions
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.espresso.Espresso.pressBack
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import org.junit.*
import org.junit.runner.RunWith
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class PipPlatformTest

@FixMethodOrder(org.junit.runners.MethodSorters.NAME_ASCENDING)
@RunWith(AndroidJUnit4::class)
class AndroidSmokeTest {
 @get:Rule val compose=createEmptyComposeRule()
 private lateinit var scenario: ActivityScenario<MainActivity>
 @Before fun start() { val context=ApplicationProvider.getApplicationContext<XuperApplication>();(context as? XuperTestApplication)?.catalogOverride=null;scenario=ActivityScenario.launch(Intent(context,MainActivity::class.java).putExtra("demo",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));compose.waitUntil(90_000){compose.onAllNodesWithText("PARA EXPLORAR").fetchSemanticsNodes().isNotEmpty()} }
 private fun hardwareKey(code: Int) {
  lateinit var host: MainActivity;scenario.onActivity {host=it}
  compose.waitUntil(30000){host.hasWindowFocus()}
  InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(code)
 }
 private fun screenshot(name: String) { val context=ApplicationProvider.getApplicationContext<XuperApplication>();val file=File(context.getExternalFilesDir("qa"),name+".png");file.parentFile!!.mkdirs();InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()?.let { image->file.outputStream().use { image.compress(Bitmap.CompressFormat.PNG,100,it) };image.recycle() } }
 private fun shell(command: String) { ParcelFileDescriptor.AutoCloseInputStream(InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(command)).use { it.readBytes() } }
 @After fun stop() { scenario.onActivity {ViewModelProvider(it)[XuperViewModel::class.java].stopPlayer();it.clearPip()};scenario.close();shell("wm size reset");shell("wm density reset") }
 @Test fun navigationAndSettingsAreAccessible() {
  screenshot("phone-movies");compose.onAllNodesWithText("Series")[0].performClick();compose.waitUntil(30_000){compose.onAllNodesWithText("Horizontes",substring=true).fetchSemanticsNodes().isNotEmpty()}
  screenshot("phone-series");compose.onNodeWithContentDescription("Ajustes").performClick();compose.onNodeWithText("Ajustes").assertIsDisplayed();compose.onNodeWithTag("settings-section-playback").performClick();compose.onNodeWithTag("settings-content").performScrollToNode(hasText("Fuente",substring=true));compose.onNodeWithText("Fuente",substring=true).assertIsDisplayed()
  lateinit var model: XuperViewModel;scenario.onActivity {model=ViewModelProvider(it)[XuperViewModel::class.java]}
  compose.onNodeWithTag("settings-content").performScrollToNode(hasTestTag("setting-font-3"))
  compose.onNodeWithTag("setting-font-3").performClick()
  compose.waitUntil(15000){model.settings.value.font==3}
  compose.onNodeWithTag("setting-font-3").assertIsSelected()
  compose.onNodeWithTag("setting-font-0").assertIsNotSelected()
  // Hardware Back first returns from a phone settings page to its section menu.
  hardwareKey(KeyEvent.KEYCODE_BACK)
  if(model.state.value.screen==Screen.SETTINGS){compose.onNodeWithTag("settings-navigation").assertIsDisplayed();hardwareKey(KeyEvent.KEYCODE_BACK)}
  compose.waitUntil(15000){model.state.value.screen==Screen.HOME}
  compose.onNodeWithContentDescription("Buscar").performClick();compose.onNode(hasSetTextAction()).performTextInput("Horizontes");compose.waitForIdle();assert(compose.onAllNodesWithText("Horizontes",substring=true).fetchSemanticsNodes().isNotEmpty())
 }
 @Test fun localMovieDecodesAndAudioMenuOpens() {
  compose.onNodeWithText("Ver ficha",substring=true).performClick();compose.onNodeWithText("Reproducir").performClick()
  lateinit var vm: XuperViewModel;scenario.onActivity { vm=ViewModelProvider(it)[XuperViewModel::class.java] };compose.waitUntil(90_000){vm.player.snapshot.value.width==640}
  if(compose.onAllNodesWithText("Audio",useUnmergedTree=true).fetchSemanticsNodes().isEmpty())compose.onRoot().performTouchInput { click(center) };compose.onNodeWithText("Audio",useUnmergedTree=true).performClick();compose.onNodeWithText("Audio y subtítulos").assertIsDisplayed();screenshot("player-tracks");compose.onNodeWithText("Desactivados",substring=true).assertExists()
 }
 @Test fun tabletAndTvLayoutsSupportRemoteTabFocus() {
  shell("wm size 1600x1000");shell("wm density 160");compose.waitForIdle();screenshot("tablet-movies")
  scenario.close();compose.waitForIdle();val context=ApplicationProvider.getApplicationContext<XuperApplication>()
  shell("wm size 1920x1080")
  scenario=ActivityScenario.launch(Intent(context,MainActivity::class.java).putExtra("demo",true).putExtra("force_tv",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  compose.waitUntil(30_000){compose.onAllNodesWithText("PARA EXPLORAR").fetchSemanticsNodes().isNotEmpty()}
  lateinit var vm: XuperViewModel;scenario.onActivity { vm=ViewModelProvider(it)[XuperViewModel::class.java] }
  org.junit.Assert.assertEquals(com.matiasb.xuperandroid.model.Section.MOVIES,vm.state.value.section)
  compose.onAllNodesWithText("Películas")[0].assertIsFocused()
  hardwareKey(KeyEvent.KEYCODE_DPAD_DOWN)
  compose.onNodeWithText("TV").performSemanticsAction(SemanticsActions.RequestFocus) { action -> org.junit.Assert.assertTrue("TV button must accept focus",action()) }
  compose.onNodeWithText("TV").assertIsFocused()
  compose.waitUntil(15_000){vm.state.value.section==com.matiasb.xuperandroid.model.Section.TV};screenshot("tv-live")
  hardwareKey(KeyEvent.KEYCODE_DPAD_RIGHT)
  compose.waitUntil(15_000){vm.state.value.section==com.matiasb.xuperandroid.model.Section.MOVIES}
  hardwareKey(KeyEvent.KEYCODE_DPAD_RIGHT)
  compose.waitUntil(15_000){vm.state.value.section==com.matiasb.xuperandroid.model.Section.SERIES};screenshot("tv-series")
  val root=compose.onRoot().fetchSemanticsNode().boundsInRoot
  val nav=compose.onNodeWithTag("navigation-group").fetchSemanticsNode().boundsInRoot
  org.junit.Assert.assertTrue("TV navigation must be centered independently of the logo",kotlin.math.abs(nav.center.x-root.center.x)<2)
  compose.onNodeWithContentDescription("Ajustes").performClick()
  compose.onNodeWithTag("navigation-group").assertDoesNotExist()
  compose.onNodeWithTag("settings-section-playback").assertIsFocused()
  hardwareKey(KeyEvent.KEYCODE_DPAD_DOWN)
  compose.onNodeWithTag("settings-section-display").assertIsFocused().assertIsSelected()
  compose.onNodeWithTag("settings-panel-title").assertTextEquals("Pantalla")
 }

 @Test fun favoritesAndRelatedTitlesAreReachable() {
  compose.onNodeWithText("Ver ficha",substring=true).performClick()
  compose.waitUntil(30000){compose.onAllNodesWithText("Similares").fetchSemanticsNodes().isNotEmpty()}
  compose.onNodeWithText("Mi lista").performClick()
  hardwareKey(KeyEvent.KEYCODE_BACK);compose.onNodeWithContentDescription("Ajustes").performClick();compose.onNodeWithTag("settings-section-library").performClick()
  compose.waitUntil(30000){compose.onAllNodesWithText("Quitar de mi lista").fetchSemanticsNodes().isNotEmpty()}
  compose.onAllNodesWithText("Quitar de mi lista")[0].performClick()
  compose.waitUntil(30000){compose.onAllNodesWithText("Guarda películas, series o canales en tu lista.").fetchSemanticsNodes().isNotEmpty()}
 }
 @PipPlatformTest
 @Test fun pipKeepsPhoneVideoAndIsDisabledForTv() {
  org.junit.Assert.assertTrue("Reference emulator must expose PiP",ApplicationProvider.getApplicationContext<XuperApplication>().packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE))
  compose.onNodeWithText("Ver ficha",substring=true).performClick();compose.onNodeWithText("Reproducir").performClick()
  lateinit var vm: XuperViewModel;scenario.onActivity {vm=ViewModelProvider(it)[XuperViewModel::class.java]}
  compose.waitUntil(90000){vm.player.snapshot.value.playing}
  lateinit var host: MainActivity
  scenario.onActivity {
   // Keep the 12-second local fixture alive through a slow cold-emulator transition.
   // This exercises long-running PiP rather than racing media completion.
   vm.player.player!!.repeatMode=androidx.media3.common.Player.REPEAT_MODE_ONE
   host=it;org.junit.Assert.assertTrue(it.canUsePip())
  }
  shell("input keyevent KEYCODE_HOME")
  // PiP pauses Compose's frame clock: use bounded platform polling while the Activity is paused.
  fun waitPlatform(timeoutMs: Long,label: String,condition: ()->Boolean) {
   // Activity/lifecycle state belongs to the main thread; polling it from the
   // instrumentation thread can observe stale transition state.
   fun platformState(): Boolean {
    var result=false
    InstrumentationRegistry.getInstrumentation().runOnMainSync {result=condition()}
    return result
   }
   val deadline=android.os.SystemClock.uptimeMillis()+timeoutMs
   while(!platformState()&&android.os.SystemClock.uptimeMillis()<deadline)Thread.sleep(50)
   val complete=platformState()
   var details=""
   InstrumentationRegistry.getInstrumentation().runOnMainSync {details="pip=${host.isInPictureInPictureMode}, lifecycle=${host.lifecycle.currentState}, focus=${host.hasWindowFocus()}, size=${host.window.decorView.width}x${host.window.decorView.height}"}
   org.junit.Assert.assertTrue("$label ($details)",complete)
  }
  waitPlatform(15000,"PiP entry must complete"){host.isInPictureInPictureMode}
  org.junit.Assert.assertNotNull(vm.player.player)
  val atEntry=vm.player.snapshot.value.positionMs
  waitPlatform(5000,"Video must advance while in PiP"){
   val now=vm.player.snapshot.value
   val advanced=if(now.positionMs>=atEntry)now.positionMs-atEntry else now.durationMs-atEntry+now.positionMs
   now.playing&&advanced>300
  }
  val context=ApplicationProvider.getApplicationContext<XuperApplication>()
  fun waitSystemControl(label: String,condition: ()->Boolean) {
   val deadline=android.os.SystemClock.uptimeMillis()+10000
   while(!condition()&&android.os.SystemClock.uptimeMillis()<deadline)Thread.sleep(50)
   org.junit.Assert.assertTrue(label,condition())
  }
  val automation=InstrumentationRegistry.getInstrumentation().uiAutomation
  automation.serviceInfo=automation.serviceInfo.apply {flags=flags or android.accessibilityservice.AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS}
  var bounds: android.graphics.Rect?=null
  waitSystemControl("PiP accessibility window must be available") {
   automation.windows.firstOrNull {it.isInPictureInPictureMode}?.let {window->bounds=android.graphics.Rect().also {window.getBoundsInScreen(it)}}
   bounds!=null
  }
  shell("input tap ${bounds!!.centerX()} ${bounds!!.centerY()}")
  // Click Android's own PiP expansion button, as a user would. Relaunching a
  // singleTask Activity is not equivalent to expanding its pinned task.
  var expanded=false
  waitSystemControl("Native PiP expand control must be actionable") {
   if(!expanded) {
    val queue=java.util.ArrayDeque<android.view.accessibility.AccessibilityNodeInfo>()
    automation.windows.mapNotNull {it.root}.forEach {queue.add(it)}
    while(queue.isNotEmpty()&&!expanded) {
     val node=queue.removeFirst();val label=node.contentDescription?.toString().orEmpty()
     if(node.viewIdResourceName?.endsWith(":id/expand_button")==true||label.equals("Expand",true)||label.equals("Full screen",true))expanded=node.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK)
     for(i in 0 until node.childCount)node.getChild(i)?.let {queue.add(it)}
    }
   }
   expanded
  }
  // The software-rendered emulator may stall WindowManager during cold-boot Google services.
  waitPlatform(45000,"PiP exit must resume the full-screen Activity"){!host.isInPictureInPictureMode&&host.lifecycle.currentState.isAtLeast(androidx.lifecycle.Lifecycle.State.RESUMED)}
  scenario.close();compose.waitForIdle()
  scenario=ActivityScenario.launch(Intent(context,MainActivity::class.java).putExtra("demo",true).putExtra("force_tv",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  scenario.onActivity {org.junit.Assert.assertFalse(it.canUsePip());org.junit.Assert.assertFalse(it.enterMiniPlayer())}
 }
 @Test fun renewedConnectionPreservesPausedPosition() {
  compose.onNodeWithText("Ver ficha",substring=true).performClick();compose.onNodeWithText("Reproducir").performClick()
  lateinit var vm: XuperViewModel;scenario.onActivity {vm=ViewModelProvider(it)[XuperViewModel::class.java]}
  compose.waitUntil(90000){vm.player.snapshot.value.width==640}
  scenario.onActivity {vm.player.pause();vm.player.seek(4000)}
  compose.waitUntil(15000){vm.player.snapshot.value.positionMs>=3800&&!vm.player.snapshot.value.playing}
  scenario.onActivity {org.junit.Assert.assertTrue(vm.player.recoverConnection())}
  compose.waitUntil(15000){!vm.player.snapshot.value.loading&&vm.player.snapshot.value.positionMs>=3800&&vm.player.snapshot.value.width==640}
  org.junit.Assert.assertFalse(vm.player.snapshot.value.playing)
 }

 @Test fun headingsAndHeaderIconsStayReadableOnDarkBackground() {
  fun assertBright(tag: String) {
   val pixels=compose.onNodeWithTag(tag).captureToImage().toPixelMap()
   var bright=0
   for(y in 0 until pixels.height)for(x in 0 until pixels.width){val color=pixels[x,y];if(color.red>.85f&&color.green>.85f&&color.blue>.85f)bright++}
   org.junit.Assert.assertTrue("$tag must render readable foreground pixels on the dark surface",bright>20)
  }
  assertBright("catalog-heading");assertBright("header-Buscar");assertBright("header-Ajustes")
  compose.onNodeWithContentDescription("Ajustes").performClick();assertBright("settings-heading")
 }

 @Test fun groupedNavigationFitsSmallPhoneAndKeepsSearchInside() {
  shell("wm size 880x1760");shell("wm density 440");compose.waitForIdle()
  val group=compose.onNodeWithTag("navigation-group").assertIsDisplayed().fetchSemanticsNode().boundsInRoot
  for(tag in listOf("nav-TV","nav-MOVIES","nav-SERIES","header-Buscar")){
   val bounds=compose.onNodeWithTag(tag).assertIsDisplayed().fetchSemanticsNode().boundsInRoot
   org.junit.Assert.assertTrue("$tag must stay inside the shared navigation panel",bounds.left>=group.left-1&&bounds.right<=group.right+1&&bounds.top>=group.top-1&&bounds.bottom<=group.bottom+1)
  }
  compose.onNodeWithContentDescription("Buscar").performClick();compose.onNode(hasSetTextAction()).assertIsDisplayed()
 }

}
