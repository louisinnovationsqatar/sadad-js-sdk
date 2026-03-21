// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { HttpClient } from '../http/HttpClient.js';
import { Authenticator } from '../auth/Authenticator.js';
import { TransactionManager } from '../transaction/TransactionManager.js';
import { RefundError } from '../errors/RefundError.js';

const STATUS_SUCCESS = 3;
const MAX_REFUND_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

export class RefundManager {
  constructor(
    private readonly config: SadadConfig,
    private readonly httpClient: HttpClient,
    private readonly authenticator: Authenticator,
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Issue a full refund for the given transaction.
   *
   * SADAD supports full refunds only; no amount parameter is accepted.
   *
   * @throws RefundError When the transaction cannot be refunded.
   */
  async refund(transactionNumber: string): Promise<Record<string, unknown>> {
    // 1. Fetch transaction details.
    const txnResult = await this.transactionManager.getTransaction(transactionNumber);

    if (!txnResult['success'] || !txnResult['transaction']) {
      throw new RefundError(
        `Transaction not found: ${transactionNumber}`,
        'REFUND_NOT_FOUND',
      );
    }

    const transaction = txnResult['transaction'] as Record<string, unknown>;

    // 2a. Must be status 3 (Success).
    const status = Number(transaction['status'] ?? 0);
    if (status !== STATUS_SUCCESS) {
      throw new RefundError(
        'Transaction status is not eligible for refund.',
        'REFUND_INVALID_STATUS',
      );
    }

    // 2b. Must be within 3 months.
    const txnDate = transaction['txnDate'] ?? transaction['createdAt'];
    if (txnDate !== null && txnDate !== undefined) {
      const txnTimestamp =
        typeof txnDate === 'number'
          ? txnDate * 1000
          : new Date(String(txnDate)).getTime();

      if (!isNaN(txnTimestamp) && Date.now() - txnTimestamp > MAX_REFUND_AGE_MS) {
        throw new RefundError(
          'Transaction is older than 3 months and cannot be refunded.',
          'REFUND_EXPIRED',
        );
      }
    }

    // 2c. Must not already be refunded.
    const alreadyRefunded = Boolean(
      transaction['isRefunded'] ?? transaction['refunded'] ?? false,
    );
    if (alreadyRefunded) {
      throw new RefundError(
        'Transaction has already been refunded.',
        'REFUND_ALREADY_DONE',
      );
    }

    // 3. Post refund request.
    try {
      const token = await this.authenticator.getAccessToken();

      const response = await this.httpClient.post(
        this.config.getApiBaseUrl() + '/transactions/refundTransaction',
        { transactionnumber: transactionNumber },
        { Authorization: `Bearer ${token}` },
      );

      return {
        success: true,
        refund_details: response,
      };
    } catch (err) {
      if (err instanceof RefundError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
