package com.matiasb.xuperandroid.data
data class CountRecord(val movies: Int,val series: Int,val at: Long){val total: Long get()=movies.toLong()+series}
data class CatalogStats(val history: List<CountRecord> = emptyList(),val checkedAt: Long=0,val version: String="",val versionAt: Long=0)
internal fun appendCount(history: List<CountRecord>,record: CountRecord): List<CountRecord> {
 require(record.movies>=0&&record.series>=0)
 if(history.lastOrNull()?.total==record.total)return history
 val next=history+record
 return if(next.size>5)next.drop(4).takeLast(5) else next
}
