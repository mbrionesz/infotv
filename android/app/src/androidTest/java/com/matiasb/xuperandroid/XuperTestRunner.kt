package com.matiasb.xuperandroid
import android.app.Application
import android.content.Context
import androidx.test.runner.AndroidJUnitRunner
import com.matiasb.xuperandroid.data.CatalogRepository
class XuperTestRunner: AndroidJUnitRunner() {
 override fun newApplication(cl: ClassLoader,className: String,context: Context): Application=super.newApplication(cl,XuperTestApplication::class.java.name,context)
}
class XuperTestApplication: XuperApplication() {
 @Volatile var catalogOverride: CatalogRepository?=null
 override fun repository(demo: Boolean)=catalogOverride?:super.repository(demo)
}
