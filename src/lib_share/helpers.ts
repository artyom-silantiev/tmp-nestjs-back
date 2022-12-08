import { random } from 'lodash';
import * as hasha from 'hasha';
import { Logger } from './logger';

export async function sleep(ms) {
  await new Promise((recolse) => {
    setTimeout(() => {
      recolse(true);
    }, ms);
  });
}

export function createDeferred<T>() {
  const deferred = {} as {
    promise: Promise<T>;
    resolve: (v: T) => any;
    reject: (error) => void;
  };
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

export function getRandomItemByWeight(
  items: {
    v: string;
    w: number;
  }[],
) {
  let totalWeight = 0;
  items.forEach((i) => (totalWeight += i.w));
  let rndNum = random(0, totalWeight);
  for (const item of items) {
    if (rndNum <= item.w) {
      return item;
    }
    rndNum -= item.w;
  }
}

export function arrayOfFlatObjectsToColumns(rows: { [key: string]: any }) {
  const columns = {} as {
    [columnName: string]: any[];
  };
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    for (const columnName of Object.keys(row)) {
      if (!columns[columnName]) {
        columns[columnName] = [];
      }
      columns[columnName][ri] = row[columnName];
    }
  }
  return columns;
}

export function arrayOfFlatObjectsToColumnsCvs(rows: { [key: string]: any }) {
  const columnsNames = [];
  const columnsIndexs = {} as {
    [columnName: string]: number;
  };
  const columnsData = [] as any[][];

  const firstRow = rows[0];
  for (const columnName of Object.keys(firstRow)) {
    if (columnsNames.indexOf(columnName) === -1) {
      const index = columnsNames.push(columnName) - 1;
      columnsIndexs[columnName] = index;
    }
  }

  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const rowArr = [];
    for (const columnVal of Object.values(row)) {
      rowArr.push(columnVal);
    }
    columnsData.push(rowArr);
  }
  return {
    columnsNames,
    columnsData,
  };
}

export function getRandomString(len?) {
  let str = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  len = len || 8;

  for (let i = 0; i < len; i++) {
    str += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return str;
}

export function getUid() {
  return Date.now().toString(36) + '.' + getRandomString();
}

export function shuffle(array: Array<any>) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export function getMimeFromPath(filePath) {
  const execSync = require('child_process').execSync;
  const mimeType = execSync(
    'file --mime-type -b "' + filePath + '"',
  ).toString();
  return mimeType.trim();
}

/*
export function durationFormat (value: number | string) {
  value = typeof value === 'string' ? parseFloat(value) : value;
  value = value * 1000;
  const days = Math.floor(value / 86400000);
  value = value % 86400000;
  const hours = Math.floor(value / 3600000);
  value = value % 3600000;
  const minutes = Math.floor(value / 60000);
  value = value % 60000;
  const seconds = Math.floor(value / 1000);

  function pnx (val: number) {
    if ((val + '').length == 1) {
      return '0' + val;
    } else {
      return val + '';
    }
  }

  const unitsFormat = (days ? days + 'd ' : '') +
    (hours ? hours + 'h ' : '') +
    (minutes ? minutes + 'm ' : '') +
    (seconds ? seconds + 's' : '') +
    (!days && !hours && !minutes && !seconds ? 0 : '');

  const timeFormat = (days ? days + ':' : '') +
    (hours ? pnx(hours) + ':' : '') +
    (minutes ? pnx(minutes) + ':' : '00:') +
    (seconds ? pnx(seconds) : '00') +
    (!days && !hours && !minutes && !seconds ? '00' : '');

  return {
    unitsFormat, timeFormat
  }
}
*/

export async function getFileSha256(filePath: string): Promise<string> {
  await sleep(200);
  return hasha.fromFile(filePath, { algorithm: 'sha256' });
}
