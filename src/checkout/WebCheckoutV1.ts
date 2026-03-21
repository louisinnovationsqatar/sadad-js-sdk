// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { SignatureV1 } from '../signature/SignatureV1.js';
import { CheckoutResult } from './CheckoutResult.js';

export interface OrderItem {
  order_id: string;
  amount: number;
  quantity: number;
}

export interface OrderData {
  order_id: string;
  amount: number;
  mobile?: string;
  email?: string;
  items?: OrderItem[];
  callback_url?: string;
}

export class WebCheckoutV1 {
  constructor(protected readonly config: SadadConfig) {}

  /**
   * Build a CheckoutResult for the SADAD v1.1 web checkout flow.
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

    // 3. Generate signature (excludes productdetail)
    params['signature'] = SignatureV1.generate(
      params as Record<string, unknown>,
      this.config.secretKey,
    );

    // 4. Build productdetail array
    if (items.length > 0) {
      params['productdetail'] = items.map((item) => ({
        order_id: String(item.order_id),
        amount: formatAmount(item.amount),
        quantity: String(item.quantity),
      }));
    }

    return new CheckoutResult(this.config.getCheckoutUrl('v1.1'), params as never);
  }
}

export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function stripNonDigits(str: string): string {
  return str.replace(/\D/g, '');
}

export function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
