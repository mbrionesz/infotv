package com.matiasb.xuperandroid
import android.content.Intent
import androidx.lifecycle.ViewModelProvider
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
 @After fun stop() { scenario.close() }
 @Test fun navigationAndSettingsAreAccessible() {
  compose.onAllNodesWithText("Series")[0].performClick();compose.waitUntil(30_000){compose.onAllNodesWithText("Horizontes",substring=true).fetchSemanticsNodes().isNotEmpty()}
  compose.onNodeWithContentDescription("Ajustes").performClick();compose.onNodeWithText("Ajustes").assertIsDisplayed();compose.onNodeWithText("Fuente",substring=true).assertExists();pressBack()
  compose.onNodeWithContentDescription("Buscar").performClick();compose.onNode(hasSetTextAction()).performTextInput("Horizontes");compose.waitForIdle();assert(compose.onAllNodesWithText("Horizontes",substring=true).fetchSemanticsNodes().isNotEmpty())
 }
 @Test fun localMovieDecodesAndAudioMenuOpens() {
  compose.onNodeWithText("Ver ficha",substring=true).performClick();compose.onNodeWithText("Reproducir").performClick()
  lateinit var vm: XuperViewModel;scenario.onActivity { vm=ViewModelProvider(it)[XuperViewModel::class.java] };compose.waitUntil(90_000){vm.player.snapshot.value.width==640}
  if(compose.onAllNodesWithText("Audio",useUnmergedTree=true).fetchSemanticsNodes().isEmpty())compose.onRoot().performTouchInput { click(center) };compose.onNodeWithText("Audio",useUnmergedTree=true).performClick();compose.onNodeWithText("Audio y subtítulos").assertIsDisplayed();compose.onNodeWithText("Desactivados",substring=true).assertExists()
 }
}
