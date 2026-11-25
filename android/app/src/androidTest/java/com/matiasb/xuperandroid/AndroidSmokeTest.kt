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
@RunWith(AndroidJUnit4::class)
class AndroidSmokeTest {
 @get:Rule val compose=createEmptyComposeRule()
 private lateinit var scenario: ActivityScenario<MainActivity>
 @Before fun start() { val context=ApplicationProvider.getApplicationContext<XuperApplication>();scenario=ActivityScenario.launch(Intent(context,MainActivity::class.java).putExtra("demo",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));compose.waitUntil(90_000){compose.onAllNodesWithText("PARA EXPLORAR").fetchSemanticsNodes().isNotEmpty()} }
 private fun screenshot(name: String) { val context=ApplicationProvider.getApplicationContext<XuperApplication>();val file=File(context.getExternalFilesDir("qa"),name+".png");file.parentFile!!.mkdirs();InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()?.let { image->file.outputStream().use { image.compress(Bitmap.CompressFormat.PNG,100,it) };image.recycle() } }
 private fun shell(command: String) { ParcelFileDescriptor.AutoCloseInputStream(InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(command)).use { it.readBytes() } }
 @After fun stop() { scenario.onActivity {ViewModelProvider(it)[XuperViewModel::class.java].stopPlayer();it.clearPip()};scenario.close();shell("wm size reset");shell("wm density reset") }
 @Test fun navigationAndSettingsAreAccessible() {
  screenshot("phone-movies");compose.onAllNodesWithText("Series")[0].performClick();compose.waitUntil(30_000){compose.onAllNodesWithText("Horizontes",substring=true).fetchSemanticsNodes().isNotEmpty()}
  screenshot("phone-series");compose.onNodeWithContentDescription("Ajustes").performClick();compose.onNodeWithText("Ajustes").assertIsDisplayed();compose.onNode(hasScrollToNodeAction()).performScrollToNode(hasText("Fuente",substring=true));compose.onNodeWithText("Fuente",substring=true).assertIsDisplayed()
  // Use a real hardware Back event after lazy scrolling, rather than Espresso's stale root-focus picker.
  InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)
  lateinit var model: XuperViewModel;scenario.onActivity {model=ViewModelProvider(it)[XuperViewModel::class.java]}
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
  InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_DOWN)
  compose.onNodeWithText("TV").performSemanticsAction(SemanticsActions.RequestFocus) { action -> org.junit.Assert.assertTrue("TV button must accept focus",action()) }
  compose.onNodeWithText("TV").assertIsFocused()
  compose.waitUntil(15_000){vm.state.value.section==com.matiasb.xuperandroid.model.Section.TV};screenshot("tv-live")
  InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_RIGHT)
  compose.waitUntil(15_000){vm.state.value.section==com.matiasb.xuperandroid.model.Section.MOVIES}
  InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_RIGHT)
  compose.waitUntil(15_000){vm.state.value.section==com.matiasb.xuperandroid.model.Section.SERIES};screenshot("tv-series")
 }

 @Test fun favoritesAndRelatedTitlesAreReachable() {
  compose.onNodeWithText("Ver ficha",substring=true).performClick()
  compose.waitUntil(30000){compose.onAllNodesWithText("Similares").fetchSemanticsNodes().isNotEmpty()}
  compose.onNodeWithText("Mi lista").performClick()
  pressBack();compose.onNodeWithContentDescription("Mi lista").performClick()
  compose.waitUntil(30000){compose.onAllNodesWithText("Quitar de mi lista").fetchSemanticsNodes().isNotEmpty()}
  compose.onAllNodesWithText("Quitar de mi lista")[0].performClick()
  compose.waitUntil(30000){compose.onAllNodesWithText("Guarda películas, series o canales en tu lista.").fetchSemanticsNodes().isNotEmpty()}
 }
 @Test fun pipKeepsPhoneVideoAndIsDisabledForTv() {
  org.junit.Assert.assertTrue("Reference emulator must expose PiP",ApplicationProvider.getApplicationContext<XuperApplication>().packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE))
  compose.onNodeWithText("Ver ficha",substring=true).performClick();compose.onNodeWithText("Reproducir").performClick()
  lateinit var vm: XuperViewModel;scenario.onActivity {vm=ViewModelProvider(it)[XuperViewModel::class.java]}
  compose.waitUntil(90000){vm.player.snapshot.value.playing}
  scenario.onActivity {org.junit.Assert.assertTrue(it.enterMiniPlayer())}
  var inPip=false
  compose.waitUntil(15000){scenario.onActivity {inPip=it.isInPictureInPictureMode};inPip}
  org.junit.Assert.assertNotNull(vm.player.player)
  val atEntry=vm.player.snapshot.value.positionMs
  compose.waitUntil(5000){vm.player.snapshot.value.playing&&vm.player.snapshot.value.positionMs>atEntry+300}
  val context=ApplicationProvider.getApplicationContext<XuperApplication>()
  shell("am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -f 0x10200000 -n com.matiasb.xuperandroid/.MainActivity")
  compose.waitUntil(15000){scenario.onActivity {inPip=it.isInPictureInPictureMode};!inPip}
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

}
