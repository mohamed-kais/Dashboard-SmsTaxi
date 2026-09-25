// This file is required by karma.conf.js and initializes the Angular testing environment.
// The Angular CLI karma builder auto-discovers and bundles all *.spec.ts files,
// so no require.context() call is needed here (and it is unavailable under the
// webpack version bundled with modern @angular-devkit/build-angular).

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    // destroyAfterEach (Angular's modern default) prevents cross-TestBed
    // leakage of root singletons such as ngx-owl-carousel-o's CarouselService
    // (its HashService fired against stale ActivatedRoute from a previous
    // TestBed and crashed with `Cannot read properties of undefined (reading 'pipe')`).
    teardown: { destroyAfterEach: true }
}
);
