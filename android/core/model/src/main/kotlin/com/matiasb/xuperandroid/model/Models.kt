package com.matiasb.xuperandroid.model

enum class Kind { MOVIE, SERIES, LIVE }
enum class Section(val label: String, val columnId: Int, val kind: Kind) {
 TV("TV", 76182, Kind.LIVE), MOVIES("Películas", 76177, Kind.MOVIE), SERIES("Series", 76178, Kind.SERIES)
}
data class Title(val id: String, val name: String, val kind: Kind, val poster: String = "", val backdrop: String = "", val year: String = "", val synopsis: String = "", val genres: List<String> = emptyList(), val country: String = "", val durationSeconds: Long = 0)
data class Episode(val id: String, val number: Int, val name: String, val durationSeconds: Long = 0, val season: Int = 1)
data class Season(val id: String, val number: Int)
data class Details(val title: Title, val episodes: List<Episode> = emptyList(), val seasons: List<Season> = emptyList())
data class Choice(val id: String, val label: String)
data class Filters(val genres: List<Choice> = emptyList(), val years: List<Choice> = emptyList(), val countries: List<Choice> = emptyList())
data class Query(val text: String = "", val genre: String = "", val year: String = "", val country: String = "", val column: String = "")
data class Page(val items: List<Title>, val page: Int, val hasMore: Boolean, val reportedTotal: Int? = null)
data class Source(val url: String, val headers: Map<String, String> = emptyMap())
data class Subtitle(val url: String, val language: String, val mime: String, val label: String = "")
data class Stream(val sources: List<Source>, val mime: String = "", val durationSeconds: Long = 0, val subtitles: List<Subtitle> = emptyList(), val quality: String = "", val fps: Float = 0f, val portalAudio: List<Track> = emptyList())
data class Playing(val title: Title, val episode: Episode? = null, val seasonId: String = "", val stream: Stream, val resumeMs: Long = 0)
data class WatchProgress(val title: Title, val episodeId: String = "", val episodeNumber: Int = 0, val seasonNumber: Int = 1, val seasonId: String = "", val positionMs: Long, val durationMs: Long, val updatedAt: Long, val completed: Boolean = false) {
 val label: String get() = title.name + if (title.kind == Kind.SERIES && episodeNumber > 0) " · EP. $episodeNumber · T$seasonNumber" else ""
 val remainingMinutes: Long? get() = durationMs.takeIf { it > 0 }?.let { ((it - positionMs).coerceAtLeast(0) + 59_999) / 60_000 }
}
data class Track(val id: String, val language: String, val name: String, val selected: Boolean)
data class PlaybackSnapshot(val positionMs: Long = 0, val durationMs: Long = 0, val bufferMs: Long = 0, val playing: Boolean = false, val loading: Boolean = false, val width: Int = 0, val height: Int = 0, val fps: Float = 0f, val audio: List<Track> = emptyList(), val subtitles: List<Track> = emptyList(), val error: String? = null, val playWhenReady: Boolean = false)
object PlaybackPolicy {
 fun audioScore(language: String, name: String = ""): Int {
  val value = (language + " " + name).lowercase()
  return when {
   value.contains("es-419") || value.contains("es-mx") || value.contains("latino") || value.contains("latam") -> 100
   value.contains("es-es") || value.contains("castellano") -> 40
   Regex("(^|[^a-z])(es|spa|esp)([^a-z]|$)").containsMatchIn(value) || value.contains("español") -> 70
   else -> 0
  }
 }
 fun nextEpisodeThreshold(durationMs: Long): Long = when {
  durationMs <= 0 -> Long.MAX_VALUE
  durationMs < 35 * 60_000L -> (durationMs - 90_000).coerceAtLeast(durationMs / 2)
  durationMs < 55 * 60_000L -> durationMs - 180_000
  else -> durationMs - 240_000
 }
 fun completed(positionMs: Long, durationMs: Long) = durationMs > 0 && positionMs.toDouble() / durationMs >= .95
 fun bufferBytes(lowRam: Boolean) = if (lowRam) 12 * 1024 * 1024 else 32 * 1024 * 1024
 fun duration(value: String): Long {
  val clock = value.split(':');if (clock.size in 2..3 && clock.all { it.toLongOrNull() != null }) return clock.fold(0L) { sum, part -> sum * 60 + part.toLong() }
  return value.toDoubleOrNull()?.let { if (it > 86400) (it / 1000).toLong() else it.toLong() } ?: 0
 }
}

object DataPolicy {
 // Network adaptation is internal; no user-facing mode selector.
 fun maxHeight(cellular: Boolean,systemSaver: Boolean=false): Int = when {
  cellular&&systemSaver -> 480
  cellular -> 720
  else -> 0
 }
 fun chooseHeight(available: List<Int>,cap: Int): Int {
  val known=available.filter { it>0 };if(known.isEmpty())return 0
  return if(cap<=0)known.max() else known.filter { it<=cap }.maxOrNull()?:known.min()
 }
}
