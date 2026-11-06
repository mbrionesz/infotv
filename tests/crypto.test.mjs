import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, createHash } from 'node:crypto';
import shim from '../browser/crypto.js';
const key = Buffer.from('0123456789abcdeffedcba98765432100011223344556677', 'hex');
test('widget 3DES/ECB/PKCS7 matches Node OpenSSL for UTF-8 and block boundaries', () => {
  for (const value of ['', '12345678', 'áéíóú 日本語', JSON.stringify({ userId: 'test', name: 'Canal de prueba' })]) {
    const input = Buffer.from(value);
    const reference = createCipheriv('des-ede3', key, Buffer.alloc(0));
    const expected = Buffer.concat([reference.update(input), reference.final()]);
    const browser = shim.createCipheriv('des-ede3', key);
    const actual = Buffer.concat([browser.update(input), browser.final()]);
    assert.deepEqual(actual, expected);
    const decrypt = shim.createDecipheriv('des-ede3', key);
    assert.equal(Buffer.concat([decrypt.update(actual), decrypt.final()]).toString(), value);
  }
});
test('widget digest matches MD5 used by the portal; secure random has requested length', () => {
  const value = 'sample device token';
  assert.equal(shim.createHash('md5').update(value).digest('hex'), createHash('md5').update(value).digest('hex'));
  assert.equal(shim.randomBytes(16).length, 16);
});
