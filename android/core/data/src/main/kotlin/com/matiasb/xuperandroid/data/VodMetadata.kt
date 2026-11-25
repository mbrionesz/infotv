package com.matiasb.xuperandroid.data
import org.json.JSONObject
/** Mirrors the archived client's field aliases without inventing resolution or frame rate. */
internal fun vodHeight(track: JSONObject): Int {
 for(key in listOf("videoHeight","height","pixelHeight"))Regex("\\d+(?:\\.\\d+)?").find(track.text(key))?.value?.toDoubleOrNull()?.takeIf {it>0}?.let {return it.toInt()}
 val label=listOf("resolution","videoResolution","quality","groupQuality").firstNotNullOfOrNull {track.text(it).takeIf {value->value.isNotBlank()}}?.lowercase().orEmpty()
 Regex("\\d{3,4}\\s*[x×]\\s*(\\d{3,4})").find(label)?.groupValues?.get(1)?.toIntOrNull()?.let {return it}
 for((height,pattern) in listOf(2160 to "\\b(4k|uhd)\\b|(^|[^0-9])2160[pi]?([^0-9]|$)",1440 to "(^|[^0-9])1440[pi]?([^0-9]|$)",1080 to "(^|[^0-9])1080[pi]?([^0-9]|$)|\\bfhd\\b",720 to "(^|[^0-9])720[pi]?([^0-9]|$)|\\bhd\\b",480 to "(^|[^0-9])480[pi]?([^0-9]|$)|\\bsd\\b"))if(Regex(pattern).containsMatchIn(label))return height
 return 0
}
internal fun vodFps(track: JSONObject): Float {
 val text=listOf("frameRate","fps","videoFps").firstNotNullOfOrNull {track.text(it).takeIf {value->value.isNotBlank()}}?.replace(',','.').orEmpty()
 val ratio=Regex("^(\\d+(?:\\.\\d+)?)\\s*/\\s*(\\d+(?:\\.\\d+)?)$").matchEntire(text)
 val value=if(ratio!=null)ratio.groupValues[1].toDouble()/ratio.groupValues[2].toDouble() else Regex("\\d+(?:\\.\\d+)?").find(text)?.value?.toDoubleOrNull()?:0.0
 return value.takeIf {it.isFinite()&&it>0&&it<=240}?.toFloat()?:0f
}
internal fun vodAudio(track: JSONObject)=listOf("audioInfo","language","audioLanguage","languageName").firstNotNullOfOrNull {track.text(it).takeIf {value->value.isNotBlank()}}.orEmpty()
