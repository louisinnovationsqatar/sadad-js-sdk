// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

export class WebhookResult {
  constructor(
    readonly isSuccess: boolean,
    readonly message: string,
    readonly transactionNumber: string,
    readonly orderNumber: string,
    readonly amount: number,
    readonly merchantId: string,
    readonly isTestMode: boolean,
    readonly invoiceNumber: string | null,
  ) {}
}
