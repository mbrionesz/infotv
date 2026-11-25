plugins { id("com.android.application"); id("org.jetbrains.kotlin.plugin.compose") }
android {
 namespace = "com.matiasb.xuperandroid"; compileSdk { version = release(37) { minorApiLevel = 2 } }
 defaultConfig { applicationId = "com.matiasb.xuperandroid"; minSdk = 26; targetSdk = 37; versionCode = 1; versionName = "0.1.0-alpha.1"; testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner" }
 buildFeatures { compose = true; buildConfig = true }
 buildTypes { release { isMinifyEnabled = true; isShrinkResources = true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro") } }
}
dependencies {
 implementation(project(":core:data")); implementation(project(":core:player")); implementation(project(":core:model"))
 implementation(platform("androidx.compose:compose-bom:2026.11.01"))
 implementation("androidx.activity:activity-compose:1.13.0")
 implementation("androidx.compose.material3:material3")
 implementation("androidx.compose.material:material-icons-extended")
 implementation("androidx.compose.ui:ui-tooling-preview")
 debugImplementation("androidx.compose.ui:ui-tooling")
 implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.11.1")
 implementation("androidx.lifecycle:lifecycle-runtime-compose:2.11.1")
 implementation("io.coil-kt.coil3:coil-compose:3.3.0")
 implementation("io.coil-kt.coil3:coil-network-okhttp:3.3.0")
 androidTestImplementation(platform("androidx.compose:compose-bom:2026.11.01"))
 androidTestImplementation("androidx.compose.ui:ui-test-junit4")
 debugImplementation("androidx.compose.ui:ui-test-manifest")
 androidTestImplementation("androidx.test.ext:junit:1.3.0")
 androidTestImplementation("androidx.test:runner:1.7.0")
 androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
}
