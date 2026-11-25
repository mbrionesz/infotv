plugins { id("com.android.library") }
android { namespace = "com.matiasb.xuperandroid.player"; compileSdk { version = release(37) { minorApiLevel = 2 } }; defaultConfig { minSdk = 26 } }
dependencies {
 api(project(":core:model")); implementation(project(":core:data"))
 api("androidx.media3:media3-exoplayer:1.11.1")
 implementation("androidx.media3:media3-exoplayer-hls:1.11.1")
 implementation("androidx.media3:media3-exoplayer-dash:1.11.1")
 implementation("androidx.media3:media3-datasource-okhttp:1.11.1")
 api("androidx.media3:media3-ui:1.11.1")
 implementation("androidx.media3:media3-session:1.11.1")
 implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
}
