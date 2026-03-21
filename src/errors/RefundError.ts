// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadError } from './SadadError.js';

export class RefundError extends SadadError {
  constructor(
    message: string,
    errorCode: string = 'REFUND_ERROR',
    cause?: Error,
  ) {
    super(message, errorCode, null, cause);
    this.name = 'RefundError';
  }
}
