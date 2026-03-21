// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from './SadadConfig.js';
import { Authenticator } from './auth/Authenticator.js';
import { CheckoutResult } from './checkout/CheckoutResult.js';
import { WebCheckoutV1, type OrderData } from './checkout/WebCheckoutV1.js';
import { WebCheckoutV2 } from './checkout/WebCheckoutV2.js';
import { WebCheckoutEmbedded } from './checkout/WebCheckoutEmbedded.js';
import { CallbackHandler } from './callback/CallbackHandler.js';
import { CallbackResult } from './callback/CallbackResult.js';
import { HttpClient, FetchHttpClient } from './http/HttpClient.js';
import { InvoiceManager, type CreateInvoiceData, type InvoiceFilters } from './invoice/InvoiceManager.js';
import { RefundManager } from './refund/RefundManager.js';
import { TransactionManager } from './transaction/TransactionManager.js';
import { WebhookHandler } from './webhook/WebhookHandler.js';
import { WebhookResult } from './webhook/WebhookResult.js';

export class SadadClient {
  private readonly config: SadadConfig;
  private readonly httpClient: HttpClient;
  private readonly authenticator: Authenticator;
  private readonly invoiceManager: InvoiceManager;
  private readonly refundManager: RefundManager;
  private readonly transactionManager: TransactionManager;
  private readonly webhookHandler: WebhookHandler;
  private readonly callbackHandler: CallbackHandler;

  constructor(config: SadadConfig, httpClient?: HttpClient) {
    this.config = config;
    this.httpClient = httpClient ?? new FetchHttpClient();
    this.authenticator = new Authenticator(config, this.httpClient);
    this.transactionManager = new TransactionManager(config, this.httpClient, this.authenticator);
    this.invoiceManager = new InvoiceManager(config, this.httpClient, this.authenticator);
    this.refundManager = new RefundManager(
      config,
      this.httpClient,
      this.authenticator,
      this.transactionManager,
    );
    this.webhookHandler = new WebhookHandler(config);
    this.callbackHandler = new CallbackHandler(config);
  }

  checkout(orderData: OrderData, version: string = 'v1.1'): CheckoutResult {
    switch (version) {
      case 'v1.1':
        return new WebCheckoutV1(this.config).createCheckout(orderData);
      case 'v2.1':
        return new WebCheckoutV2(this.config).createCheckout(orderData);
      case 'v2.2':
        return new WebCheckoutEmbedded(this.config).createCheckout(orderData);
      default:
        throw new Error(`Invalid checkout version: ${version}`);
    }
  }

  handleWebhook(payload: Record<string, unknown>): WebhookResult {
    return this.webhookHandler.handle(payload);
  }

  handleCallback(postData: Record<string, unknown>, version: string = 'v1.1'): CallbackResult {
    return this.callbackHandler.handle(postData, version);
  }

  async createInvoice(data: CreateInvoiceData): Promise<Record<string, unknown>> {
    return this.invoiceManager.createInvoice(data);
  }

  async shareInvoice(
    invoiceNumber: string,
    method: string,
    recipient: string,
  ): Promise<Record<string, unknown>> {
    return this.invoiceManager.shareInvoice(invoiceNumber, method, recipient);
  }

  async listInvoices(filters: InvoiceFilters = {}): Promise<Record<string, unknown>> {
    return this.invoiceManager.listInvoices(filters);
  }

  async refund(transactionNumber: string): Promise<Record<string, unknown>> {
    return this.refundManager.refund(transactionNumber);
  }

  async getTransaction(transactionNumber: string): Promise<Record<string, unknown>> {
    return this.transactionManager.getTransaction(transactionNumber);
  }

  static webhookSuccessResponse(): { status: string } {
    return WebhookHandler.successResponse();
  }
}
