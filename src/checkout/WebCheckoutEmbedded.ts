// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { WebCheckoutV2 } from './WebCheckoutV2.js';

/**
 * SADAD Embedded (Secure) Checkout - v2.2
 *
 * Identical to WebCheckoutV2 in all respects except that it posts to the
 * secure embedded checkout URL (v2.2) rather than the standard v2.1 URL.
 */
export class WebCheckoutEmbedded extends WebCheckoutV2 {
  protected checkoutVersion = 'v2.2';
}
