/**
 * Generic table pipeline helpers.
 *
 * Extracted from the template's `pages/ecommerce/orders` search/sort/paginate
 * pattern (plan §3 SALVAGE) so feature lanes can rebuild the per-entity
 * `BehaviorSubject` + `_search$` + `switchMap` service pipeline from pure helpers:
 *
 *   // inside a feature list service
 *   private _state: TableState<TaxiDto> = createTableState<TaxiDto>({ pageSize: 10 });
 *
 *   private _search(): void {
 *     // 1. sort    — sort(rows, sortColumn, sortDirection)
 *     // 2. filter  — rows.filter(r => matches(r.name, searchTerm))
 *     // 3. paginate — paginate(rows, page, pageSize) + startIndex/endIndex bookkeeping
 *   }
 *
 * Pure TypeScript — no Angular imports.
 */

export type SortDirection = '' | 'asc' | 'desc';

/** Mutable table view-state mirroring the template's `State` object. */
export interface TableState<T> {
  /** Current page (1-based, as in the template pattern). */
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string;
  sortDirection: SortDirection;
  /** 1-based index of the first row on the current page. */
  startIndex: number;
  /** 1-based index of the last row on the current page (clamped to totalRecords). */
  endIndex: number;
  totalRecords: number;
  /** All rows surviving search + filter (before pagination). */
  filteredRows: T[];
  /** Rows visible on the current page. */
  rows: T[];
}

/** Default state (matches the template's `orders.service.ts` defaults). */
export function createTableState<T>(patch: Partial<TableState<T>> = {}): TableState<T> {
  return {
    page: 1,
    pageSize: 8,
    searchTerm: '',
    sortColumn: '',
    sortDirection: '',
    startIndex: 0,
    endIndex: 0,
    totalRecords: 0,
    filteredRows: [],
    rows: [],
    ...patch,
  };
}

/**
 * Comparator used by the sort step: returns -1/0/1, negated when `isAsc` is false.
 * Mirrors the template's `compare(v1, v2)` + `direction === 'asc' ? res : -res` semantics,
 * with the direction folded into the signature.
 */
export function compare(
  v1: string | number | boolean | null | undefined,
  v2: string | number | boolean | null | undefined,
  isAsc: boolean
): number {
  const res = v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  return isAsc ? res : -res;
}

/** Case-insensitive `String(value).includes(term)` match (template `matches()` semantics). */
export function matches(value: unknown, term: string): boolean {
  if (!term) {
    return true;
  }
  if (value === null || value === undefined) {
    return false;
  }
  return String(value).toLowerCase().includes(term.toLowerCase());
}

/**
 * Return the rows for `page` (1-based) of `rows`, `pageSize` per page.
 * Equivalent to the template's `rows.slice((page - 1) * pageSize, page * pageSize)`;
 * naturally returns a shorter (or empty) slice near the end of the data.
 */
export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
