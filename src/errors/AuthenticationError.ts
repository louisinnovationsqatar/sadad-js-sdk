// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadError } from './SadadError.js';

export class AuthenticationError extends SadadError {
  constructor(
    message: string = 'Authentication failed',
    httpStatus: number | null = null,
    cause?: Error,
  ) {
    super(message, 'AUTH_FAILED', httpStatus, cause);
    this.name = 'AuthenticationError';
  }
}
