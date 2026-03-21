// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

import { randomInt } from 'node:crypto';

const CHARSET = 'AbcDE123IJKLMN67QRSTUVWXYZaBCdefghijklmn123opq45rs67tuv89wxyz0FGH45OP89';

export class SaltGenerator {
  static generate(length: number = 4): string {
    const charsetLength = CHARSET.length;
    let salt = '';

    for (let i = 0; i < length; i++) {
      salt += CHARSET[randomInt(0, charsetLength)];
    }

    return salt;
  }
}
