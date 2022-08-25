import * as basex from 'base-x';
import * as os from 'os';

// base58 (bitcoint, IPFS) (https://en.wikipedia.org/wiki/Base58)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const bs58 = basex(ALPHABET);

class Bs58 {
  private pid: number;
  private addressInt = 0;

  constructor() {
    let mac = '';
    const networkInterfaces = os.networkInterfaces();

    this.pid = process.pid;
    for (const interface_key in networkInterfaces) {
      const networkInterface = networkInterfaces[interface_key];
      const length = networkInterface.length;
      for (let i = 0; i < length; i++) {
        if (
          networkInterface[i].mac &&
          networkInterface[i].mac != '00:00:00:00:00:00'
        ) {
          mac = networkInterface[i].mac;
          break;
        }
      }
    }

    this.addressInt = mac ? parseInt(mac.replace(/\:|\D+/gi, '')) : 0;
  }

  getRandomBs58String(length = 4) {
    let text = '';
    for (let i = 0; i < length; i++) {
      text += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return text;
  }

  intToHex(intNum) {
    let hex = intNum.toString(16);
    if (hex.length % 2 > 0) {
      hex = '0' + hex;
    }
    return hex;
  }

  fromInt(intNum) {
    const hex = this.intToHex(intNum);
    const bytes = Buffer.from(hex, 'hex');
    const res = bs58.encode(bytes);
    return res;
  }

  toInt(bs58String: string) {
    const int = bs58.decode(bs58String).toString();
    return parseInt(int, 10);
  }

  toHex(bs58String: string) {
    const int = bs58.decode(bs58String).toString();
    return parseInt(int, 16);
  }

  uid(params?: { randChars?: number; cryptoOffset?: number }) {
    params = params || {};
    const randChars = params.randChars || 4;
    const cryptoOffset = params.cryptoOffset || 0;

    const pid58 = this.fromInt(this.pid);
    const addres58 = this.fromInt(this.addressInt);
    const ts58 = this.fromInt(Date.now());
    const rnd58Chars = this.getRandomBs58String(randChars);
    const cryptoInt = (Date.now() + cryptoOffset) % 58;
    const cryptoChar = this.fromInt(cryptoInt);
    const bs58str = rnd58Chars + ts58 + pid58 + addres58;
    let res = cryptoChar;
    for (let i = 0; i < bs58str.length; i++) {
      const char = bs58str[i];
      const charIndex = ALPHABET.indexOf(char);
      res = res + ALPHABET[(charIndex + cryptoInt + i * 3) % 58];
    }
    return res;
  }
}

const _bs58 = new Bs58();

export function useBs58() {
  return _bs58;
}
