import * as _ from 'lodash';
import * as multihash from 'multihashes';
import { StandardResult } from '@share/standard-result.class';
import { useBs58 } from '@share/rlib/bs58';

const minBs58Prefix = 'NLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51';
const maxBs58Prefix = 'fZy5bvk7a3DQAjCbGNtmrPXWkyVvPrdnZMyBZ5q5ieKG';

const bs58 = useBs58();

class _IpfsRanges {
  private makeUnique(str) {
    return _.uniq(str).join('');
  }

  private generatePrefixses(prefix: string, maxPrefix: string, prfs: string[]) {
    const maxHexInt = 15; // f = 15
    let toDown = null;
    let charsToUp = 1;
    let prefZeros = 0;
    let tempPrefixInt;
    let maxPrefixInt;

    function prfsPush(prfs, prefix) {
      for (let i = 0; i < prefZeros; i++) {
        prefix = '0' + prefix;
      }
      prfs.push(prefix);
      return prfs;
    }

    if (prefix.length === maxPrefix.length) {
      while (prefix[0] === '0' && maxPrefix[0] === '0') {
        prefix = prefix.substr(1, prefix.length);
        maxPrefix = maxPrefix.substr(1, maxPrefix.length);
        prefZeros++;
      }

      for (let i = 0; i < prefix.length; i++) {
        if (prefix[i] === maxPrefix[i]) {
          charsToUp++;
        } else {
          break;
        }
      }

      let tempPrefix = prefix;
      while (tempPrefix.length < maxPrefix.length) {
        tempPrefix = tempPrefix + '0';
      }
      tempPrefixInt = parseInt(tempPrefix, 16);
      maxPrefixInt = parseInt(maxPrefix, 16);
      if (tempPrefixInt < maxPrefixInt) {
        toDown = true;
      } else {
        toDown = false;
      }
    } else {
      toDown = false;
    }

    function prfsGen(prefix) {
      if (prefix === maxPrefix || prefix.length > maxPrefix.length) {
        return prfsPush(prfs, maxPrefix);
      }

      if (prefix === '0') {
        const charMax = maxPrefix[0];

        if (prefix === charMax) {
          return prfsGen('00');
        } else {
          prfsPush(prfs, prefix);

          const charInt = parseInt(prefix, 16);
          const charMaxInt = parseInt(charMax, 16);

          for (let i = charInt + 1; i < charMaxInt; i++) {
            prfsPush(prfs, i.toString(16));
          }

          prefix = charMaxInt.toString(16) + '0';
          return prfsGen(prefix);
        }
      }

      const len = prefix.length;

      const prefPrefix = prefix.substr(0, len - 1);
      const char = prefix[len - 1];
      const charInt = parseInt(char, 16);

      const charMax = maxPrefix[len - 1];
      const charMaxInt = parseInt(charMax, 16);

      if (toDown) {
        prfsPush(prfs, prefix);
        for (let i = charInt + 1; i <= maxHexInt; i++) {
          const tmpPref = prefPrefix + i.toString(16);

          if (tmpPref === maxPrefix) {
            return prfsPush(prfs, tmpPref);
          }

          prefix = prefPrefix + i.toString(16);
          prfsPush(prfs, prefix);
        }

        while (prefix[prefix.length - 1] === 'f') {
          prefix = prefix.substr(0, prefix.length - 1);
        }

        const char = prefix[prefix.length - 1];
        let nextPrefix =
          prefix.substr(0, prefix.length - 1) +
          (parseInt(char, 16) + 1).toString(16);

        if (this.makeUnique(nextPrefix) === '') {
          nextPrefix = 'f';
        }

        if (
          this.makeUnique(nextPrefix) === 'f' &&
          this.makeUnique(maxPrefix) === 'f'
        ) {
          return prfsPush(prfs, nextPrefix);
        }

        if (
          nextPrefix.length === charsToUp ||
          nextPrefix === maxPrefix.substr(0, nextPrefix.length)
        ) {
          toDown = false;
        }

        while (
          nextPrefix === maxPrefix.substr(0, nextPrefix.length) &&
          maxPrefix.length > nextPrefix.length
        ) {
          nextPrefix = nextPrefix + '0';
        }

        return prfsGen(nextPrefix);
      } else {
        prfsPush(prfs, prefix);
        for (let i = charInt + 1; i < charMaxInt; i++) {
          prfsPush(prfs, prefPrefix + i.toString(16));
        }
        const nextPrefix = prefPrefix + charMaxInt.toString(16) + '0';

        if (
          this.makeUnique(nextPrefix) === 'f0' &&
          this.makeUnique(maxPrefix) === 'f'
        ) {
          let endPrefix = '';
          for (let i = 0; i < nextPrefix.length - 1; i++) {
            endPrefix += 'f';
          }
          return prfsPush(prfs, endPrefix);
        }

        return prfsGen(nextPrefix);
      }
    }

    return prfsGen(prefix);
  }

  private bs58RangeToHexPrefixses(
    index: number,
    bs58Range: string[],
    hexChars: number,
  ) {
    const fullBs58Len = 44;

    let minBs58 = bs58Range[0];
    let maxBs58 = bs58Range[bs58Range.length - 1];

    function getNextMinSumbol(minBs58) {
      const len = minBs58.length;
      const minPref = minBs58Prefix.substr(0, len);
      if (minBs58 === minPref) {
        return minBs58Prefix[len];
      } else {
        return '1';
      }
    }

    function getNextMaxSumbol(maxBs58) {
      const len = maxBs58.length;
      const maxPref = maxBs58Prefix.substr(0, len);
      if (maxBs58 === maxPref) {
        return maxBs58Prefix[len];
      } else {
        return 'z';
      }
    }

    while (minBs58.length < fullBs58Len) {
      minBs58 = minBs58 + getNextMinSumbol(minBs58);
    }
    minBs58 = 'Qm' + minBs58;

    while (maxBs58.length < fullBs58Len) {
      maxBs58 = maxBs58 + getNextMaxSumbol(maxBs58);
    }
    maxBs58 = 'Qm' + maxBs58;

    const minBs58Buf = multihash.fromB58String(minBs58);
    let minHex = Buffer.from(minBs58Buf.slice(2, minBs58Buf.length)).toString(
      'hex',
    );
    const maxBs58Buf = multihash.fromB58String(maxBs58);
    let maxHex = Buffer.from(maxBs58Buf.slice(2, maxBs58Buf.length)).toString(
      'hex',
    );

    minHex = minHex.substr(0, hexChars);
    maxHex = maxHex.substr(0, hexChars);

    if (index > 0) {
      let minInt = parseInt(minHex, 16);
      minInt++;
      minHex = minInt.toString(16);
      while (minHex.length < hexChars) {
        minHex = '0' + minHex;
      }
    }

    let inputMinHex = minHex;
    if (index === 0) {
      inputMinHex = '0';
    }

    const allHexPrefixses = this.generatePrefixses(inputMinHex, maxHex, []);

    /*
    if (index < 10) {
      console.log('start generatePrefixses', inputMinHex, maxHex);
      console.log('bs58 range:', bs58Range.join('|'));
      console.log('min hex:', minHex);
      console.log('max hex:', maxHex);
      console.log('hex prefix\'s:', allHexPrefixses.join('|'));
      console.log(' ');
    }
    */

    return allHexPrefixses.join('|');
  }

  private generateBs58AndHexRanges(
    bs58Size: number,
    hexChars: number,
    nodesCount: number,
  ) {
    const stdRes = new StandardResult<{
      bs58Regexs: string[];
      hexsRegexs: string[];
    }>();

    const codes = [];
    const maxBs58Code = maxBs58Prefix.substr(0, bs58Size);
    let currentCode = null;
    while (true) {
      if (!currentCode) {
        currentCode = minBs58Prefix.substr(0, bs58Size);
      } else {
        const intCode = bs58.toInt(currentCode);
        currentCode = bs58.fromInt(intCode + 1);
      }

      codes.push(currentCode);

      if (currentCode === maxBs58Code) {
        break;
      }
    }

    const nodeCodesCount = [];
    const sum = codes.length;
    const perNodeFloor = Math.floor(sum / nodesCount);
    for (let i = 0; i < nodesCount; i++) {
      nodeCodesCount.push(perNodeFloor);
    }
    let residue = sum - perNodeFloor * nodesCount;
    let index = 0;
    while (residue > 0) {
      nodeCodesCount[index] += 1;
      residue -= 1;
      index++;
      if (index >= nodesCount) {
        index = 0;
      }
    }

    const bs58Ranges = [] as string[][];
    for (const count of nodeCodesCount) {
      const bs58Range = [];
      const arr = codes.splice(0, count);
      for (const item of arr) {
        bs58Range.push(item);
      }
      bs58Ranges.push(bs58Range);
    }

    const bs58Regexs = [] as string[];
    const hexsRegexs = [] as string[];

    for (let index = 0; index < bs58Ranges.length; index++) {
      const bs58Range = bs58Ranges[index];
      bs58Regexs.push('(' + bs58Range.join('|') + ')');
      hexsRegexs.push(
        '(' + this.bs58RangeToHexPrefixses(index, bs58Range, hexChars) + ')',
      );
    }

    return stdRes.setData({
      bs58Regexs,
      hexsRegexs,
    });
  }

  generateRanges(bs58Size: number, hexChars: number, nodesCount: number) {
    const stdRes = new StandardResult<{
      processTime: number;
      bs58Regexs: string[];
      hexsRegexs: string[];
    }>();

    const startTime = Date.now();

    let bs58Regexs;
    let hexsRegexs;

    const rangesRes = this.generateBs58AndHexRanges(
      bs58Size,
      hexChars,
      nodesCount,
    );

    if (rangesRes.isGood) {
      bs58Regexs = rangesRes.data.bs58Regexs;
      hexsRegexs = rangesRes.data.hexsRegexs;
    }
    stdRes.setData({
      processTime: Date.now() - startTime,
      bs58Regexs,
      hexsRegexs,
    });

    return stdRes;
  }
}

export const IpfsRanges = new _IpfsRanges();
