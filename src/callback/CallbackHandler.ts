// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { SignatureVerifier } from '../signature/SignatureVerifier.js';
import { CallbackResult } from './CallbackResult.js';

export class CallbackHandler {
  constructor(private readonly config: SadadConfig) {}

  /**
   * Process a SADAD payment callback (redirect back to merchant site).
   *
   * Supported versions:
   *   - 'v1.1'  - SHA-256 signature via SignatureVerifier.verifyV1Callback()
   *   - 'v2.1'  - AES-128-CBC checksumhash via SignatureVerifier.verifyV2Callback()
   *   - 'v2.2'  - Same as v2.1 (same verification algorithm)
   *
   * Field mapping (SADAD POST fields -> CallbackResult properties):
   *   ORDERID            -> orderNumber
   *   transaction_number -> transactionNumber
   *   TXNAMOUNT          -> amount
   *   RESPCODE           -> responseCode
   *   RESPMSG            -> responseMessage
   *   STATUS             -> status
   *
   * isSuccess = RESPCODE === '1' || RESPCODE === 1
   *
   * @throws SignatureError       When signature verification fails.
   * @throws Error                When an unsupported version is passed.
   */
  handle(postData: Record<string, unknown>, version: string = 'v1.1'): CallbackResult {
    switch (version) {
      case 'v1.1':
        SignatureVerifier.verifyV1Callback(postData, this.config.secretKey);
        break;
      case 'v2.1':
      case 'v2.2':
        SignatureVerifier.verifyV2Callback(
          postData,
          this.config.secretKey,
          this.config.merchantId,
        );
        break;
      default:
        throw new Error(
          `Unsupported callback version "${version}". Supported: v1.1, v2.1, v2.2.`,
        );
    }

    const respCode = postData['RESPCODE'] ?? '';
    const isSuccess = respCode === '1' || respCode === 1;

    return new CallbackResult(
      isSuccess,
      String(postData['ORDERID'] ?? ''),
      String(postData['transaction_number'] ?? ''),
      Number(postData['TXNAMOUNT'] ?? 0),
      String(respCode),
      String(postData['RESPMSG'] ?? ''),
      String(postData['STATUS'] ?? ''),
    );
  }
}
