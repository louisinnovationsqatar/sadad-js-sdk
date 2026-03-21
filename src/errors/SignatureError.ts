// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadError } from './SadadError.js';

export class SignatureError extends SadadError {
  readonly expectedHash: string;
  readonly receivedHash: string;

  constructor(
    expectedHash: string,
    receivedHash: string,
    message: string = 'Signature verification failed',
  ) {
    super(message, 'SIGNATURE_MISMATCH');
    this.name = 'SignatureError';
    this.expectedHash = expectedHash;
    this.receivedHash = receivedHash;
  }
}
