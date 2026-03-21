// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect } from 'vitest';
import { SadadConfig, type SadadConfigOptions } from '../src/SadadConfig.js';

function validConfig(overrides: Partial<SadadConfigOptions> = {}): SadadConfig {
  const defaults: SadadConfigOptions = {
    merchantId: '1234567',
    secretKey: 'T1ds45#sGQbodf5',
    website: 'www.example.com',
  };
  return new SadadConfig({ ...defaults, ...overrides });
}

describe('SadadConfig', () => {
  // --- Valid config creation ---

  it('creates a valid config with all required fields', () => {
    const config = validConfig();
    expect(config.merchantId).toBe('1234567');
    expect(config.secretKey).toBe('T1ds45#sGQbodf5');
    expect(config.website).toBe('www.example.com');
    expect(config.environment).toBe('test');
    expect(config.language).toBe('eng');
    expect(config.callbackUrl).toBeNull();
    expect(config.webhookUrl).toBeNull();
  });

  it('creates config with all optional fields', () => {
    const config = validConfig({
      environment: 'live',
      language: 'arb',
      callbackUrl: 'https://example.com/callback',
      webhookUrl: 'https://example.com/webhook',
    });
    expect(config.environment).toBe('live');
    expect(config.language).toBe('arb');
    expect(config.callbackUrl).toBe('https://example.com/callback');
    expect(config.webhookUrl).toBe('https://example.com/webhook');
  });

  // --- Defaults ---

  it('defaults to test environment', () => {
    const config = new SadadConfig({
      merchantId: '1234567',
      secretKey: 'secret',
      website: 'www.example.com',
    });
    expect(config.environment).toBe('test');
  });

  it('defaults to eng language', () => {
    const config = new SadadConfig({
      merchantId: '1234567',
      secretKey: 'secret',
      website: 'www.example.com',
    });
    expect(config.language).toBe('eng');
  });

  // --- Merchant ID validation ---

  it('rejects merchant ID that is too short', () => {
    expect(() => validConfig({ merchantId: '123456' })).toThrow(
      'Merchant ID must be exactly 7 digits.',
    );
  });

  it('rejects merchant ID that is too long', () => {
    expect(() => validConfig({ merchantId: '12345678' })).toThrow(
      'Merchant ID must be exactly 7 digits.',
    );
  });

  it('rejects non-numeric merchant ID', () => {
    expect(() => validConfig({ merchantId: 'abc1234' })).toThrow(
      'Merchant ID must be exactly 7 digits.',
    );
  });

  it('rejects empty merchant ID', () => {
    expect(() => validConfig({ merchantId: '' })).toThrow(
      'Merchant ID must be exactly 7 digits.',
    );
  });

  // --- Secret key validation ---

  it('rejects empty secret key', () => {
    expect(() => validConfig({ secretKey: '' })).toThrow('Secret key cannot be empty.');
  });

  // --- Environment validation ---

  it('rejects invalid environment', () => {
    expect(() => validConfig({ environment: 'production' as never })).toThrow(
      'Environment must be one of:',
    );
  });

  it('accepts test environment', () => {
    const config = validConfig({ environment: 'test' });
    expect(config.environment).toBe('test');
  });

  it('accepts live environment', () => {
    const config = validConfig({ environment: 'live' });
    expect(config.environment).toBe('live');
  });

  // --- Language validation ---

  it('rejects invalid language', () => {
    expect(() => validConfig({ language: 'fr' as never })).toThrow(
      'Language must be one of:',
    );
  });

  it('accepts eng language', () => {
    const config = validConfig({ language: 'eng' });
    expect(config.language).toBe('eng');
  });

  it('accepts arb language', () => {
    const config = validConfig({ language: 'arb' });
    expect(config.language).toBe('arb');
  });

  // --- Checkout URLs ---

  it('returns correct v1.1 checkout URL', () => {
    const config = validConfig();
    expect(config.getCheckoutUrl('v1.1')).toBe('https://sadadqa.com/webpurchase');
  });

  it('returns correct v2.1 checkout URL', () => {
    const config = validConfig();
    expect(config.getCheckoutUrl('v2.1')).toBe('https://sadadqa.com/webpurchase');
  });

  it('returns correct v2.2 checkout URL', () => {
    const config = validConfig();
    expect(config.getCheckoutUrl('v2.2')).toBe('https://secure.sadadqa.com/webpurchasepage');
  });

  it('throws for unknown checkout version', () => {
    const config = validConfig();
    expect(() => config.getCheckoutUrl('v3.0')).toThrow('Unknown checkout version');
  });

  // --- API base URL ---

  it('returns the correct API base URL', () => {
    const config = validConfig();
    expect(config.getApiBaseUrl()).toBe('https://api-s.sadad.qa/api');
  });

  // --- Same URLs for test and live ---

  it('returns same checkout URLs for test and live environments', () => {
    const testConfig = validConfig({ environment: 'test' });
    const liveConfig = validConfig({ environment: 'live' });

    expect(testConfig.getCheckoutUrl('v1.1')).toBe(liveConfig.getCheckoutUrl('v1.1'));
    expect(testConfig.getCheckoutUrl('v2.1')).toBe(liveConfig.getCheckoutUrl('v2.1'));
    expect(testConfig.getCheckoutUrl('v2.2')).toBe(liveConfig.getCheckoutUrl('v2.2'));
  });

  it('returns same API base URL for test and live environments', () => {
    const testConfig = validConfig({ environment: 'test' });
    const liveConfig = validConfig({ environment: 'live' });

    expect(testConfig.getApiBaseUrl()).toBe(liveConfig.getApiBaseUrl());
  });
});
