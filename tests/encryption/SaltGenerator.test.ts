// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { describe, it, expect } from 'vitest';
import { SaltGenerator } from '../../src/encryption/SaltGenerator.js';

const CHARSET = 'AbcDE123IJKLMN67QRSTUVWXYZaBCdefghijklmn123opq45rs67tuv89wxyz0FGH45OP89';

describe('SaltGenerator', () => {
  it('generates a string of default length 4', () => {
    const salt = SaltGenerator.generate();
    expect(salt).toHaveLength(4);
  });

  it('generates a string of specified length', () => {
    expect(SaltGenerator.generate(1)).toHaveLength(1);
    expect(SaltGenerator.generate(8)).toHaveLength(8);
    expect(SaltGenerator.generate(16)).toHaveLength(16);
  });

  it('only contains characters from the defined charset', () => {
    for (let i = 0; i < 100; i++) {
      const salt = SaltGenerator.generate(4);
      for (const char of salt) {
        expect(CHARSET.includes(char)).toBe(true);
      }
    }
  });

  it('generates different values on repeated calls (probabilistic)', () => {
    const salts = new Set<string>();
    for (let i = 0; i < 20; i++) {
      salts.add(SaltGenerator.generate(4));
    }
    // With 71^4 possible combinations it's astronomically unlikely to get 1 unique value
    expect(salts.size).toBeGreaterThan(1);
  });

  it('generates zero-length string when length is 0', () => {
    const salt = SaltGenerator.generate(0);
    expect(salt).toBe('');
  });
});
