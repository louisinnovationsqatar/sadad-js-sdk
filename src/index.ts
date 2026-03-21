// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

// Main client and config
export { SadadClient } from './SadadClient.js';
export { SadadConfig } from './SadadConfig.js';
export type { SadadConfigOptions, Environment, Language } from './SadadConfig.js';

// Checkout
export { CheckoutResult } from './checkout/CheckoutResult.js';
export { WebCheckoutV1 } from './checkout/WebCheckoutV1.js';
export { WebCheckoutV2 } from './checkout/WebCheckoutV2.js';
export { WebCheckoutEmbedded } from './checkout/WebCheckoutEmbedded.js';
export type { OrderData, OrderItem } from './checkout/WebCheckoutV1.js';

// Webhook
export { WebhookHandler } from './webhook/WebhookHandler.js';
export { WebhookResult } from './webhook/WebhookResult.js';

// Callback
export { CallbackHandler } from './callback/CallbackHandler.js';
export { CallbackResult } from './callback/CallbackResult.js';

// Auth
export { Authenticator } from './auth/Authenticator.js';

// Invoice
export { InvoiceManager } from './invoice/InvoiceManager.js';
export type { CreateInvoiceData, InvoiceDetail, InvoiceFilters } from './invoice/InvoiceManager.js';

// Refund
export { RefundManager } from './refund/RefundManager.js';

// Transaction
export { TransactionManager } from './transaction/TransactionManager.js';

// Encryption
export { AESEncryptor } from './encryption/AESEncryptor.js';
export { SaltGenerator } from './encryption/SaltGenerator.js';

// Signature
export { SignatureV1 } from './signature/SignatureV1.js';
export { SignatureV2 } from './signature/SignatureV2.js';
export { SignatureVerifier } from './signature/SignatureVerifier.js';

// HTTP
export { FetchHttpClient } from './http/HttpClient.js';
export type { HttpClient } from './http/HttpClient.js';

// Errors
export { SadadError } from './errors/SadadError.js';
export { AuthenticationError } from './errors/AuthenticationError.js';
export { SignatureError } from './errors/SignatureError.js';
export { RefundError } from './errors/RefundError.js';
