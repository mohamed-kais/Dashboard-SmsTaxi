import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Prefixes backend-relative API paths with `environment.apiBaseUrl`
 * (plan §1.3: registered LAST in the chain — Jwt → Error → FakeBackend → ApiBaseUrl).
 *
 * - Absolute URLs (`http://` / `https://`) pass through unchanged.
 * - `/api/*` and `/taxi-client/api/*` get the base URL prepended.
 * - Everything else (e.g. `/users/*` handled by FakeBackendInterceptor) passes through.
 */
@Injectable()
export class ApiBaseUrlInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const url = request.url;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return next.handle(request);
    }

    if (url.startsWith('/api/') || url.startsWith('/taxi-client/api/')) {
      return next.handle(
        request.clone({ url: environment.apiBaseUrl + url })
      );
    }

    return next.handle(request);
  }
}
