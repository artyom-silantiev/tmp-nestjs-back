export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}

export interface PaginationOptions {
  defaultSortBy?: string;
}

export class Grid {
  page: number;
  pageSize: number;
  sortBy: string | null;
  sortType: 'asc' | 'desc';

  skip: number;
  take: number;

  constructor(params: PaginationParams, options?: PaginationOptions) {
    options = options || {};
    options.defaultSortBy = options.defaultSortBy || 'id';

    this.page = params.page || 1;
    this.pageSize = params.pageSize || 20;
    this.sortBy = params.sortBy || null;
    this.sortType = params.sortType || 'asc';

    if (!this.sortBy && options.defaultSortBy) {
      this.sortBy = options.defaultSortBy;
    }

    this.skip = this.pageSize * (this.page - 1);
    this.take = this.pageSize;
  }

  toWrapedResultRows(rowsResult: any, totalRows: number) {
    return {
      page: this.page,
      pageSize: this.pageSize,
      rows: rowsResult,
      totalRows: totalRows,
      sortBy: this.sortBy,
      sortType: this.sortType,
    };
  }
}

export function useGrid(params: PaginationParams, options?: PaginationOptions) {
  const parsedPagination = new Grid(params, options);
  return parsedPagination;
}
