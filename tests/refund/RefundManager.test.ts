// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect, beforeEach } from 'vitest';
import { SadadConfig } from '../../src/SadadConfig.js';
import { Authenticator } from '../../src/auth/Authenticator.js';
import { TransactionManager } from '../../src/transaction/TransactionManager.js';
import { RefundManager } from '../../src/refund/RefundManager.js';
import { RefundError } from '../../src/errors/RefundError.js';
import { SadadError } from '../../src/errors/SadadError.js';
import type { HttpClient } from '../../src/http/HttpClient.js';

function makeAuthHttpClient(token: string = 'auth_token'): HttpClient {
  return {
    async post() {
      return { accessToken: token };
    },
    async get() {
      return {};
    },
  };
}

function makeTransactionManager(
  config: SadadConfig,
  transaction: Record<string, unknown> | null,
): TransactionManager {
  const txnResponse =
    transaction !== null
      ? { success: true, transaction }
      : { success: false, error: 'Not found' };

  return new (class extends TransactionManager {
    constructor() {
      super(config, makeAuthHttpClient(), new Authenticator(config, makeAuthHttpClient()));
    }
    async getTransaction(_: string) {
      return txnResponse;
    }
  })();
}

interface TrackingHttpClient extends HttpClient {
  lastPostUrl: string;
  lastPostData: Record<string, unknown>;
  lastPostHeaders: Record<string, string>;
}

function makeRefundHttpClient(
  refundResponse: Record<string, unknown>,
  shouldThrow: boolean = false,
): TrackingHttpClient {
  return {
    lastPostUrl: '',
    lastPostData: {},
    lastPostHeaders: {},
    async post(url, data = {}, headers = {}) {
      this.lastPostUrl = url;
      this.lastPostData = data;
      this.lastPostHeaders = headers as Record<string, string>;
      if (shouldThrow) {
        throw new SadadError('Refund HTTP failed', 'HTTP_ERROR');
      }
      return refundResponse;
    },
    async get() {
      return {};
    },
  };
}

function validTransaction(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const yesterday = new Date(Date.now() - 86400 * 1000).toISOString();
  return {
    transactionno: 'TXN-001',
    status: 3,
    amount: 100.0,
    txnDate: yesterday,
    isRefunded: false,
    ...overrides,
  };
}

describe('RefundManager', () => {
  let config: SadadConfig;

  beforeEach(() => {
    config = new SadadConfig({
      merchantId: '7015085',
      secretKey: 'T1ds45#sGQbodf5',
      website: 'www.example.com',
      environment: 'test',
    });
  });

  function makeManager(
    refundHttp: TrackingHttpClient,
    transaction: Record<string, unknown> | null,
    token: string = 'auth_token',
  ): RefundManager {
    const authenticator = new Authenticator(config, makeAuthHttpClient(token));
    const txnManager = makeTransactionManager(config, transaction);
    return new RefundManager(config, refundHttp, authenticator, txnManager);
  }

  // --- Success path ---

  it('returns success for an eligible transaction', async () => {
    const http = makeRefundHttpClient({ refundId: 'REF-001', status: 'refunded' });
    const manager = makeManager(http, validTransaction());
    const result = await manager.refund('TXN-001');

    expect(result['success']).toBe(true);
    expect(result).toHaveProperty('refund_details');
  });

  it('posts to the correct endpoint', async () => {
    const http = makeRefundHttpClient({ refundId: 'REF-001' });
    const manager = makeManager(http, validTransaction());
    await manager.refund('TXN-001');

    expect(http.lastPostUrl).toBe(
      'https://api-s.sadad.qa/api/transactions/refundTransaction',
    );
  });

  it('sends transactionnumber in POST body', async () => {
    const http = makeRefundHttpClient({ refundId: 'REF-001' });
    const manager = makeManager(http, validTransaction({ transactionno: 'TXN-999' }));
    await manager.refund('TXN-999');

    expect(http.lastPostData['transactionnumber']).toBe('TXN-999');
  });

  it('sends Authorization header', async () => {
    const http = makeRefundHttpClient({ refundId: 'REF-001' });
    const manager = makeManager(http, validTransaction(), 'secret_token');
    await manager.refund('TXN-001');

    expect(http.lastPostHeaders['Authorization']).toBe('Bearer secret_token');
  });

  // --- Transaction not found ---

  it('throws RefundError when transaction not found', async () => {
    const http = makeRefundHttpClient({});
    const manager = makeManager(http, null);

    await expect(manager.refund('TXN-MISSING')).rejects.toThrow(RefundError);
    await expect(manager.refund('TXN-MISSING')).rejects.toThrow('Transaction not found');
  });

  // --- Non-success status ---

  it('throws RefundError with REFUND_INVALID_STATUS for non-success status', async () => {
    const http = makeRefundHttpClient({});
    const manager = makeManager(http, validTransaction({ status: 1 }));

    try {
      await manager.refund('TXN-001');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RefundError);
      expect((err as RefundError).errorCode).toBe('REFUND_INVALID_STATUS');
    }
  });

  // --- Older than 3 months ---

  it('throws RefundError with REFUND_EXPIRED for transaction older than 3 months', async () => {
    const oldDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
    const http = makeRefundHttpClient({});
    const manager = makeManager(http, validTransaction({ txnDate: oldDate }));

    try {
      await manager.refund('TXN-001');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RefundError);
      expect((err as RefundError).errorCode).toBe('REFUND_EXPIRED');
    }
  });

  it('succeeds for transaction within 3 months', async () => {
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const http = makeRefundHttpClient({ refundId: 'REF-002' });
    const manager = makeManager(http, validTransaction({ txnDate: recentDate }));

    const result = await manager.refund('TXN-001');
    expect(result['success']).toBe(true);
  });

  // --- Already refunded ---

  it('throws RefundError with REFUND_ALREADY_DONE for already-refunded transaction', async () => {
    const http = makeRefundHttpClient({});
    const manager = makeManager(http, validTransaction({ isRefunded: true }));

    try {
      await manager.refund('TXN-001');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RefundError);
      expect((err as RefundError).errorCode).toBe('REFUND_ALREADY_DONE');
    }
  });

  // --- HTTP failure ---

  it('returns error array on HTTP failure', async () => {
    const http = makeRefundHttpClient({}, true);
    const manager = makeManager(http, validTransaction());

    const result = await manager.refund('TXN-001');
    expect(result['success']).toBe(false);
    expect(String(result['error'])).toContain('Refund HTTP failed');
  });
});
