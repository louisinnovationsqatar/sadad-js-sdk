# @louis-innovations/sadad-js-sdk

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js: 18+](https://img.shields.io/badge/Node.js-18%2B-blue.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%2B-blue.svg)](https://www.typescriptlang.org/)

SADAD Payment Gateway SDK for Node.js and TypeScript. Zero runtime dependencies — uses the Node.js built-in `crypto` module.

## Features

- Three checkout modes: Web Redirect (v1.1), Enhanced Redirect (v2.1), Embedded/iFrame (v2.2)
- Invoice management: create, share via SMS or email, list
- Full refunds with eligibility validation
- Webhook handling with signature verification
- Payment callback handling (v1.1, v2.1, v2.2)
- SHA-256 and AES-128-CBC signature generation and verification
- Transaction lookup
- Zero runtime dependencies

## Requirements

- Node.js 18 or higher (for native `fetch` and `crypto`)
- TypeScript 5.x (for TypeScript users)

## Installation

```bash
npm install @louis-innovations/sadad-js-sdk
```

## Quick Start

```typescript
import { SadadClient, SadadConfig } from '@louis-innovations/sadad-js-sdk';

const config = new SadadConfig({
  merchantId:  '1234567',       // 7-digit SADAD merchant ID
  secretKey:   'your-secret-key',
  website:     'www.your-domain.com',
  environment: 'test',          // 'test' or 'live'
  language:    'eng',           // 'eng' or 'arb'
  callbackUrl: 'https://www.your-domain.com/payment/callback',
  webhookUrl:  'https://www.your-domain.com/payment/webhook',
});

const client = new SadadClient(config);

// Create a checkout
const result = client.checkout({
  order_id: 'ORD-001',
  amount:   150.00,
  mobile:   '97412345678',
  email:    'customer@example.com',
  items: [
    { order_id: 'ORD-001', amount: 150.00, quantity: 1 },
  ],
});

// Generate an auto-submitting HTML form
const html = result.toHtmlForm();
```

## Configuration

All configuration is passed to `SadadConfig` as an options object.

| Option        | Type              | Required | Description                                              |
|---------------|-------------------|----------|----------------------------------------------------------|
| `merchantId`  | `string`          | Yes      | Your 7-digit SADAD merchant ID                           |
| `secretKey`   | `string`          | Yes      | Your SADAD secret key                                    |
| `website`     | `string`          | Yes      | Your website domain (e.g. `www.your-domain.com`)         |
| `environment` | `'test' \| 'live'`| No       | Defaults to `'test'`                                     |
| `language`    | `'eng' \| 'arb'`  | No       | Defaults to `'eng'`                                      |
| `callbackUrl` | `string \| null`  | No       | URL SADAD redirects the customer to after payment        |
| `webhookUrl`  | `string \| null`  | No       | URL SADAD posts payment notifications to                 |

## Checkout Modes

### v1.1 — Standard Web Redirect

The customer is redirected to the SADAD payment page. A SHA-256 signature is generated from the order parameters.

```typescript
const result = client.checkout(orderData, 'v1.1');
// Redirect: result.url + '?' + new URLSearchParams(result.params).toString()
// Or render the form:
const html = result.toHtmlForm();
```

### v2.1 — Enhanced Web Redirect

Same redirect flow as v1.1 but uses an AES-128-CBC encrypted checksum for improved security.

```typescript
const result = client.checkout(orderData, 'v2.1');
const html = result.toHtmlForm(); // Auto-submitting HTML form
```

### v2.2 — Embedded / iFrame Checkout

Renders an embedded payment widget on your page. Uses the same AES-128-CBC checksum as v2.1 but posts to a separate secure endpoint.

```typescript
const result = client.checkout(orderData, 'v2.2');
const html = result.toHtmlForm('sadad-frame', false); // Form only, no auto-submit
```

### Order data structure

```typescript
const orderData = {
  order_id:     'ORD-001',
  amount:       150.00,
  mobile:       '97412345678',
  email:        'customer@example.com',
  callback_url: 'https://...',      // Optional: overrides config callbackUrl
  items: [
    {
      order_id: 'ORD-001',
      amount:   150.00,
      quantity: 1,
    },
  ],
};
```

## Webhooks

1. Register your webhook URL in the [SADAD merchant panel](https://panel.sadad.qa).
2. In your webhook endpoint, pass the parsed JSON body to the handler:

```typescript
import { SadadClient } from '@louis-innovations/sadad-js-sdk';

// Express example
app.post('/payment/webhook', (req, res) => {
  try {
    const result = client.handleWebhook(req.body);

    if (result.isSuccess) {
      // Payment confirmed — fulfil the order
      // result.transactionNumber, result.orderNumber, result.amount
    }

    res.status(200).json(SadadClient.webhookSuccessResponse());
  } catch (err) {
    res.status(400).json({ error: 'Invalid webhook' });
  }
});
```

`WebhookResult` properties:

| Property            | Type           | Description                                        |
|---------------------|----------------|----------------------------------------------------|
| `isSuccess`         | `boolean`      | `true` when `transactionStatus === 3`              |
| `transactionNumber` | `string`       | SADAD transaction reference                        |
| `orderNumber`       | `string`       | Your original order ID                             |
| `amount`            | `number`       | Transaction amount                                 |
| `merchantId`        | `string`       | Merchant ID echoed back by SADAD                   |
| `message`           | `string`       | Human-readable status message                      |
| `isTestMode`        | `boolean`      | Whether the transaction was processed in test mode |
| `invoiceNumber`     | `string \| null` | Invoice number if applicable                     |

## Payment Callback

Handle the customer redirect back to your site after payment:

```typescript
// v1.1 callback
const result = client.handleCallback(req.body, 'v1.1');

// v2.1 or v2.2 callback
const result = client.handleCallback(req.body, 'v2.1');

if (result.isSuccess) {
  // Payment successful — update order status
}
```

`CallbackResult` properties:

| Property            | Type      | Description                        |
|---------------------|-----------|------------------------------------|
| `isSuccess`         | `boolean` | `true` when `RESPCODE === '1'`     |
| `orderNumber`       | `string`  | Your original order ID             |
| `transactionNumber` | `string`  | SADAD transaction reference        |
| `amount`            | `number`  | Transaction amount                 |
| `responseCode`      | `string`  | SADAD response code                |
| `responseMessage`   | `string`  | Human-readable response message    |
| `status`            | `string`  | Raw transaction status string      |

## Refunds

> **Important:** SADAD supports **full refunds only**. Partial refund amounts are not accepted. Refunds must be requested within **3 months** of the original transaction date.

```typescript
import { RefundError } from '@louis-innovations/sadad-js-sdk';

try {
  const result = await client.refund('TXN-123456789');

  if (result.success) {
    // Refund accepted
    console.log(result.refund_details);
  }
} catch (err) {
  if (err instanceof RefundError) {
    // err.errorCode: REFUND_NOT_FOUND | REFUND_INVALID_STATUS
    //               | REFUND_EXPIRED | REFUND_ALREADY_DONE
    console.error('Refund failed:', err.message);
  }
}
```

## Invoice Management

### Create an invoice

```typescript
const result = await client.createInvoice({
  cellnumber:     '97412345678',
  clientname:     'Ahmed Al-Farsi',
  remarks:        'Consulting services - March 2026',
  amount:         500.00,
  invoicedetails: [
    { description: 'Consulting', amount: 500.00, quantity: 1 },
  ],
});

if (result.success) {
  const invoiceNumber = result.invoice_number;
}
```

### Share an invoice

```typescript
// Via email
await client.shareInvoice(invoiceNumber, 'email', 'client@example.com');

// Via SMS
await client.shareInvoice(invoiceNumber, 'sms', '97412345678');
```

### List invoices

```typescript
const result = await client.listInvoices({
  skip:   0,
  limit:  20,
  status: 2, // 2 = Unpaid
});

const invoices = result.invoices;
```

## Transaction Lookup

```typescript
const result = await client.getTransaction('TXN-123456789');

if (result.success) {
  const transaction = result.transaction;
}
```

## Error Handling

All SDK errors extend `SadadError`.

| Error                 | When thrown                                                   |
|-----------------------|---------------------------------------------------------------|
| `SadadError`          | Base error — unexpected SDK errors                            |
| `AuthenticationError` | SADAD API login fails or returns no access token              |
| `SignatureError`      | Webhook or callback signature verification fails              |
| `RefundError`         | Refund eligibility check fails (invalid status, expired, etc) |

```typescript
import {
  SadadError,
  AuthenticationError,
  SignatureError,
  RefundError,
} from '@louis-innovations/sadad-js-sdk';

try {
  const result = client.handleWebhook(payload);
} catch (err) {
  if (err instanceof SignatureError) {
    // Webhook signature invalid — reject the request
    console.error('Expected hash:', err.expectedHash);
    console.error('Received hash:', err.receivedHash);
  } else if (err instanceof SadadError) {
    console.error('SDK error:', err.message, 'code:', err.errorCode);
  }
}
```

## Custom HTTP Client

You can inject a custom HTTP client (useful for testing or proxying):

```typescript
import { SadadClient, SadadConfig, type HttpClient } from '@louis-innovations/sadad-js-sdk';

const myHttpClient: HttpClient = {
  async post(url, data, headers) {
    // your implementation
  },
  async get(url, params, headers) {
    // your implementation
  },
};

const client = new SadadClient(config, myHttpClient);
```

## Testing

```bash
# Run the full test suite
npm test

# Watch mode
npm run test:watch
```

The test suite covers 103 test cases across 9 test files. All tests run against mocked HTTP clients — no real SADAD credentials are required.

## Troubleshooting

**"Merchant ID must be exactly 7 digits"**
Ensure your merchant ID is exactly 7 numeric digits (e.g. `1234567`). Do not include spaces or dashes.

**"No access token in response"**
Check that your `merchantId`, `secretKey`, and `website` exactly match the values registered at [panel.sadad.qa](https://panel.sadad.qa). Also verify your environment is set to `'test'` while testing.

**"Signature verification failed" on webhook/callback**
Confirm the `secretKey` in `SadadConfig` is identical to the key configured in the SADAD merchant panel. Also ensure the raw POST body is passed without any modification.

**"Transaction is older than 3 months and cannot be refunded"**
SADAD only allows refunds within 90 days of the original transaction date.

**"Transaction has already been refunded"**
Each transaction can only be refunded once.

## Bug Reports

Please open an issue on [GitHub Issues](https://github.com/louis-innovations/sadad-js-sdk/issues) or email [info@louis-innovations.com](mailto:info@louis-innovations.com).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

---

Built by [Louis Innovations](https://www.louis-innovations.com)
