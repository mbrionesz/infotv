import groovy.json.JsonSlurper

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

// Windows and Android share one resolver catalog; never copy a second static list.
abstract class GenerateResolverCatalog : DefaultTask() {
 @get:InputFile abstract val catalog: RegularFileProperty
 @get:OutputDirectory abstract val outputDirectory: DirectoryProperty
 @TaskAction fun generate() {
  @Suppress("UNCHECKED_CAST")
  val rows=JsonSlurper().parse(catalog.get().asFile) as List<Map<String,String>>
  require(rows.isNotEmpty() && rows.map {it.getValue("ip")}.distinct().size==rows.size)
  fun literal(value: String)="\""+value.replace("\\","\\\\").replace("\"","\\\"")+"\""
  val entries=rows.joinToString(",\n") { row->
   " ResolverEndpoint("+listOf("ip","host","path","provider").joinToString(",") {literal(row.getValue(it))}+")"
  }
  val output=outputDirectory.get().file("com/matiasb/xuperandroid/data/SharedResolvers.kt").asFile
  output.parentFile.mkdirs()
  output.writeText("package com.matiasb.xuperandroid.data\n// Generated from desktop/resolvers.json.\ninternal val SHARED_RESOLVERS=listOf(\n"+entries+"\n)\n")
 }
}
val generateResolverCatalog=tasks.register<GenerateResolverCatalog>("generateResolverCatalog") {
 catalog.set(rootProject.file("../desktop/resolvers.json"))
 outputDirectory.set(layout.buildDirectory.dir("generated/resolverCatalog"))
}
androidComponents.onVariants { variant->
 variant.sources.kotlin?.addGeneratedSourceDirectory(generateResolverCatalog) {it.outputDirectory}
}

// Generate Android's wire profile from the same configuration used by the
// Tizen/Windows build adapter, not the unpatched archived magis.js.
abstract class GeneratePortalProfile : DefaultTask() {
 @get:InputFile abstract val catalog: RegularFileProperty
 @get:OutputDirectory abstract val outputDirectory: DirectoryProperty
 @TaskAction fun generate() {
  @Suppress("UNCHECKED_CAST")
  val profile=JsonSlurper().parse(catalog.get().asFile) as Map<String,Any>
  val fields=mapOf("appId" to "APP_ID","apkVersion" to "APK_VERSION","apkVer" to "APK_HEADER","spkgVer" to "PROFILE","sdkVer" to "PROTOCOL_SDK")
  require(profile.keys==fields.keys)
  val constants=fields.entries.joinToString("\n") { (key,name)->
   val value=profile.getValue(key)
   require(if(key=="sdkVer")value is Number&&value.toInt()>0 else value is String&&value.isNotBlank())
   " const val $name="+groovy.json.JsonOutput.toJson(value)
  }
  val output=outputDirectory.get().file("com/matiasb/xuperandroid/data/SharedPortalProfile.kt").asFile
  output.parentFile.mkdirs()
  output.writeText("package com.matiasb.xuperandroid.data\n// Generated from shared/portal-profile.json.\ninternal object SharedPortalProfile {\n$constants\n}\n")
 }
}
val generatePortalProfile=tasks.register<GeneratePortalProfile>("generatePortalProfile") {
 catalog.set(rootProject.file("../shared/portal-profile.json"))
 outputDirectory.set(layout.buildDirectory.dir("generated/portalProfile"))
}
androidComponents.onVariants { variant->
 variant.sources.kotlin?.addGeneratedSourceDirectory(generatePortalProfile) {it.outputDirectory}
}
android.sourceSets.getByName("test").resources.srcDir(rootProject.file("../shared"))
