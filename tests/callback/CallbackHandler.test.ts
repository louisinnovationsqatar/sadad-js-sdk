// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import { SadadConfig } from '../../src/SadadConfig.js';
import { SignatureV1 } from '../../src/signature/SignatureV1.js';
import { SaltGenerator } from '../../src/encryption/SaltGenerator.js';
import { AESEncryptor } from '../../src/encryption/AESEncryptor.js';
import { SignatureError } from '../../src/errors/SignatureError.js';
import { CallbackHandler } from '../../src/callback/CallbackHandler.js';
import { CallbackResult } from '../../src/callback/CallbackResult.js';

function buildV1Payload(
  params: Record<string, unknown>,
  secretKey: string,
): Record<string, unknown> {
  const hash = SignatureV1.generate(params, secretKey);
  return { ...params, checksumhash: hash };
}

function buildV2Payload(
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

describe('CallbackHandler', () => {
  let config: SadadConfig;

  beforeEach(() => {
    config = new SadadConfig({
      merchantId: '7015085',
      secretKey: 'T1ds45#sGQbodf5',
      website: 'www.example.com',
      environment: 'test',
    });
  });

  function defaultV1PostData(): Record<string, unknown> {
    return {
      ORDERID: 'ORD-CB-001',
      transaction_number: 'TXN-XYZ-1234',
      TXNAMOUNT: '250.00',
      RESPCODE: '1',
      RESPMSG: 'Payment successful',
      STATUS: 'TXN_SUCCESS',
    };
  }

  // --- v1.1 callback ---

  describe('v1.1', () => {
    it('returns a CallbackResult instance for valid v1.1 callback', () => {
      const postData = buildV1Payload(defaultV1PostData(), config.secretKey);
      const result = new CallbackHandler(config).handle(postData, 'v1.1');
      expect(result).toBeInstanceOf(CallbackResult);
    });

    it('parses all fields correctly for v1.1', () => {
      const postData = buildV1Payload(defaultV1PostData(), config.secretKey);
      const result = new CallbackHandler(config).handle(postData, 'v1.1');

      expect(result.isSuccess).toBe(true);
      expect(result.orderNumber).toBe('ORD-CB-001');
      expect(result.transactionNumber).toBe('TXN-XYZ-1234');
      expect(result.amount).toBe(250.0);
      expect(result.responseCode).toBe('1');
      expect(result.responseMessage).toBe('Payment successful');
      expect(result.status).toBe('TXN_SUCCESS');
    });

    it('isSuccess is false when RESPCODE is not 1', () => {
      const postData = buildV1Payload(
        { ...defaultV1PostData(), RESPCODE: '0' },
        config.secretKey,
      );
      const result = new CallbackHandler(config).handle(postData, 'v1.1');
      expect(result.isSuccess).toBe(false);
    });

    it('throws SignatureError for tampered v1.1 data', () => {
      const postData = buildV1Payload(defaultV1PostData(), config.secretKey);
      postData['TXNAMOUNT'] = '9999.99';

      expect(() => new CallbackHandler(config).handle(postData, 'v1.1')).toThrow(SignatureError);
    });
  });

  // --- v2.1 callback ---

  describe('v2.1', () => {
    it('returns a CallbackResult instance for valid v2.1 callback', () => {
      const postData = buildV2Payload(defaultV1PostData(), config.secretKey, config.merchantId);
      const result = new CallbackHandler(config).handle(postData, 'v2.1');
      expect(result).toBeInstanceOf(CallbackResult);
    });

    it('parses isSuccess for v2.1', () => {
      const postData = buildV2Payload(defaultV1PostData(), config.secretKey, config.merchantId);
      const result = new CallbackHandler(config).handle(postData, 'v2.1');
      expect(result.isSuccess).toBe(true);
    });

    it('throws SignatureError for tampered v2.1 data', () => {
      const postData = buildV2Payload(defaultV1PostData(), config.secretKey, config.merchantId);
      postData['TXNAMOUNT'] = '9999.99';

      expect(() => new CallbackHandler(config).handle(postData, 'v2.1')).toThrow(SignatureError);
    });
  });

  // --- v2.2 callback ---

  describe('v2.2', () => {
    it('v2.2 uses same algorithm as v2.1', () => {
      const postData = buildV2Payload(defaultV1PostData(), config.secretKey, config.merchantId);
      const result = new CallbackHandler(config).handle(postData, 'v2.2');
      expect(result).toBeInstanceOf(CallbackResult);
      expect(result.isSuccess).toBe(true);
    });
  });

  // --- Default version ---

  it('defaults to v1.1 when version is omitted', () => {
    const postData = buildV1Payload(defaultV1PostData(), config.secretKey);
    const result = new CallbackHandler(config).handle(postData);
    expect(result).toBeInstanceOf(CallbackResult);
  });

  // --- Unsupported version ---

  it('throws Error for unsupported version', () => {
    const postData = buildV1Payload(defaultV1PostData(), config.secretKey);
    expect(() => new CallbackHandler(config).handle(postData, 'v3.0')).toThrow(
      'Unsupported callback version',
    );
  });
});
