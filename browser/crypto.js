import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
function bytes(words) {
  const result = Buffer.alloc(words.sigBytes);
  for (let i = 0; i < result.length; i++) result[i] = (words.words[i >>> 2] >>> (24 - 8 * (i % 4))) & 255;
  return result;
}
function cipher(key, decrypt) {
  const chunks = [];
  return {
    update(chunk) { chunks.push(Buffer.from(chunk)); return Buffer.alloc(0); },
    final() {
      const data = CryptoJS.lib.WordArray.create(Buffer.concat(chunks));
      const options = { mode: CryptoJS.mode.ECB, padding: decrypt ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7 };
      const secret = CryptoJS.lib.WordArray.create(key);
      if (!decrypt) return bytes(CryptoJS.TripleDES.encrypt(data, secret, options).ciphertext);
      const result = bytes(CryptoJS.TripleDES.decrypt({ ciphertext: data }, secret, options));
      const padding = result[result.length - 1];
      if (!padding || padding > 8 || result.length % 8) throw new Error('Invalid portal padding');
      for (let i = result.length - padding; i < result.length; i++) if (result[i] !== padding) throw new Error('Invalid portal padding');
      return result.subarray(0, result.length - padding);
    }
  };
}
export default {
  createCipheriv(name, key) { if (name !== 'des-ede3') throw new Error('Unsupported cipher'); return cipher(key, false); },
  createDecipheriv(name, key) { if (name !== 'des-ede3') throw new Error('Unsupported cipher'); return cipher(key, true); },
  createHash(name) {
    if (name !== 'md5') throw new Error('Unsupported digest');
    const md5 = CryptoJS.algo.MD5.create();
    return { update(data) { md5.update(CryptoJS.lib.WordArray.create(Buffer.from(data))); return this; }, digest(format) { return bytes(md5.finalize()).toString(format); } };
  },
  randomBytes(count) {
    const values = new Uint8Array(count);
    const source = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    if (!source || !source.getRandomValues) throw new Error('Secure random unavailable');
    source.getRandomValues(values); return Buffer.from(values);
  }
};
