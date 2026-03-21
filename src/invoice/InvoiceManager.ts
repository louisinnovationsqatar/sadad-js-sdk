// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { HttpClient } from '../http/HttpClient.js';
import { Authenticator } from '../auth/Authenticator.js';

const SHARE_VIA_EMAIL = 3;
const SHARE_VIA_SMS = 4;
const STATUS_UNPAID = 2;
const DEFAULT_COUNTRY_CODE = 974;

export interface InvoiceDetail {
  description: string;
  amount: number;
  quantity: number;
}

export interface CreateInvoiceData {
  cellnumber: string;
  clientname: string;
  remarks: string;
  amount: number;
  invoicedetails: InvoiceDetail[];
  countryCode?: number;
  status?: number;
}

export interface InvoiceFilters {
  skip?: number;
  limit?: number;
  status?: number;
  clientname?: string;
  invoicenumber?: string;
  date?: string;
}

export class InvoiceManager {
  constructor(
    private readonly config: SadadConfig,
    private readonly httpClient: HttpClient,
    private readonly authenticator: Authenticator,
  ) {}

  /**
   * Create a new invoice.
   */
  async createInvoice(data: CreateInvoiceData): Promise<Record<string, unknown>> {
    try {
      const token = await this.authenticator.getAccessToken();

      const payload = {
        countryCode: data.countryCode ?? DEFAULT_COUNTRY_CODE,
        cellnumber: data.cellnumber.replace(/\D/g, ''),
        clientname: data.clientname,
        status: data.status ?? STATUS_UNPAID,
        remarks: data.remarks,
        amount: data.amount,
        invoicedetails: data.invoicedetails,
      };

      const response = await this.httpClient.post(
        this.config.getApiBaseUrl() + '/invoices/createInvoice',
        payload,
        { Authorization: `Bearer ${token}` },
      );

      return {
        success: true,
        invoice_number: response['invoiceNumber'] ?? response['invoice_number'] ?? null,
        invoice_id: response['invoiceId'] ?? response['invoice_id'] ?? null,
        data: response,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Share an existing invoice via email or SMS.
   *
   * @param invoiceNumber The invoice number to share.
   * @param method        'email' or 'sms'.
   * @param recipient     Email address or mobile number.
   */
  async shareInvoice(
    invoiceNumber: string,
    method: string,
    recipient: string,
  ): Promise<Record<string, unknown>> {
    try {
      const token = await this.authenticator.getAccessToken();

      const isEmail = method.toLowerCase() === 'email';

      const payload: Record<string, unknown> = {
        invoiceNumber,
        sentvia: isEmail ? SHARE_VIA_EMAIL : SHARE_VIA_SMS,
      };

      if (isEmail) {
        payload['receiverEmail'] = recipient;
      } else {
        payload['receivercellno'] = recipient.replace(/\D/g, '');
      }

      const response = await this.httpClient.post(
        this.config.getApiBaseUrl() + '/invoices/share',
        payload,
        { Authorization: `Bearer ${token}` },
      );

      return {
        success: true,
        message: response['message'] ?? 'Invoice shared successfully.',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * List invoices with optional filters.
   */
  async listInvoices(filters: InvoiceFilters = {}): Promise<Record<string, unknown>> {
    try {
      const token = await this.authenticator.getAccessToken();

      const params: Record<string, unknown> = {};
      const supported: (keyof InvoiceFilters)[] = [
        'skip',
        'limit',
        'status',
        'clientname',
        'invoicenumber',
        'date',
      ];

      for (const key of supported) {
        if (filters[key] !== undefined) {
          params[`filter[${key}]`] = filters[key];
        }
      }

      const response = await this.httpClient.get(
        this.config.getApiBaseUrl() + '/invoices/listInvoices',
        params,
        { Authorization: `Bearer ${token}` },
      );

      return {
        success: true,
        invoices: response['invoices'] ?? response['data'] ?? response,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
