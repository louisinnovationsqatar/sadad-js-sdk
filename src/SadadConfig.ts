// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

const CHECKOUT_URLS: Record<string, string> = {
  'v1.1': 'https://sadadqa.com/webpurchase',
  'v2.1': 'https://sadadqa.com/webpurchase',
  'v2.2': 'https://secure.sadadqa.com/webpurchasepage',
};

const API_BASE_URL = 'https://api-s.sadad.qa/api';

const VALID_ENVIRONMENTS = ['test', 'live'] as const;
const VALID_LANGUAGES = ['eng', 'arb'] as const;

export type Environment = (typeof VALID_ENVIRONMENTS)[number];
export type Language = (typeof VALID_LANGUAGES)[number];

export interface SadadConfigOptions {
  merchantId: string;
  secretKey: string;
  website: string;
  environment?: Environment;
  language?: Language;
  callbackUrl?: string | null;
  webhookUrl?: string | null;
}

export class SadadConfig {
  readonly merchantId: string;
  readonly secretKey: string;
  readonly website: string;
  readonly environment: Environment;
  readonly language: Language;
  readonly callbackUrl: string | null;
  readonly webhookUrl: string | null;

  constructor(options: SadadConfigOptions) {
    this.merchantId = options.merchantId;
    this.secretKey = options.secretKey;
    this.website = options.website;
    this.environment = options.environment ?? 'test';
    this.language = options.language ?? 'eng';
    this.callbackUrl = options.callbackUrl ?? null;
    this.webhookUrl = options.webhookUrl ?? null;

    this.validate();
  }

  private validate(): void {
    if (!/^\d{7}$/.test(this.merchantId)) {
      throw new Error('Merchant ID must be exactly 7 digits.');
    }

    if (this.secretKey === '') {
      throw new Error('Secret key cannot be empty.');
    }

    if (!(VALID_ENVIRONMENTS as readonly string[]).includes(this.environment)) {
      throw new Error(
        `Environment must be one of: ${VALID_ENVIRONMENTS.join(', ')}. Got: "${this.environment}".`,
      );
    }

    if (!(VALID_LANGUAGES as readonly string[]).includes(this.language)) {
      throw new Error(
        `Language must be one of: ${VALID_LANGUAGES.join(', ')}. Got: "${this.language}".`,
      );
    }
  }

  getCheckoutUrl(version: string): string {
    if (!(version in CHECKOUT_URLS)) {
      throw new Error(
        `Unknown checkout version "${version}". Supported versions: ${Object.keys(CHECKOUT_URLS).join(', ')}.`,
      );
    }
    return CHECKOUT_URLS[version];
  }

  getApiBaseUrl(): string {
    return API_BASE_URL;
  }
}
