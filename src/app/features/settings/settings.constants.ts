/**
 * Settings feature — shared constants/helpers (no Angular imports).
 */
import { SurchargeType } from '../../core/models/common.model';

/**
 * Options for the airport `surchargeType` select — the spec's
 * `PERCENTAGE | FIXED_AMOUNT` union (docs/API_REFERENCE.md "Global
 * conventions" + §11 Airport Pricing Config).
 */
export const SURCHARGE_TYPES: readonly SurchargeType[] = ['PERCENTAGE', 'FIXED_AMOUNT'];

/**
 * Best-effort error message extraction from an HTTP failure.
 * The kept ErrorInterceptor rethrows `err.error.message || err.statusText`
 * (a string); backend bodies are `ErrorResponseDto`/`MessageResponse`-shaped.
 */
export function apiErrorMessage(err: unknown): string {
  if (typeof err === 'string') {
    return err;
  }
  if (err && typeof err === 'object') {
    const e = err as {
      error?: { message?: string };
      message?: string;
    };
    if (typeof e.error?.message === 'string' && e.error.message) {
      return e.error.message;
    }
    if (typeof e.message === 'string' && e.message) {
      return e.message;
    }
  }
  return '';
}
