// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { SignatureVerifier } from '../signature/SignatureVerifier.js';
import { WebhookResult } from './WebhookResult.js';

export class WebhookHandler {
  constructor(private readonly config: SadadConfig) {}

  /**
   * Process an incoming SADAD webhook payload.
   *
   * 1. Verifies the SHA-256 checksumhash via SignatureVerifier.verifyWebhook().
   * 2. Parses the payload into a WebhookResult value object.
   * 3. isSuccess is true when transactionStatus === 3.
   *
   * @throws SignatureError When signature verification fails.
   */
  handle(payload: Record<string, unknown>): WebhookResult {
    SignatureVerifier.verifyWebhook(payload, this.config.secretKey);

    const transactionStatus = Number(payload['transactionStatus'] ?? 0);
    const isSuccess = transactionStatus === 3;

    return new WebhookResult(
      isSuccess,
      String(payload['message'] ?? ''),
      String(payload['transaction_number'] ?? ''),
      String(payload['ORDER_ID'] ?? ''),
      Number(payload['TXN_AMOUNT'] ?? 0),
      String(payload['merchant_id'] ?? ''),
      Boolean(payload['isTestMode'] ?? false),
      payload['invoiceNumber'] != null ? String(payload['invoiceNumber']) : null,
    );
  }

  /**
   * Return the standard success acknowledgement object.
   *
   * SADAD expects the merchant webhook endpoint to respond with this JSON
   * payload to confirm receipt.
   */
  static successResponse(): { status: string } {
    return { status: 'success' };
  }
}
