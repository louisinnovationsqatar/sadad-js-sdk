// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { SignatureV1 } from '../../src/signature/SignatureV1.js';

describe('SignatureV1', () => {
  // --- Known test vectors ---

  it('test vector 1: known SADAD params produce correct hash', () => {
    const params = {
      CALLBACK_URL: 'https://www.example.com/callback',
      EMAIL: 'example@gmail.com',
      MOBILE_NO: '77778888',
      ORDER_ID: '1002',
      TXN_AMOUNT: '200.00',
      WEBSITE: 'www.example.com',
      merchant_id: '1234567',
      txnDate: '2022-01-15 20:12:40',
    };
    const secretKey = 'T1ds45#sGQbodf5';

    // Sorted keys (case-sensitive, uppercase first):
    // CALLBACK_URL, EMAIL, MOBILE_NO, ORDER_ID, TXN_AMOUNT, WEBSITE, merchant_id, txnDate
    const expected = createHash('sha256')
      .update(
        'T1ds45#sGQbodf5' +
          'https://www.example.com/callback' +
          'example@gmail.com' +
          '77778888' +
          '1002' +
          '200.00' +
          'www.example.com' +
          '1234567' +
          '2022-01-15 20:12:40',
        'utf8',
      )
      .digest('hex');

    expect(SignatureV1.generate(params, secretKey)).toBe(expected);
  });

  it('test vector 2: params with VERSION and SADAD_WEBCHECKOUT_PAGE_LANGUAGE', () => {
    const params = {
      CALLBACK_URL: 'https://www.dsmtechbd.com/callback',
      EMAIL: 'mohib@dsmtechbd.com',
      MOBILE_NO: '77778888',
      ORDER_ID: '1002',
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: 'ENG',
      TXN_AMOUNT: '200.00',
      VERSION: '1.1',
      WEBSITE: 'www.dsmtechbd.com',
      merchant_id: '7015085',
      txnDate: '2024-08-25 10:50:40',
    };
    const secretKey = 'LjJ36Oc6hNhh8I3L';

    const expected = createHash('sha256')
      .update(
        'LjJ36Oc6hNhh8I3L' +
          'https://www.dsmtechbd.com/callback' +
          'mohib@dsmtechbd.com' +
          '77778888' +
          '1002' +
          'ENG' +
          '200.00' +
          '1.1' +
          'www.dsmtechbd.com' +
          '7015085' +
          '2024-08-25 10:50:40',
        'utf8',
      )
      .digest('hex');

    expect(SignatureV1.generate(params, secretKey)).toBe(expected);
  });

  // --- Algorithm correctness ---

  it('sort is case-sensitive with uppercase before lowercase (ASCII order)', () => {
    // SORT_STRING: uppercase letters come before lowercase in ASCII order
    // 'ALPHA' (0x41) < 'beta' (0x62) < 'zebra' (0x7A)
    const params = {
      zebra: 'z',
      ALPHA: 'a',
      beta: 'b',
    };

    const expected = createHash('sha256').update('secret' + 'a' + 'b' + 'z', 'utf8').digest('hex');
    expect(SignatureV1.generate(params, 'secret')).toBe(expected);
  });

  it('returns a 64-character lowercase hex string', () => {
    const signature = SignatureV1.generate({ ORDER_ID: '1001' }, 'mykey');
    expect(signature).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(signature)).toBe(true);
  });

  // --- Excluded fields ---

  it('excludes productdetail field', () => {
    const with_ = {
      ORDER_ID: '1001',
      TXN_AMOUNT: '100.00',
      productdetail: [{ order_id: '1001', amount: '100.00', quantity: '1' }],
    };
    const without = {
      ORDER_ID: '1001',
      TXN_AMOUNT: '100.00',
    };

    expect(SignatureV1.generate(with_ as never, 'secret')).toBe(
      SignatureV1.generate(without, 'secret'),
    );
  });

  it('excludes signature field', () => {
    const with_ = { ORDER_ID: '1001', signature: 'old_sig_value' };
    const without = { ORDER_ID: '1001' };

    expect(SignatureV1.generate(with_, 'secret')).toBe(SignatureV1.generate(without, 'secret'));
  });

  it('excludes checksumhash field', () => {
    const with_ = { ORDER_ID: '1001', checksumhash: 'some_old_hash' };
    const without = { ORDER_ID: '1001' };

    expect(SignatureV1.generate(with_, 'secret')).toBe(SignatureV1.generate(without, 'secret'));
  });

  it('exclusion is case-insensitive', () => {
    const with_ = {
      ORDER_ID: '1001',
      SIGNATURE: 'X',
      CHECKSUMHASH: 'Y',
      PRODUCTDETAIL: 'Z',
    };
    const without = { ORDER_ID: '1001' };

    expect(SignatureV1.generate(with_, 'secret')).toBe(SignatureV1.generate(without, 'secret'));
  });

  // --- Optional parameters at their alphabetical position ---

  it('includes VERSION at its alphabetical position', () => {
    const params = {
      ORDER_ID: '1001',
      TXN_AMOUNT: '100.00',
      VERSION: '1.1',
    };

    // Sorted: ORDER_ID < TXN_AMOUNT < VERSION
    const expected = createHash('sha256')
      .update('secret' + '1001' + '100.00' + '1.1', 'utf8')
      .digest('hex');
    expect(SignatureV1.generate(params, 'secret')).toBe(expected);
  });

  it('includes SADAD_WEBCHECKOUT_PAGE_LANGUAGE at its alphabetical position', () => {
    const params = {
      ORDER_ID: '1001',
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: 'ENG',
      TXN_AMOUNT: '100.00',
    };

    // Sorted: ORDER_ID < SADAD_WEBCHECKOUT_PAGE_LANGUAGE < TXN_AMOUNT
    const expected = createHash('sha256')
      .update('secret' + '1001' + 'ENG' + '100.00', 'utf8')
      .digest('hex');
    expect(SignatureV1.generate(params, 'secret')).toBe(expected);
  });

  // --- Stability / determinism ---

  it('same input always produces same hash', () => {
    const params = { ORDER_ID: '999', AMOUNT: '50.00' };
    const secretKey = 'mySecretKey';

    expect(SignatureV1.generate(params, secretKey)).toBe(
      SignatureV1.generate(params, secretKey),
    );
  });

  it('different secret keys produce different hashes', () => {
    const params = { ORDER_ID: '999', AMOUNT: '50.00' };

    expect(SignatureV1.generate(params, 'keyA')).not.toBe(
      SignatureV1.generate(params, 'keyB'),
    );
  });

  it('different param values produce different hashes', () => {
    const params1 = { ORDER_ID: '1001' };
    const params2 = { ORDER_ID: '1002' };

    expect(SignatureV1.generate(params1, 'secret')).not.toBe(
      SignatureV1.generate(params2, 'secret'),
    );
  });
});
