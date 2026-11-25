package com.matiasb.xuperandroid
import android.app.Application
import okio.Path.Companion.toPath
import com.matiasb.xuperandroid.data.*
import com.matiasb.xuperandroid.player.AndroidPlayer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
open class XuperApplication: Application(), coil3.SingletonImageLoader.Factory {
 val http by lazy { networkClient() }
 override fun newImageLoader(context: android.content.Context): coil3.ImageLoader {
  val lowRam=(context.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager).isLowRamDevice
  return coil3.ImageLoader.Builder(context).memoryCache { coil3.memory.MemoryCache.Builder().maxSizeBytes((if(lowRam)8L else 16L)*1024*1024).build() }.diskCache { coil3.disk.DiskCache.Builder().directory(context.cacheDir.resolve("images").absolutePath.toPath()).maxSizeBytes(20L*1024*1024).build() }.components { add(coil3.network.okhttp.OkHttpNetworkFetcherFactory(callFactory={http.newBuilder().addInterceptor(OriginCredentials {emptyMap()}).build()})) }.build()
 }
 val insights by lazy { InsightsStore(this) }
 val artwork by lazy {HeroArtwork(this,http)}
 val diagnostics by lazy { Diagnostics(http) }
 val library by lazy { LibraryStore(this) }
 private val portalClient by lazy {PortalClient(SessionVault(this),http){fields->insights.observeVersion(fields)}}
 val portal by lazy { PortalRepository(portalClient) }
 open fun repository(demo: Boolean): CatalogRepository=if(demo)FixtureRepository()else portal
 val player by lazy { AndroidPlayer(this,http) }
 /** Explicit disposable stores only: never delete filesDir, databases or preferences. */
 @OptIn(coil3.annotation.DelicateCoilApi::class)
 suspend fun clearTemporaryData() {
  val loader=coil3.SingletonImageLoader.get(this)
  loader.shutdown()
  try {
   http.dispatcher.cancelAll()
   withContext(Dispatchers.IO) {
    loader.diskCache?.clear()
    artwork.clear()
    portal.clearTemporary()
    portalClient.reset()
    (http.dns as? BoundedDns)?.clear()
    http.cache?.evictAll()
    http.connectionPool.evictAll()
   }
  } finally {
   try {withContext(kotlinx.coroutines.NonCancellable+Dispatchers.IO){loader.diskCache?.shutdown()}}
   finally {coil3.SingletonImageLoader.setUnsafe {context->newImageLoader(context)}}
  }
 }
}
