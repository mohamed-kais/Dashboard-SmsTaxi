/**
 * SOS feature — small shared helpers (no Angular imports).
 */

/**
 * Best-effort error message extraction from an HTTP failure.
 * The kept ErrorInterceptor rethrows `err.error.message || err.statusText`
 * (a string); the SOS endpoint's error bodies are plain strings per spec
 * ("Taxi not found"). Handle string + object shapes.
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
