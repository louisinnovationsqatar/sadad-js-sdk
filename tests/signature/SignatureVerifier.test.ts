// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { AESEncryptor } from '../../src/encryption/AESEncryptor.js';
import { SaltGenerator } from '../../src/encryption/SaltGenerator.js';
import { SignatureError } from '../../src/errors/SignatureError.js';
import { SignatureV1 } from '../../src/signature/SignatureV1.js';
import { SignatureVerifier } from '../../src/signature/SignatureVerifier.js';

const SECRET_KEY = 'T1ds45#sGQbodf5';
const MERCHANT_ID = '7015085';

function buildV1Params(
  params: Record<string, unknown>,
  secretKey: string,
): Record<string, unknown> {
  const hash = SignatureV1.generate(params, secretKey);
  return { ...params, checksumhash: hash };
}

function buildV2Params(
  params: Record<string, unknown>,
  secretKey: string,
  merchantId: string,
): Record<string, unknown> {
  const encodedKey = encodeURIComponent(secretKey);
  const checksumData = { postData: params, secretKey: encodedKey };
  const jsonString = JSON.stringify(checksumData);
  const salt = SaltGenerator.generate(4);
  const finalString = jsonString + '|' + salt;
  const hash = createHash('sha256').update(finalString, 'utf8').digest('hex');
  const hashString = hash + salt;
  const key = encodedKey + merchantId;
  return { ...params, checksumhash: AESEncryptor.encrypt(hashString, key) };
}

describe('SignatureVerifier', () => {
  // --- verifyV1Callback ---

  describe('verifyV1Callback', () => {
    it('returns true for valid signature', () => {
      const params = buildV1Params(
        { ORDER_ID: '1001', TXN_AMOUNT: '200.00', WEBSITE: 'www.example.com' },
        SECRET_KEY,
      );
      expect(SignatureVerifier.verifyV1Callback(params, SECRET_KEY)).toBe(true);
    });

    it('throws SignatureError for tampered data', () => {
      const params = buildV1Params({ ORDER_ID: '1001', TXN_AMOUNT: '200.00' }, SECRET_KEY);
      params['TXN_AMOUNT'] = '999.99';

      expect(() => SignatureVerifier.verifyV1Callback(params, SECRET_KEY)).toThrow(SignatureError);
    });

    it('throws SignatureError for tampered checksumhash', () => {
      const params = buildV1Params({ ORDER_ID: '1001' }, SECRET_KEY);
      params['checksumhash'] = 'a'.repeat(64);

      expect(() => SignatureVerifier.verifyV1Callback(params, SECRET_KEY)).toThrow(SignatureError);
    });

    it('does not mutate the input object', () => {
      const params = buildV1Params({ ORDER_ID: '1001' }, SECRET_KEY);
      const original = JSON.stringify(params);

      SignatureVerifier.verifyV1Callback(params, SECRET_KEY);

      expect(JSON.stringify(params)).toBe(original);
    });

    it('SignatureError contains expectedHash and receivedHash', () => {
      const params = buildV1Params({ ORDER_ID: '1001' }, SECRET_KEY);
      params['checksumhash'] = 'badvalue';

      try {
        SignatureVerifier.verifyV1Callback(params, SECRET_KEY);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SignatureError);
        const sigErr = err as SignatureError;
        expect(sigErr.expectedHash).toHaveLength(64);
        expect(sigErr.receivedHash).toBe('badvalue');
      }
    });
  });

  // --- verifyWebhook ---

  describe('verifyWebhook', () => {
    it('returns true for valid signature', () => {
      const params = buildV1Params(
        {
          ORDER_ID: '5000',
          TXN_AMOUNT: '500.00',
          TXNID: 'TXN123456',
          STATUS: 'TXN_SUCCESS',
        },
        SECRET_KEY,
      );
      expect(SignatureVerifier.verifyWebhook(params, SECRET_KEY)).toBe(true);
    });

    it('throws SignatureError for tampered payload', () => {
      const params = buildV1Params(
        { ORDER_ID: '5000', TXN_AMOUNT: '500.00', STATUS: 'TXN_SUCCESS' },
        SECRET_KEY,
      );
      params['STATUS'] = 'TXN_FAILURE';

      expect(() => SignatureVerifier.verifyWebhook(params, SECRET_KEY)).toThrow(SignatureError);
    });

    it('does not mutate the input object', () => {
      const params = buildV1Params({ ORDER_ID: '5000', STATUS: 'TXN_SUCCESS' }, SECRET_KEY);
      const original = JSON.stringify(params);

      SignatureVerifier.verifyWebhook(params, SECRET_KEY);

      expect(JSON.stringify(params)).toBe(original);
    });
  });

  // --- verifyV2Callback ---

  describe('verifyV2Callback', () => {
    it('returns true for valid checksum', () => {
      const params = buildV2Params(
        { ORDER_ID: '2001', TXN_AMOUNT: '300.00', WEBSITE: 'www.example.com' },
        SECRET_KEY,
        MERCHANT_ID,
      );
      expect(SignatureVerifier.verifyV2Callback(params, SECRET_KEY, MERCHANT_ID)).toBe(true);
    });

    it('returns true for secret key with special characters', () => {
      const specialKey = 'T1ds45#sGQbodf5'; // contains # special character
      const params = buildV2Params(
        { ORDER_ID: '3001', TXN_AMOUNT: '150.00' },
        specialKey,
        MERCHANT_ID,
      );
      expect(SignatureVerifier.verifyV2Callback(params, specialKey, MERCHANT_ID)).toBe(true);
    });

    it('throws SignatureError for tampered data', () => {
      const params = buildV2Params(
        { ORDER_ID: '2001', TXN_AMOUNT: '300.00' },
        SECRET_KEY,
        MERCHANT_ID,
      );
      params['ORDER_ID'] = '9999';

      expect(() =>
        SignatureVerifier.verifyV2Callback(params, SECRET_KEY, MERCHANT_ID),
      ).toThrow(SignatureError);
    });

    it('throws SignatureError for tampered checksumhash', () => {
      const params = buildV2Params({ ORDER_ID: '2001' }, SECRET_KEY, MERCHANT_ID);
      params['checksumhash'] = Buffer.from('X'.repeat(32)).toString('base64');

      expect(() =>
        SignatureVerifier.verifyV2Callback(params, SECRET_KEY, MERCHANT_ID),
      ).toThrow(SignatureError);
    });

    it('does not mutate the input object', () => {
      const params = buildV2Params({ ORDER_ID: '2001' }, SECRET_KEY, MERCHANT_ID);
      const original = JSON.stringify(params);

      SignatureVerifier.verifyV2Callback(params, SECRET_KEY, MERCHANT_ID);

      expect(JSON.stringify(params)).toBe(original);
    });
  });
});
