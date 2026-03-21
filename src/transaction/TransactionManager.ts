// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { HttpClient } from '../http/HttpClient.js';
import { Authenticator } from '../auth/Authenticator.js';

export class TransactionManager {
  constructor(
    protected readonly config: SadadConfig,
    protected readonly httpClient: HttpClient,
    protected readonly authenticator: Authenticator,
  ) {}

  /**
   * Retrieve transaction details by transaction number.
   */
  async getTransaction(transactionNumber: string): Promise<Record<string, unknown>> {
    try {
      const token = await this.authenticator.getAccessToken();

      const response = await this.httpClient.get(
        this.config.getApiBaseUrl() + '/transactions/getTransaction',
        { transactionno: transactionNumber },
        { Authorization: `Bearer ${token}` },
      );

      return {
        success: true,
        transaction: response,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
