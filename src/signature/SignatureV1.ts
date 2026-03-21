// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { createHash } from 'node:crypto';

const EXCLUDED_KEYS = ['productdetail', 'signature', 'checksumhash'];

export class SignatureV1 {
  /**
   * Generate a SHA-256 signature for the given parameters.
   *
   * Algorithm (SADAD v1.1 spec):
   *   1. Remove productdetail, signature, and checksumhash (case-insensitive).
   *   2. Sort the remaining parameters by key name using case-sensitive
   *      alphabetical ordering (uppercase before lowercase, matching ASCII order).
   *   3. Construct the string: secretKey + value1 + value2 + ...
   *      (values only, in sorted-key order, no separators).
   *   4. Return sha256(string) as a lowercase hex string.
   */
  static generate(params: Record<string, unknown>, secretKey: string): string {
    // Step 1 - Remove excluded keys (case-insensitive comparison)
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (!EXCLUDED_KEYS.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }

    // Step 2 - Case-sensitive alphabetical sort (uppercase before lowercase, ASCII order)
    const sortedKeys = Object.keys(filtered).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });

    // Step 3 - Build the string to hash
    let str = secretKey;
    for (const key of sortedKeys) {
      str += String(filtered[key]);
    }

    // Step 4 - SHA-256
    return createHash('sha256').update(str, 'utf8').digest('hex');
  }
}
