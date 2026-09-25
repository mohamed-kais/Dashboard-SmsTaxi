import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { initFirebaseBackend } from './authUtils';
import { errorInterceptor } from './core/helpers/error.interceptor';
import { fakeBackendInterceptor } from './core/helpers/fake-backend';
import { jwtInterceptor } from './core/helpers/jwt.interceptor';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { environment } from '../environments/environment';

if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  // tslint:disable-next-line: no-unused-expression
  fakeBackendInterceptor;
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
    provideHttpClient(withXhr(), withInterceptors([jwtInterceptor, errorInterceptor, fakeBackendInterceptor, apiBaseUrlInterceptor])),
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
