/**
 * Small shared helpers for the Demands & Offers feature (lane L4).
 * Kept framework-light so both list + detail components can reuse them.
 */
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/**
 * Extract a human-readable message from an HTTP error.
 * The kept `ErrorInterceptor` rethrows `err.error.message`; fall back to the
 * generic Error message, then a static string (all static UI copy is English).
 */
export function extractErrorMessage(err: unknown): string {
  const e = err as
    | { error?: { message?: string }; message?: string; statusText?: string }
    | null
    | undefined;
  return e?.error?.message || e?.message || e?.statusText || 'Request failed. Please try again.';
}

/**
 * `NgbDateStruct` → `yyyy-MM-dd` (the `dateDepotFrom` / `dateDepotTo` format
 * documented on the admin search endpoints). Returns undefined when empty.
 */
export function ngbDateToParam(date: NgbDateStruct | null | undefined): string | undefined {
  if (!date || !date.year || !date.month || !date.day) {
    return undefined;
  }
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}
