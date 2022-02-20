import { random } from 'lodash';

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
