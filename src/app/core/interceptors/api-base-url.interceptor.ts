import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

/**
 * Prefixes backend-relative API paths with `environment.apiBaseUrl`
 * (plan §1.3: registered LAST in the chain — Jwt → Error → FakeBackend → ApiBaseUrl).
 *
 * - Absolute URLs (`http://` / `https://`) pass through unchanged.
 * - `/api/*` and `/taxi-client/api/*` get the base URL prepended.
 * - Everything else (e.g. `/users/*` handled by `fakeBackendInterceptor`) passes through.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const url = request.url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return next(request);
  }

  if (url.startsWith('/api/') || url.startsWith('/taxi-client/api/')) {
    return next(
      request.clone({ url: environment.apiBaseUrl + url })
    );
  }

  return next(request);
};
