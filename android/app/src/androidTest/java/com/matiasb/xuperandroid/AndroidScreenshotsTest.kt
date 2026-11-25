package com.matiasb.xuperandroid
import android.content.Intent
import android.os.ParcelFileDescriptor
import android.view.KeyEvent
import androidx.lifecycle.ViewModelProvider
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.matiasb.xuperandroid.model.Section
import org.junit.*
import org.junit.runner.RunWith

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class ViewportCaptureTest

/** Captures the published native UI without changing app source or adding mock artwork. */
@ViewportCaptureTest
@RunWith(AndroidJUnit4::class)
class AndroidScreenshotsTest {
 @get:Rule val compose=createEmptyComposeRule()
 private lateinit var scenario: ActivityScenario<MainActivity>
 private lateinit var model: XuperViewModel
 private fun shell(command: String) {ParcelFileDescriptor.AutoCloseInputStream(InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(command)).use {it.readBytes()}}
 private fun launch(tv: Boolean=false) {
  val app=ApplicationProvider.getApplicationContext<XuperApplication>()
  scenario=ActivityScenario.launch(Intent(app,MainActivity::class.java).putExtra("demo",true).putExtra("force_tv",tv).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  scenario.onActivity {model=ViewModelProvider(it)[XuperViewModel::class.java]}
  compose.waitUntil(60000){!model.state.value.loading&&model.state.value.demo&&model.state.value.items.isNotEmpty()}
 }
 private fun centeredHeader() {
  val root=compose.onRoot().fetchSemanticsNode().boundsInRoot
  val nav=compose.onNodeWithTag("navigation-group").fetchSemanticsNode().boundsInRoot
  Assert.assertTrue("Navigation must be centered",kotlin.math.abs(nav.center.x-root.center.x)<2)
 }
 private fun settingsPanel(key: String,tv: Boolean=false) {
  compose.onNodeWithTag("settings-navigation").performScrollToNode(hasTestTag("settings-section-$key"))
  val node=compose.onNodeWithTag("settings-section-$key")
  if(tv)node.performSemanticsAction(SemanticsActions.RequestFocus){action->Assert.assertTrue(action())}else node.performClick()
  compose.waitForIdle()
 }
 private fun capture(name: String) {
  compose.waitForIdle();InstrumentationRegistry.getInstrumentation().waitForIdleSync()
  android.os.SystemClock.sleep(350) // Let SurfaceFlinger present the composed frame.
  shell("mkdir -p /data/local/tmp/xuperandroid-qa")
  shell("screencap -p /data/local/tmp/xuperandroid-qa/$name.png")
 }
 private fun section(section: Section,tv: Boolean=false) {
  val node=compose.onAllNodesWithText(section.label)[0]
  if(tv){InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_DOWN);node.performSemanticsAction(SemanticsActions.RequestFocus){action->Assert.assertTrue(action())}}else node.performClick()
  compose.waitUntil(30000){model.state.value.section==section&&!model.state.value.loading&&model.state.value.items.isNotEmpty()}
 }
 @Test fun captureMenus() {
  launch();section(Section.MOVIES);centeredHeader();capture("phone-peliculas")
  section(Section.SERIES);capture("phone-series")
  section(Section.TV);capture("phone-tv")
  compose.onNodeWithContentDescription("Ajustes").performClick();capture("phone-ajustes")
  settingsPanel("playback");compose.onNodeWithTag("settings-content").performScrollToNode(hasText("Fuente",substring=true));capture("phone-ajustes-subtitulos")
  scenario.onActivity {model.back()};compose.waitUntil(30000){model.state.value.screen==Screen.HOME&&!model.state.value.loading}
  section(Section.MOVIES);compose.onNodeWithContentDescription("Buscar").performClick();capture("phone-busqueda")
  scenario.close();compose.waitForIdle()
  shell("wm size 880x1760");shell("wm density 440");launch()
  section(Section.MOVIES);centeredHeader();capture("phone-small-peliculas")
  scenario.close();compose.waitForIdle()
  shell("wm size 1600x1000");shell("wm density 240");launch()
  section(Section.MOVIES);centeredHeader();capture("tablet-peliculas")
  section(Section.SERIES);capture("tablet-series")
  section(Section.TV);capture("tablet-tv")
  compose.onNodeWithContentDescription("Ajustes").performClick();capture("tablet-ajustes")
  val navigation=compose.onNodeWithTag("settings-navigation").fetchSemanticsNode().boundsInRoot
  val panel=compose.onNodeWithTag("settings-panel").fetchSemanticsNode().boundsInRoot
  Assert.assertTrue("Wide settings must use separate sidebar and content panes",navigation.right<panel.left)
  compose.onNodeWithTag("settings-content").performScrollToNode(hasText("Fuente",substring=true));capture("tablet-ajustes-subtitulos")
  scenario.close();compose.waitForIdle()
  shell("wm size 1920x1080");shell("wm density 240");launch(true)
  section(Section.MOVIES,true);centeredHeader();capture("tv-peliculas")
  section(Section.SERIES,true);capture("tv-series")
  section(Section.TV,true);capture("tv-canales")
  compose.onNodeWithContentDescription("Ajustes").performClick();capture("tv-ajustes")
  settingsPanel("network",true);capture("tv-ajustes-diagnostico")
  settingsPanel("catalog",true);capture("tv-ajustes-catalogo")
  settingsPanel("storage",true);capture("tv-ajustes-almacenamiento")
  settingsPanel("about",true);capture("tv-ajustes-acerca")
 }
 @After fun stop() {if(::scenario.isInitialized)scenario.close();shell("wm size reset");shell("wm density reset")}
}
