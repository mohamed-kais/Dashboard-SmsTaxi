import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { initFirebaseBackend } from './authUtils';
import { ErrorInterceptor } from './core/helpers/error.interceptor';
import { FakeBackendInterceptor } from './core/helpers/fake-backend';
import { JwtInterceptor } from './core/helpers/jwt.interceptor';
import { ApiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { environment } from '../environments/environment';

if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  // tslint:disable-next-line: no-unused-expression
  FakeBackendInterceptor;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideAnimations(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    // Interceptor chain order (plan §1.3) — do not reorder:
    // Jwt -> Error -> FakeBackend -> ApiBaseUrl.
    // ApiBaseUrl runs LAST so the fake auth backend still intercepts `/api/login`
    // and `/users/*`; ApiBaseUrl then prefixes any remaining request whose path
    // starts with `/api/` or `/taxi-client/api/` with `environment.apiBaseUrl`.
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ApiBaseUrlInterceptor, multi: true },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    // ngx-translate v18: root provider + HTTP loader with failOnError (P0-1: 404 on a
    // translation file must fail loudly rather than serve partial translations).
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
        failOnError: true,
      }),
    }),
  ],
};
