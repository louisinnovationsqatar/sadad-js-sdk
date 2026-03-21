// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { createHash } from 'node:crypto';
import { AESEncryptor } from '../encryption/AESEncryptor.js';
import { SaltGenerator } from '../encryption/SaltGenerator.js';

export class SignatureV2 {
  /**
   * Generate an AES-128-CBC encrypted checksum for SADAD v2 checkout.
   *
   * Algorithm:
   *   1. Build data object: { postData, secretKey }
   *   2. JSON.stringify(data)
   *   3. Generate 4-char salt via SaltGenerator.generate(4)
   *   4. Concatenate: jsonString + '|' + salt
   *   5. sha256(concatenated) -> 64-char hex string
   *   6. Append salt: hash + salt  (68 chars total)
   *   7. AES-128-CBC encrypt with key = secretKey + merchantId (truncated to 16 bytes)
   *   8. Return base64-encoded encrypted string
   */
  static generate(
    postData: Record<string, unknown>,
    secretKey: string,
    merchantId: string,
  ): string {
    const checksumData = {
      postData,
      secretKey,
    };

    const jsonString = JSON.stringify(checksumData);
    const salt = SaltGenerator.generate(4);
    const finalString = jsonString + '|' + salt;
    const hash = createHash('sha256').update(finalString, 'utf8').digest('hex');
    const hashString = hash + salt;

    const key = secretKey + merchantId;
    return AESEncryptor.encrypt(hashString, key);
  }
}
