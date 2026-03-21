# Changelog

All notable changes to `@louis-innovations/sadad-js-sdk` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-03-21

### Added

- `SadadClient` — main facade exposing all SDK functionality
- `SadadConfig` — validated configuration class with merchant ID, secret key, website, environment, language, callback URL and webhook URL
- **Checkout modes**
  - `WebCheckoutV1` — SHA-256 signature, SADAD v1.1 redirect URL
  - `WebCheckoutV2` — AES-128-CBC checksum, SADAD v2.1 redirect URL
  - `WebCheckoutEmbedded` — extends WebCheckoutV2, SADAD v2.2 embedded URL
  - `CheckoutResult` — value object with `url`, `params`, and `toHtmlForm()`
- **Encryption**
  - `AESEncryptor` — AES-128-CBC encrypt/decrypt using Node.js `crypto` module
  - `SaltGenerator` — cryptographically random 4-character salt
- **Signature**
  - `SignatureV1` — SHA-256 signature (sort alphabetically, prepend secret key)
  - `SignatureV2` — AES-encrypted checksum with random salt
  - `SignatureVerifier` — `verifyV1Callback`, `verifyWebhook`, `verifyV2Callback`
- **Webhook** — `WebhookHandler` with `handle()` and `successResponse()`; `WebhookResult` value object
- **Callback** — `CallbackHandler` supporting v1.1, v2.1, v2.2; `CallbackResult` value object
- **Authentication** — `Authenticator` with 1-hour token caching
- **Invoice management** — `InvoiceManager` with `createInvoice`, `shareInvoice` (SMS/email), `listInvoices`
- **Refunds** — `RefundManager` with eligibility validation (status, age, already-refunded checks)
- **Transactions** — `TransactionManager.getTransaction()`
- **HTTP** — `FetchHttpClient` (zero-dependency, Node 18+ `fetch`)
- **Errors** — `SadadError`, `AuthenticationError`, `SignatureError`, `RefundError`
- Zero runtime dependencies — only Node.js built-ins (`crypto`)
- Full TypeScript type declarations
- 103 tests across 9 test files using Vitest

[1.0.0]: https://github.com/louis-innovations/sadad-js-sdk/releases/tag/v1.0.0
