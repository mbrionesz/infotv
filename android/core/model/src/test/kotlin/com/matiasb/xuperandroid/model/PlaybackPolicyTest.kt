package com.matiasb.xuperandroid.model
import kotlin.test.*
class PlaybackPolicyTest {
 @Test fun wifiAndCellularUseInternalNetworkBudgets() { assertEquals(720,DataPolicy.maxHeight(true));assertEquals(0,DataPolicy.maxHeight(false));assertEquals(480,DataPolicy.maxHeight(true,true)) }
 @Test fun neverInventLowerQualityWhenPortalHasOnlyOneVariant() { assertEquals(720,DataPolicy.chooseHeight(listOf(720),480));assertEquals(480,DataPolicy.chooseHeight(listOf(480,720,1080),480));assertEquals(1080,DataPolicy.chooseHeight(listOf(480,1080),0)) }

 @Test fun latinoHasPriorityWithoutInventingVariantOfSpa() { assertTrue(PlaybackPolicy.audioScore("es-419") > PlaybackPolicy.audioScore("spa"));assertTrue(PlaybackPolicy.audioScore("spa") > PlaybackPolicy.audioScore("es-ES"));assertEquals(0,PlaybackPolicy.audioScore("jpn")) }
 @Test fun creditsOfferEarlierForLongSeries() { assertEquals(42 * 60_000L,PlaybackPolicy.nextEpisodeThreshold(45 * 60_000));assertEquals(56 * 60_000L,PlaybackPolicy.nextEpisodeThreshold(60 * 60_000));assertEquals(22 * 60_000L + 30_000,PlaybackPolicy.nextEpisodeThreshold(24 * 60_000)) }
 @Test fun movieProgressCannotInventEpisodeLabel() { val progress=WatchProgress(Title("m","Película",Kind.MOVIE),episodeNumber=8,positionMs=60_000,durationMs=180_000,updatedAt=1);assertEquals("Película",progress.label);assertEquals(2,progress.remainingMinutes) }
 @Test fun completionNeedsKnownDuration() { assertFalse(PlaybackPolicy.completed(60_000,0));assertFalse(PlaybackPolicy.completed(94_000,100_000));assertTrue(PlaybackPolicy.completed(95_000,100_000)) }
 @Test fun budgetsAndDurations() { assertTrue(PlaybackPolicy.bufferBytes(true)<PlaybackPolicy.bufferBytes(false));assertEquals(5840,PlaybackPolicy.duration("01:37:20"));assertEquals(0,PlaybackPolicy.duration("")) }
 @Test fun latinAmericanRegionalTracksWinOverGenericAndSpainSpanish() {
  assertTrue(PlaybackPolicy.audioScore("es_AR")>PlaybackPolicy.audioScore("es"))
  assertTrue(PlaybackPolicy.audioScore("es-CL")>PlaybackPolicy.audioScore("es-ES"))
  assertTrue(PlaybackPolicy.audioScore("","Spanish")>0)
 }
 @Test fun automaticSubtitlesChooseLatinSpanishAndNeverInventAnEnglishFallback() {
  fun track(id: String,language: String)=Track(id,language,"",false)
  val english=track("english","en");val spain=track("spain","es-ES");val latin=track("latin","es-419")
  assertEquals(latin,PlaybackPolicy.preferredSubtitle(listOf(english,spain,latin)))
  assertNull(PlaybackPolicy.preferredSubtitle(listOf(english)))
  assertEquals(english,PlaybackPolicy.preferredSubtitle(listOf(english),spanishOnly=false))
 }
 @Test fun vodReadAheadHasEarlierRefillAndSameMemoryBudgets() {
  assertEquals(30_000,PlaybackPolicy.minimumBufferMs(false));assertEquals(90_000,PlaybackPolicy.maximumBufferMs(false))
  assertEquals(32*1024*1024,PlaybackPolicy.bufferBytes(false))
  assertEquals(15_000,PlaybackPolicy.minimumBufferMs(true));assertEquals(30_000,PlaybackPolicy.maximumBufferMs(true))
  assertEquals(12*1024*1024,PlaybackPolicy.bufferBytes(true))
  assertEquals(15_000,PlaybackPolicy.minimumBufferMs(false,live=true));assertEquals(60_000,PlaybackPolicy.maximumBufferMs(false,live=true))
 }
}
