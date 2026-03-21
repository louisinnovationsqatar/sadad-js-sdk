// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

export class CallbackResult {
  constructor(
    readonly isSuccess: boolean,
    readonly orderNumber: string,
    readonly transactionNumber: string,
    readonly amount: number,
    readonly responseCode: string,
    readonly responseMessage: string,
    readonly status: string,
  ) {}
}
