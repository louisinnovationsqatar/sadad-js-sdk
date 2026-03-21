// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { SadadError } from '../errors/SadadError.js';

export interface HttpClient {
  /**
   * Send a POST request and return the decoded JSON response.
   */
  post(
    url: string,
    data?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<Record<string, unknown>>;

  /**
   * Send a GET request and return the decoded JSON response.
   */
  get(
    url: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<Record<string, unknown>>;
}

export class FetchHttpClient implements HttpClient {
  private static readonly DEFAULT_TIMEOUT = 30_000;

  async post(
    url: string,
    data: Record<string, unknown> = {},
    headers: Record<string, string> = {},
  ): Promise<Record<string, unknown>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        FetchHttpClient.DEFAULT_TIMEOUT,
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};

      if (!response.ok) {
        throw new SadadError(
          `HTTP POST request failed with status ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status,
        );
      }

      return json;
    } catch (err) {
      if (err instanceof SadadError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new SadadError(`HTTP POST request failed: ${msg}`, 'HTTP_ERROR');
    }
  }

  async get(
    url: string,
    params: Record<string, unknown> = {},
    headers: Record<string, string> = {},
  ): Promise<Record<string, unknown>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        FetchHttpClient.DEFAULT_TIMEOUT,
      );

      const queryString = Object.keys(params).length
        ? '?' + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params).map(([k, v]) => [k, String(v)]),
            ),
          ).toString()
        : '';

      const response = await fetch(url + queryString, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};

      if (!response.ok) {
        throw new SadadError(
          `HTTP GET request failed with status ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status,
        );
      }

      return json;
    } catch (err) {
      if (err instanceof SadadError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new SadadError(`HTTP GET request failed: ${msg}`, 'HTTP_ERROR');
    }
  }
}
