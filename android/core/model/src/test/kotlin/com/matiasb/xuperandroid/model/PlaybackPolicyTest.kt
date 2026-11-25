package com.matiasb.xuperandroid.model
import kotlin.test.*
class PlaybackPolicyTest {
 @Test fun meteredDataAndSystemSaverHaveExplicitLimits() { assertEquals(720,DataPolicy.maxHeight(0,true));assertEquals(0,DataPolicy.maxHeight(0,false));assertEquals(480,DataPolicy.maxHeight(1,false));assertEquals(0,DataPolicy.maxHeight(2,true));assertEquals(480,DataPolicy.maxHeight(2,true,true)) }
 @Test fun neverInventLowerQualityWhenPortalHasOnlyOneVariant() { assertEquals(720,DataPolicy.chooseHeight(listOf(720),480));assertEquals(480,DataPolicy.chooseHeight(listOf(480,720,1080),480));assertEquals(1080,DataPolicy.chooseHeight(listOf(480,1080),0)) }

 @Test fun latinoHasPriorityWithoutInventingVariantOfSpa() { assertTrue(PlaybackPolicy.audioScore("es-419") > PlaybackPolicy.audioScore("spa"));assertTrue(PlaybackPolicy.audioScore("spa") > PlaybackPolicy.audioScore("es-ES"));assertEquals(0,PlaybackPolicy.audioScore("jpn")) }
 @Test fun creditsOfferEarlierForLongSeries() { assertEquals(42 * 60_000L,PlaybackPolicy.nextEpisodeThreshold(45 * 60_000));assertEquals(56 * 60_000L,PlaybackPolicy.nextEpisodeThreshold(60 * 60_000));assertEquals(22 * 60_000L + 30_000,PlaybackPolicy.nextEpisodeThreshold(24 * 60_000)) }
 @Test fun movieProgressCannotInventEpisodeLabel() { val progress=WatchProgress(Title("m","Película",Kind.MOVIE),episodeNumber=8,positionMs=60_000,durationMs=180_000,updatedAt=1);assertEquals("Película",progress.label);assertEquals(2,progress.remainingMinutes) }
 @Test fun completionNeedsKnownDuration() { assertFalse(PlaybackPolicy.completed(60_000,0));assertFalse(PlaybackPolicy.completed(94_000,100_000));assertTrue(PlaybackPolicy.completed(95_000,100_000)) }
 @Test fun budgetsAndDurations() { assertTrue(PlaybackPolicy.bufferBytes(true)<PlaybackPolicy.bufferBytes(false));assertEquals(5840,PlaybackPolicy.duration("01:37:20"));assertEquals(0,PlaybackPolicy.duration("")) }
}
