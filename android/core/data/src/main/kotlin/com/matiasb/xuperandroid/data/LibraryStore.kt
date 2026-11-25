package com.matiasb.xuperandroid.data
import android.content.Context
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.*
import androidx.room.Query
import com.matiasb.xuperandroid.model.*
import kotlinx.coroutines.flow.*
import org.json.JSONArray
import org.json.JSONObject
@Entity(tableName="progress")
data class ProgressEntity(@PrimaryKey val titleKey: String,val kind: String,val titleJson: String,val episodeId: String,val episodeNumber: Int,val seasonNumber: Int,val seasonId: String,val positionMs: Long,val durationMs: Long,val updatedAt: Long,val completed: Boolean)
@Entity(tableName="favorites") data class FavoriteEntity(@PrimaryKey val titleKey: String,val titleJson: String)
@Dao interface LibraryDao {
 @Query("SELECT * FROM progress WHERE completed = 0 AND positionMs > 0 ORDER BY updatedAt DESC LIMIT 60") fun progress(): Flow<List<ProgressEntity>>
 @Query("SELECT * FROM progress WHERE titleKey = :key") suspend fun find(key: String): ProgressEntity?
 @Upsert suspend fun save(entity: ProgressEntity)
 @Query("DELETE FROM progress WHERE titleKey = :key") suspend fun remove(key: String)
 @Query("DELETE FROM progress WHERE titleKey NOT IN (SELECT titleKey FROM progress ORDER BY updatedAt DESC LIMIT 100)") suspend fun prune()
 @Query("SELECT * FROM favorites") fun favorites(): Flow<List<FavoriteEntity>>
 @Upsert suspend fun favorite(entity: FavoriteEntity)
 @Query("DELETE FROM favorites WHERE titleKey = :key") suspend fun unfavorite(key: String)
}
@Database(entities=[ProgressEntity::class,FavoriteEntity::class],version=1,exportSchema=true)
abstract class LibraryDatabase: RoomDatabase() { abstract fun library(): LibraryDao }
private val Context.dataStore by preferencesDataStore("preferences")
data class Settings(val audio: String="es-419",val subtitleMode: Int=0,val font: Int=0,val fontSize: Int=0,val fontColor: Int=0,val videoFit: Int=0)
class LibraryStore(context: Context) {
 private val db=Room.databaseBuilder(context.applicationContext,LibraryDatabase::class.java,"library.db").build();private val dao=db.library();private val preferences=context.applicationContext.dataStore
 val settings=preferences.data.map { Settings(it[stringPreferencesKey("audio")]?:"es-419",it[intPreferencesKey("subtitles")]?:0,it[intPreferencesKey("font")]?:0,it[intPreferencesKey("fontSize")]?:0,it[intPreferencesKey("fontColor")]?:0,it[intPreferencesKey("videoFit")]?:0) }
 val progress=dao.progress().map { list->list.mapNotNull { row->runCatching { WatchProgress(decodeTitle(row.titleJson),row.episodeId,row.episodeNumber,row.seasonNumber,row.seasonId,row.positionMs,row.durationMs,row.updatedAt,row.completed) }.getOrNull() } }
 val favorites=dao.favorites().map { list->list.mapNotNull { runCatching { decodeTitle(it.titleJson) }.getOrNull() } }
 suspend fun set(key: String,value: Int) { require(key in listOf("subtitles","font","fontSize","fontColor","videoFit"));preferences.edit { it[intPreferencesKey(key)]=value } }
 suspend fun audio(value: String) { preferences.edit { it[stringPreferencesKey("audio")]=value } }
 suspend fun find(title: Title)=dao.find(key(title))?.let { WatchProgress(decodeTitle(it.titleJson),it.episodeId,it.episodeNumber,it.seasonNumber,it.seasonId,it.positionMs,it.durationMs,it.updatedAt,it.completed) }
 suspend fun checkpoint(playing: Playing,position: Long,duration: Long,ended: Boolean=false) {
  if(playing.title.kind==Kind.LIVE || position<1000)return
  dao.save(ProgressEntity(key(playing.title),playing.title.kind.name,encodeTitle(playing.title),playing.episode?.id.orEmpty(),playing.episode?.number?:0,playing.episode?.season?:1,playing.seasonId,position,duration,System.currentTimeMillis(),ended||PlaybackPolicy.completed(position,duration)));dao.prune()
 }
 suspend fun remove(title: Title)=dao.remove(key(title))
 suspend fun favorite(title: Title,enabled: Boolean) { if(enabled)dao.favorite(FavoriteEntity(key(title),encodeTitle(title))) else dao.unfavorite(key(title)) }
 suspend fun saveTitleAudio(title: Title,language: String,name: String) { preferences.edit { it[stringPreferencesKey("audio.${key(title)}")]=JSONObject().put("language",language).put("name",name).toString() } }
 suspend fun titleAudio(title: Title): Pair<String,String>? = preferences.data.first()[stringPreferencesKey("audio.${key(title)}")]?.let { runCatching { JSONObject(it).let { obj->obj.optString("language") to obj.optString("name") } }.getOrNull() }
 private fun key(title: Title)="${title.kind.name}:${title.id}"
 private fun encodeTitle(t: Title)=JSONObject().put("id",t.id).put("kind",t.kind.name).put("name",t.name).put("poster",t.poster).put("backdrop",t.backdrop).put("year",t.year).put("synopsis",t.synopsis).put("genres",JSONArray(t.genres)).put("country",t.country).put("duration",t.durationSeconds).toString()
 private fun decodeTitle(json: String): Title {val o=JSONObject(json);return Title(o.getString("id"),o.getString("name"),Kind.valueOf(o.getString("kind")),o.optString("poster"),o.optString("backdrop"),o.optString("year"),o.optString("synopsis"),(0 until (o.optJSONArray("genres")?.length()?:0)).map { o.getJSONArray("genres").getString(it) },o.optString("country"),o.optLong("duration"))}
}
