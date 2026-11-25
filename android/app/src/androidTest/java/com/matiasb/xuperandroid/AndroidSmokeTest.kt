package com.matiasb.xuperandroid
import android.content.Intent
import androidx.lifecycle.ViewModelProvider
import android.graphics.Bitmap
import android.os.ParcelFileDescriptor
import android.view.KeyEvent
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
 @After fun stop() { scenario.close();shell("wm size reset");shell("wm density reset") }
 @Test fun navigationAndSettingsAreAccessible() {
  screenshot("phone-movies");compose.onAllNodesWithText("Series")[0].performClick();compose.waitUntil(30_000){compose.onAllNodesWithText("Horizontes",substring=true).fetchSemanticsNodes().isNotEmpty()}
  screenshot("phone-series");compose.onNodeWithContentDescription("Ajustes").performClick();compose.onNodeWithText("Ajustes").assertIsDisplayed();compose.onNodeWithText("Fuente",substring=true).assertExists();pressBack()
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

}
