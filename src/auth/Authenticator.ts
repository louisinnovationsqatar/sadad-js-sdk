// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadConfig } from '../SadadConfig.js';
import { HttpClient } from '../http/HttpClient.js';
import { AuthenticationError } from '../errors/AuthenticationError.js';

export class Authenticator {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    private readonly config: SadadConfig,
    private readonly httpClient: HttpClient,
  ) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken !== null && this.tokenExpiry !== null && this.tokenExpiry > now) {
      return this.accessToken;
    }
    return this.login();
  }

  async login(): Promise<string> {
    try {
      const response = await this.httpClient.post(
        this.config.getApiBaseUrl() + '/userbusinesses/login',
        {
          sadadId: parseInt(this.config.merchantId, 10),
          secretKey: this.config.secretKey,
          domain: this.config.website,
        },
      );

      const token = response['accessToken'];
      if (!token || typeof token !== 'string') {
        throw new AuthenticationError('No access token in response');
      }

      this.accessToken = token;
      this.tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour cache

      return this.accessToken;
    } catch (err) {
      if (err instanceof AuthenticationError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new AuthenticationError(`Authentication failed: ${msg}`);
    }
  }
}
