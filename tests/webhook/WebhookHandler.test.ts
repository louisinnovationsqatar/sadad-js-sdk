// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect, beforeEach } from 'vitest';
import { SadadConfig } from '../../src/SadadConfig.js';
import { SignatureV1 } from '../../src/signature/SignatureV1.js';
import { SignatureError } from '../../src/errors/SignatureError.js';
import { WebhookHandler } from '../../src/webhook/WebhookHandler.js';
import { WebhookResult } from '../../src/webhook/WebhookResult.js';

function buildValidPayload(
  payload: Record<string, unknown>,
  secretKey: string,
): Record<string, unknown> {
  const hash = SignatureV1.generate(payload, secretKey);
  return { ...payload, checksumhash: hash };
}

describe('WebhookHandler', () => {
  let config: SadadConfig;

  beforeEach(() => {
    config = new SadadConfig({
      merchantId: '7015085',
      secretKey: 'T1ds45#sGQbodf5',
      website: 'www.example.com',
      environment: 'test',
    });
  });

  function defaultPayload() {
    return {
      merchant_id: '7015085',
      ORDER_ID: 'ORD-WH-001',
      TXN_AMOUNT: '150.00',
      transactionStatus: 3,
      transaction_number: 'TXN-ABC-9876',
      message: 'Transaction successful',
      isTestMode: true,
    };
  }

  // --- Valid payload ---

  it('valid webhook returns a WebhookResult instance', () => {
    const payload = buildValidPayload(defaultPayload(), config.secretKey);
    const handler = new WebhookHandler(config);
    const result = handler.handle(payload);

    expect(result).toBeInstanceOf(WebhookResult);
  });

  it('valid webhook parses all fields correctly', () => {
    const payload = buildValidPayload(defaultPayload(), config.secretKey);
    const result = new WebhookHandler(config).handle(payload);

    expect(result.isSuccess).toBe(true);
    expect(result.message).toBe('Transaction successful');
    expect(result.transactionNumber).toBe('TXN-ABC-9876');
    expect(result.orderNumber).toBe('ORD-WH-001');
    expect(result.amount).toBe(150.0);
    expect(result.merchantId).toBe('7015085');
    expect(result.isTestMode).toBe(true);
    expect(result.invoiceNumber).toBeNull();
  });

  // --- isSuccess logic ---

  it('transactionStatus 3 means isSuccess = true', () => {
    const payload = buildValidPayload(
      { ...defaultPayload(), transactionStatus: 3 },
      config.secretKey,
    );
    expect(new WebhookHandler(config).handle(payload).isSuccess).toBe(true);
  });

  it.each([0, 1, 2, 4, 99])(
    'transactionStatus %d means isSuccess = false',
    (status) => {
      const payload = buildValidPayload(
        { ...defaultPayload(), transactionStatus: status },
        config.secretKey,
      );
      expect(new WebhookHandler(config).handle(payload).isSuccess).toBe(false);
    },
  );

  // --- Optional invoiceNumber ---

  it('parses invoiceNumber when present', () => {
    const payload = buildValidPayload(
      { ...defaultPayload(), invoiceNumber: 'INV-2024-001' },
      config.secretKey,
    );
    const result = new WebhookHandler(config).handle(payload);
    expect(result.invoiceNumber).toBe('INV-2024-001');
  });

  it('invoiceNumber is null when absent', () => {
    const payload = buildValidPayload(defaultPayload(), config.secretKey);
    const result = new WebhookHandler(config).handle(payload);
    expect(result.invoiceNumber).toBeNull();
  });

  // --- Tampered payload ---

  it('throws SignatureError when amount is tampered', () => {
    const payload = buildValidPayload(defaultPayload(), config.secretKey);
    payload['TXN_AMOUNT'] = '9999.99';

    expect(() => new WebhookHandler(config).handle(payload)).toThrow(SignatureError);
  });

  it('throws SignatureError when checksumhash is replaced', () => {
    const payload = buildValidPayload(defaultPayload(), config.secretKey);
    payload['checksumhash'] = 'a'.repeat(64);

    expect(() => new WebhookHandler(config).handle(payload)).toThrow(SignatureError);
  });

  it('throws SignatureError when checksumhash is missing', () => {
    const payload = defaultPayload() as Record<string, unknown>;

    expect(() => new WebhookHandler(config).handle(payload)).toThrow(SignatureError);
  });

  // --- successResponse ---

  it('successResponse returns { status: "success" }', () => {
    const response = WebhookHandler.successResponse();
    expect(response).toEqual({ status: 'success' });
  });

  it('successResponse has exactly one key', () => {
    const response = WebhookHandler.successResponse();
    expect(Object.keys(response)).toHaveLength(1);
  });
});
