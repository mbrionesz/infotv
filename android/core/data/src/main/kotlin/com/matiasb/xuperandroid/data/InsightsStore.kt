package com.matiasb.xuperandroid.data
import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.preferences.core.*
import kotlinx.coroutines.flow.*
import org.json.JSONObject
import org.json.JSONArray
private val Context.insights by preferencesDataStore("portal_insights")
class InsightsStore(context: Context) {
 private val store=context.applicationContext.insights
 val stats=store.data.map { prefs->val json=runCatching { JSONArray(prefs[stringPreferencesKey("counts")]?:"[]") }.getOrDefault(JSONArray());CatalogStats((0 until json.length()).mapNotNull { i->runCatching { val row=json.getJSONObject(i);CountRecord(row.getInt("movies"),row.getInt("series"),row.getLong("at")) }.getOrNull() }.filter { it.movies>=0&&it.series>=0 }.takeLast(5),prefs[longPreferencesKey("checked")]?:0,prefs[stringPreferencesKey("version")].orEmpty(),prefs[longPreferencesKey("versionAt")]?:0) }
 suspend fun record(movies: Int,series: Int,at: Long=System.currentTimeMillis()) {
  require(movies>=0&&series>=0)
  store.edit { prefs->
   val rows=runCatching {JSONArray(prefs[stringPreferencesKey("counts")]?:"[]").objects().map {CountRecord(it.getInt("movies"),it.getInt("series"),it.getLong("at"))}}.getOrDefault(emptyList())
   val next=appendCount(rows,CountRecord(movies,series,at))
   prefs[stringPreferencesKey("counts")]=JSONArray(next.map {JSONObject().put("movies",it.movies).put("series",it.series).put("total",it.total).put("at",it.at)}).toString()
   prefs[longPreferencesKey("checked")]=at
  }
 }

 suspend fun observeVersion(fields: Map<String,String>) { if(fields.isEmpty())return;store.edit { prefs->val now=System.currentTimeMillis();if(now-(prefs[longPreferencesKey("versionAt")]?:0)>=7*86400000L){prefs[stringPreferencesKey("version")]=fields.entries.sortedBy { it.key }.joinToString(" · "){it.key+": "+it.value.take(100)};prefs[longPreferencesKey("versionAt")]=now} } }
}
