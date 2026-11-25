package com.matiasb.xuperandroid.data
import java.util.Base64
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
object PortalCrypto {
 private val key = "e7af1ed7de1ffddd7bd3fe37ebdffde9ef3fe1ae39edfeb8".chunked(2).map { it.toInt(16).toByte() }.toByteArray()
 private fun cipher(mode: Int) = Cipher.getInstance("DESede/ECB/PKCS5Padding").apply { init(mode,SecretKeySpec(key,"DESede")) }
 fun encode(json: String): String = Base64.getEncoder().encode(cipher(Cipher.ENCRYPT_MODE).doFinal(json.toByteArray(Charsets.UTF_8))).joinToString("") { "%02x".format(it.toInt() and 255) }
 fun decode(hex: String): String { require(hex.length <= 16 * 1024 * 1024 && hex.length % 2 == 0);return cipher(Cipher.DECRYPT_MODE).doFinal(Base64.getDecoder().decode(hex.chunked(2).map { it.toInt(16).toByte() }.toByteArray())).toString(Charsets.UTF_8) }
 fun encrypt(value: String): String = Base64.getEncoder().encode(cipher(Cipher.ENCRYPT_MODE).doFinal(value.toByteArray())).joinToString("") { "%02x".format(it.toInt() and 255) }
 fun decrypt(value: String): String { val base64=value.chunked(2).map { it.toInt(16).toByte() }.toByteArray();return cipher(Cipher.DECRYPT_MODE).doFinal(Base64.getDecoder().decode(base64)).toString(Charsets.UTF_8) }
 fun md5(value: String) = MessageDigest.getInstance("MD5").digest(value.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
 // Provider-specific MD5 compression order, ported from the archived client.
 fun liveSign(token: String, moment: Long): String {
  val input=("token=$token&sign2_method=sign_o3&instance=0&start_moment=$moment").toByteArray()+byteArrayOf(115,97,108,116,51,51,51,51,61,52,152.toByte(),13,10,21,50,201.toByte(),195.toByte(),130.toByte(),23,8,192.toByte())
  val bytes=input.copyOf(((input.size+8)/64+1)*64);bytes[input.size]=0x80.toByte();val bits=input.size.toLong()*8
  for(i in 0..7)bytes[bytes.size-8+i]=(bits ushr (i*8)).toByte()
  val state=intArrayOf(0x67452301,0xefcdab89.toInt(),0x98badcfe.toInt(),0x10325476)
  val shifts=intArrayOf(7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21)
  val first=intArrayOf(10,11,12,13,14,15,6,7,8,9,0,1,2,3,4,5)
  val k=longArrayOf(3614090360L,3905402710L,606105819L,3250441966L,4118548399L,1200080426L,2821735955L,4249261313L,1770035416L,2336552879L,4294925233L,2304563134L,1804603682L,4254626195L,2792965006L,1236535329L,4129170786L,3225465664L,643717713L,3921069994L,3593408605L,38016083L,3634488961L,3889429448L,568446438L,3275163606L,4107603335L,1163531501L,2850285829L,4243563512L,1735328473L,2368359562L,4294588738L,2272392833L,1839030562L,4259657740L,2763975236L,1272893353L,4139469664L,3200236656L,681279174L,3936430074L,3564056709L,76029189L,3654602809L,3871185381L,530742520L,3299628645L,4096336452L,1126891415L,2878612391L,4237533241L,1700485571L,2399980690L,4293706877L,2240044497L,1873313359L,4264355552L,2734768916L,1309151649L,4149444226L,3174756917L,765973179L,3951481745L).map { it.toInt() }
  for(offset in bytes.indices step 64){val words=IntArray(16){ j->(0..3).fold(0){ value,b->value or ((bytes[offset+j*4+b].toInt() and 255) shl (b*8)) } };var a=state[0];var b=state[1];var c=state[2];var d=state[3]
   for(i in 0..63){val f=when {i<16->(b and c) or (b.inv() and d);i<32->(d and b) or (d.inv() and c);i<48->b xor c xor d;else->c xor (b or d.inv())};val g=when {i<16->first[i];i<32->(5*i+1)%16;i<48->(3*i+5)%16;else->(7*i)%16};val next=b+Integer.rotateLeft(a+f+k[i]+words[g],shifts[(i/16)*4+i%4]);a=d;d=c;c=b;b=next}
   state[0]+=a;state[1]+=b;state[2]+=c;state[3]+=d
  }
  return state.flatMap { n->(0..3).map { i->"%02x".format((n ushr (8*i)) and 255) } }.joinToString("")
 }
}
