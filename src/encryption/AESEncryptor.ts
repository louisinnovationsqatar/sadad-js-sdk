// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { createCipheriv, createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-128-cbc';
const IV = Buffer.from('@@@@&&&&####$$$$', 'utf8'); // fixed 16-byte IV

/**
 * Prepare the AES-128 key: take up to 16 characters from the key string,
 * then zero-pad to exactly 16 bytes. This matches PHP's openssl_encrypt
 * behavior which silently pads short keys.
 */
function prepareKey(key: string): Buffer {
  const truncated = key.slice(0, 16);
  const buf = Buffer.alloc(16, 0);
  buf.write(truncated, 0, 'utf8');
  return buf;
}

export class AESEncryptor {
  static encrypt(input: string, key: string): string {
    const keyBuf = prepareKey(key);
    const cipher = createCipheriv(ALGORITHM, keyBuf, IV);
    const encrypted = Buffer.concat([cipher.update(input, 'utf8'), cipher.final()]);
    return encrypted.toString('base64');
  }

  static decrypt(input: string, key: string): string {
    const keyBuf = prepareKey(key);
    const rawData = Buffer.from(input, 'base64');
    const decipher = createDecipheriv(ALGORITHM, keyBuf, IV);
    const decrypted = Buffer.concat([decipher.update(rawData), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
