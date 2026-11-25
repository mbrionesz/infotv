package com.matiasb.xuperandroid.data
import org.junit.Test
import org.junit.Assert.*
class CatalogStatsTest {
 @Test fun repeatsDoNotInventChanges(){val old=listOf(CountRecord(100,50,1));assertEquals(old,appendCount(old,CountRecord(90,60,2)))}
 @Test fun sixthRecordKeepsPreviousAndLatest(){var history=emptyList<CountRecord>();for(i in 1..6)history=appendCount(history,CountRecord(100+i,50,i.toLong()));assertEquals(listOf(5L,6L),history.map {it.at})}
 @Test fun sumCannotOverflow(){assertEquals(4294967294L,CountRecord(Int.MAX_VALUE,Int.MAX_VALUE,0).total)}
 @Test(expected=IllegalArgumentException::class) fun unknownCountIsNotZero(){appendCount(emptyList(),CountRecord(-1,50,0))}
 @Test fun regularHistoryKeepsFive(){var history=emptyList<CountRecord>();for(i in 1..5)history=appendCount(history,CountRecord(i,50,i.toLong()));assertEquals(5,history.size)}
}
