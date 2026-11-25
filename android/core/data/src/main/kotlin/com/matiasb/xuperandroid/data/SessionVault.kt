package com.matiasb.xuperandroid.data
import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import org.json.JSONObject
import java.security.KeyStore
import java.util.Base64
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
class SessionVault(context: Context) {
 private val prefs=context.getSharedPreferences("private_portal_session",Context.MODE_PRIVATE)
 val installationId: String = prefs.getString("installation",null) ?: UUID.randomUUID().toString().also { prefs.edit().putString("installation",it).apply() }
 private fun key(): SecretKey {
  val store=KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
  return (store.getKey("xuper.portal",null) as? SecretKey) ?: KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore").apply { init(KeyGenParameterSpec.Builder("xuper.portal",KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build()) }.generateKey()
 }
 fun read(): JSONObject? = runCatching { val blob=Base64.getDecoder().decode(prefs.getString("encrypted",null) ?: return null);val cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),GCMParameterSpec(128,blob.copyOfRange(0,12)));JSONObject(cipher.doFinal(blob.copyOfRange(12,blob.size)).toString(Charsets.UTF_8)) }.getOrNull()
 fun save(session: JSONObject) { val cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());prefs.edit().putString("encrypted",Base64.getEncoder().encodeToString(cipher.iv+cipher.doFinal(session.toString().toByteArray()))).apply() }
 fun clear() { prefs.edit().remove("encrypted").apply() }
}
