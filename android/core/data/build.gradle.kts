plugins { id("com.android.library"); id("com.google.devtools.ksp") }
android { namespace = "com.matiasb.xuperandroid.data"; compileSdk { version = release(37) { minorApiLevel = 2 } }; defaultConfig { minSdk = 26 }; testOptions { unitTests.isReturnDefaultValues = true } }
dependencies {
 api(project(":core:model"))
 implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
 api("com.squareup.okhttp3:okhttp:4.12.0")
 implementation("com.squareup.okhttp3:okhttp-dnsoverhttps:4.12.0")
 implementation("androidx.datastore:datastore-preferences:1.3.0")
 implementation("androidx.room:room-runtime:2.8.5")
 implementation("androidx.room:room-ktx:2.8.5")
 ksp("androidx.room:room-compiler:2.8.5")
 testImplementation("junit:junit:4.13.2")
 testImplementation("org.json:json:20250517")
 testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
}
ksp { arg("room.schemaLocation", "$projectDir/schemas") }
