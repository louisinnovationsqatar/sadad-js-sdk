// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect } from 'vitest';
import { AESEncryptor } from '../../src/encryption/AESEncryptor.js';

describe('AESEncryptor', () => {
  const key = 'T1ds45#sGQbodf5';
  const input = 'Hello, SADAD!';

  it('encrypt returns a non-empty base64 string', () => {
    const result = AESEncryptor.encrypt(input, key);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(/^[A-Za-z0-9+/]+=*$/.test(result)).toBe(true);
  });

  it('decrypt returns the original plaintext', () => {
    const encrypted = AESEncryptor.encrypt(input, key);
    const decrypted = AESEncryptor.decrypt(encrypted, key);
    expect(decrypted).toBe(input);
  });

  it('roundtrip with long input', () => {
    const longInput = 'a'.repeat(256);
    const encrypted = AESEncryptor.encrypt(longInput, key);
    const decrypted = AESEncryptor.decrypt(encrypted, key);
    expect(decrypted).toBe(longInput);
  });

  it('roundtrip with 68-char hash+salt string (SADAD v2 format)', () => {
    const hashSalt = 'a'.repeat(64) + 'Ab3Z';
    const encrypted = AESEncryptor.encrypt(hashSalt, key);
    const decrypted = AESEncryptor.decrypt(encrypted, key);
    expect(decrypted).toBe(hashSalt);
    expect(decrypted.slice(0, 64)).toBe('a'.repeat(64));
    expect(decrypted.slice(64, 68)).toBe('Ab3Z');
  });

  it('different keys produce different ciphertext', () => {
    const enc1 = AESEncryptor.encrypt(input, 'key1234567890123');
    const enc2 = AESEncryptor.encrypt(input, 'key9876543210123');
    expect(enc1).not.toBe(enc2);
  });

  it('truncates key to 16 bytes', () => {
    const longKey = 'ThisIsAVeryLongKeyThatExceedsSixteenBytes';
    const shortKey = longKey.slice(0, 16);

    const enc1 = AESEncryptor.encrypt(input, longKey);
    const enc2 = AESEncryptor.encrypt(input, shortKey);
    expect(enc1).toBe(enc2);
  });

  it('same input always produces same output (deterministic IV)', () => {
    const enc1 = AESEncryptor.encrypt(input, key);
    const enc2 = AESEncryptor.encrypt(input, key);
    expect(enc1).toBe(enc2);
  });

  it('throws on invalid base64 input to decrypt', () => {
    expect(() => AESEncryptor.decrypt('not valid base64!!!###', key)).toThrow();
  });
});
