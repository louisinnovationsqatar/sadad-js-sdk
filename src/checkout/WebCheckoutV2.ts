// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { SignatureV2 } from '../signature/SignatureV2.js';
import { CheckoutResult } from './CheckoutResult.js';
import { formatAmount, stripNonDigits, formatDate, type OrderData } from './WebCheckoutV1.js';

export class WebCheckoutV2 {
  protected checkoutVersion = 'v2.1';

  constructor(protected readonly config: SadadConfig) {}

  /**
   * Build a CheckoutResult for the SADAD v2 web checkout flow.
   */
  createCheckout(orderData: OrderData): CheckoutResult {
    const items = orderData.items ?? [];
    const callbackUrl = orderData.callback_url ?? this.config.callbackUrl ?? '';

    // 1. Build core params
    const params: Record<string, unknown> = {
      merchant_id: this.config.merchantId,
      ORDER_ID: String(orderData.order_id),
      WEBSITE: this.config.website,
      TXN_AMOUNT: formatAmount(orderData.amount),
      CALLBACK_URL: callbackUrl,
      MOBILE_NO: stripNonDigits(String(orderData.mobile ?? '')),
      EMAIL: String(orderData.email ?? ''),
      txnDate: formatDate(new Date()),
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: this.config.language.toUpperCase(),
    };

    // 2. Add VERSION for multi-product (more than 1 item)
    if (items.length > 1) {
      params['VERSION'] = '1.1';
    }

    // 3. Generate checksum via SignatureV2 (AES encrypted)
    params['checksumhash'] = SignatureV2.generate(
      params as Record<string, unknown>,
      this.config.secretKey,
      this.config.merchantId,
    );

    // 4. Build productdetail array
    if (items.length > 0) {
      params['productdetail'] = items.map((item) => ({
        order_id: String(item.order_id),
        amount: formatAmount(item.amount),
        quantity: String(item.quantity),
      }));
    }

    return new CheckoutResult(this.config.getCheckoutUrl(this.checkoutVersion), params as never);
  }
}
