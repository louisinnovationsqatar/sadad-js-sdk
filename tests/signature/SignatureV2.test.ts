// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { SignatureV2 } from '../../src/signature/SignatureV2.js';
import { AESEncryptor } from '../../src/encryption/AESEncryptor.js';

describe('SignatureV2', () => {
  const secretKey = 'T1ds45#sGQbodf5';
  const merchantId = '7015085';

  const postData = {
    CALLBACK_URL: 'https://www.example.com/callback',
    EMAIL: 'example@gmail.com',
    MOBILE_NO: '77778888',
    ORDER_ID: '1002',
    TXN_AMOUNT: '200.00',
    WEBSITE: 'www.example.com',
    merchant_id: '1234567',
    txnDate: '2022-01-15 20:12:40',
  };

  it('returns a non-empty string', () => {
    const result = SignatureV2.generate(postData, secretKey, merchantId);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns valid base64', () => {
    const result = SignatureV2.generate(postData, secretKey, merchantId);
    expect(/^[A-Za-z0-9+/]+=*$/.test(result)).toBe(true);
    const decoded = Buffer.from(result, 'base64');
    expect(decoded.length).toBeGreaterThan(0);
  });

  it('checksum can be verified via decrypt (roundtrip)', () => {
    const result = SignatureV2.generate(postData, secretKey, merchantId);

    // Decrypt using same key strategy: secretKey + merchantId
    const key = secretKey + merchantId;
    const decrypted = AESEncryptor.decrypt(result, key);

    // Decrypted string must be 68 chars: 64-char hex hash + 4-char salt
    expect(decrypted).toHaveLength(68);

    const hash = decrypted.slice(0, 64);
    const salt = decrypted.slice(64, 68);

    // Verify hash is valid 64-char lowercase hex
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);

    // Re-derive the hash
    const checksumData = { postData, secretKey };
    const jsonString = JSON.stringify(checksumData);
    const expectedHash = createHash('sha256')
      .update(jsonString + '|' + salt, 'utf8')
      .digest('hex');

    expect(hash).toBe(expectedHash);
  });

  it('different post data produces different checksums (hash portions differ)', () => {
    const postData2 = { ...postData, ORDER_ID: '9999' };

    const checksum1 = SignatureV2.generate(postData, secretKey, merchantId);
    const checksum2 = SignatureV2.generate(postData2, secretKey, merchantId);

    const key = secretKey + merchantId;
    const decrypted1 = AESEncryptor.decrypt(checksum1, key);
    const decrypted2 = AESEncryptor.decrypt(checksum2, key);

    const hash1 = decrypted1.slice(0, 64);
    const hash2 = decrypted2.slice(0, 64);

    expect(hash1).not.toBe(hash2);
  });

  it('different secret keys produce different checksums', () => {
    const checksum1 = SignatureV2.generate(postData, 'keyA123456789012', merchantId);
    const checksum2 = SignatureV2.generate(postData, 'keyB123456789012', merchantId);

    expect(checksum1).not.toBe(checksum2);
  });

  it('different merchant IDs produce different checksums', () => {
    const checksum1 = SignatureV2.generate(postData, secretKey, '1000001');
    const checksum2 = SignatureV2.generate(postData, secretKey, '2000002');

    expect(checksum1).not.toBe(checksum2);
  });

  it('generates different checksums on repeated calls due to random salt', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(SignatureV2.generate(postData, secretKey, merchantId));
    }
    // With random salt, results should differ (overwhelmingly likely)
    expect(results.size).toBeGreaterThan(1);
  });
});
