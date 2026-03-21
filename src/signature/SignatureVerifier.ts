// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { createHash } from 'node:crypto';
import { AESEncryptor } from '../encryption/AESEncryptor.js';
import { SignatureError } from '../errors/SignatureError.js';
import { SignatureV1 } from './SignatureV1.js';

export class SignatureVerifier {
  /**
   * Verify a SADAD v1 callback by comparing the received checksumhash
   * against an expected hash generated from the remaining parameters.
   */
  static verifyV1Callback(
    params: Record<string, unknown>,
    secretKey: string,
  ): true {
    const received = String(params['checksumhash'] ?? '');
    const rest = { ...params };
    delete rest['checksumhash'];

    const expected = SignatureV1.generate(rest, secretKey);

    if (!timingSafeEqual(expected, received)) {
      throw new SignatureError(expected, received);
    }

    return true;
  }

  /**
   * Verify a SADAD webhook payload using the v1 signature algorithm.
   * Functionally identical to verifyV1Callback — provided as a named alias
   * for webhook use-cases for clarity.
   */
  static verifyWebhook(
    payload: Record<string, unknown>,
    secretKey: string,
  ): true {
    const received = String(payload['checksumhash'] ?? '');
    const rest = { ...payload };
    delete rest['checksumhash'];

    const expected = SignatureV1.generate(rest, secretKey);

    if (!timingSafeEqual(expected, received)) {
      throw new SignatureError(expected, received);
    }

    return true;
  }

  /**
   * Verify a SADAD v2 callback checksum.
   *
   * SADAD v2 verification protocol uses encodeURIComponent(secretKey) in both
   * the JSON data object and the AES decryption key. This differs from
   * generation (which uses the raw key) and is per the SADAD spec.
   *
   * Algorithm:
   *   1. Extract and remove checksumhash from params.
   *   2. Build verification data: { postData: params, secretKey: encodeURIComponent(secretKey) }
   *   3. Decrypt checksumhash using key: encodeURIComponent(secretKey) + merchantId
   *   4. Extract salt (last 4 chars) and hash (first 64 chars) from decrypted string.
   *   5. Re-derive: sha256(JSON.stringify(verificationData) + '|' + salt)
   *   6. Compare. Throw SignatureError on mismatch.
   */
  static verifyV2Callback(
    params: Record<string, unknown>,
    secretKey: string,
    merchantId: string,
  ): true {
    const receivedChecksum = String(params['checksumhash'] ?? '');
    const rest = { ...params };
    delete rest['checksumhash'];

    const encodedKey = encodeURIComponent(secretKey);

    const verificationData = {
      postData: rest,
      secretKey: encodedKey,
    };

    const decryptionKey = encodedKey + merchantId;

    let decrypted: string;
    try {
      decrypted = AESEncryptor.decrypt(receivedChecksum, decryptionKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new SignatureError('', receivedChecksum, `Checksum decryption failed: ${msg}`);
    }

    const hash = decrypted.slice(0, 64);
    const salt = decrypted.slice(64, 68);

    const jsonString = JSON.stringify(verificationData);
    const expectedHash = createHash('sha256')
      .update(jsonString + '|' + salt, 'utf8')
      .digest('hex');

    if (!timingSafeEqual(expectedHash, hash)) {
      throw new SignatureError(expectedHash, hash);
    }

    return true;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
