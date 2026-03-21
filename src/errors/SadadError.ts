// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

export class SadadError extends Error {
  readonly errorCode: string;
  readonly httpStatus: number | null;

  constructor(
    message: string,
    errorCode: string = 'SADAD_ERROR',
    httpStatus: number | null = null,
    cause?: Error,
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = 'SadadError';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}
