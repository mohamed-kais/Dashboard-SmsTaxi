/**
 * SMS Log feature — shared constants/helpers (no Angular imports).
 *
 * Phone pattern: the spec documents `^[0-9+\-\s()]+$` for `SmsInDto.telephone`
 * (docs/API_REFERENCE.md §14 Injection).
 */

/** Regex for the `telephone` control of the injection form (spec's phone pattern). */
export const SMS_PHONE_PATTERN = '^[0-9+\\-\\s()]+$';

/** Max length for `SmsInDto.contenu` (spec: required, ≤1000). */
export const SMS_CONTENU_MAXLENGTH = 1000;

/**
 * Best-effort error message extraction from an HTTP failure.
 *
 * The kept ErrorInterceptor rethrows `err.error.message || err.statusText` (a
 * STRING), while raw backend bodies are `ErrorResponseDto` or — for
 * `/api/inject-sms` — `MessageResponse` ({ message }). Handle all three shapes.
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
