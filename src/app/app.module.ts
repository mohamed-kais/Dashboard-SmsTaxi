import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

import { environment } from '../environments/environment';

import { NgbNavModule, NgbAccordionModule, NgbTooltipModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ExtrapagesModule } from './extrapages/extrapages.module';

import { LayoutsModule } from './layouts/layouts.module';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initFirebaseBackend } from './authUtils';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { ErrorInterceptor } from './core/helpers/error.interceptor';
import { JwtInterceptor } from './core/helpers/jwt.interceptor';
import { FakeBackendInterceptor } from './core/helpers/fake-backend';
import { ApiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';

if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  // tslint:disable-next-line: no-unused-expression
  FakeBackendInterceptor;
}

@NgModule({ declarations: [
        AppComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        LayoutsModule,
        SharedModule,
        AppRoutingModule,
        ExtrapagesModule, // eager scope for Page404Component (root `**` route); the /pages URLs still lazy-load ExtrapagesModule
        NgbAccordionModule,
        NgbNavModule,
        NgbTooltipModule,
        NgbModule], providers: [
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
    ] })
export class AppModule { }
