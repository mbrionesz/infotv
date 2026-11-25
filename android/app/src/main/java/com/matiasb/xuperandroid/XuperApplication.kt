package com.matiasb.xuperandroid
import android.app.Application
import okio.Path.Companion.toPath
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.player.AndroidPlayer
class XuperApplication: Application(), coil3.SingletonImageLoader.Factory {
 val http by lazy { networkClient() }
 override fun newImageLoader(context: android.content.Context): coil3.ImageLoader {
  val lowRam=(context.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager).isLowRamDevice
  return coil3.ImageLoader.Builder(context).memoryCache { coil3.memory.MemoryCache.Builder().maxSizeBytes((if(lowRam)8L else 16L)*1024*1024).build() }.diskCache { coil3.disk.DiskCache.Builder().directory(context.cacheDir.resolve("images").absolutePath.toPath()).maxSizeBytes(20L*1024*1024).build() }.components { add(coil3.network.okhttp.OkHttpNetworkFetcherFactory(callFactory={http.newBuilder().addInterceptor(OriginCredentials {emptyMap()}).build()})) }.build()
 }
 val insights by lazy { InsightsStore(this) }
 val artwork by lazy {HeroArtwork(this,http)}
 val diagnostics by lazy { Diagnostics(http) }
 val library by lazy { LibraryStore(this) }
 val portal by lazy { PortalRepository(PortalClient(SessionVault(this),http){fields->insights.observeVersion(fields)}) }
 val player by lazy { AndroidPlayer(this,http) }
}
