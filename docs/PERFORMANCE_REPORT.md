# STEP 3 Performance Report

**Date:** 2026-09-25
**Application:** `Skote_Angular_v4.1.0/Admin`
**Scope:** Production build output, authenticated Lighthouse runs, and taxis/demands pagination. No application source changes were made.

## 1. Build & Bundle Summary

### Production configuration

The following command completed successfully with exit code `0`:

```bash
node --max_old_space_size=8000 node_modules/@angular/cli/bin/ng.js build --configuration production
```

The production configuration in `angular.json:50-75` enables:

- `optimization: true` (`angular.json:57`)
- `buildOptimizer: true` (`angular.json:63`)
- `sourceMap: false` (`angular.json:59`); no `.map` files were emitted
- `vendorChunk: false` and `namedChunks: false` (`angular.json:60-62`)
- output hashing and extracted third-party licenses (`angular.json:58,61`)

Budgets are present in `angular.json:64-74`:

| Budget | Warning | Error |
|---|---:|---:|
| Initial bundle | 3 MB | 5 MB |
| Any component style | 6 KB | 10 KB |

The build did not exceed either budget. The initial-budget thresholds are nevertheless high relative to the current 1.89 MB initial output.

### Initial chunks

| Initial chunk | Raw size | Estimated transfer size |
|---|---:|---:|
| `main.2b16d19d527b63de.js` | 1.16 MB | 294.24 KB |
| `styles.c2cdecf6ee9e4d37.css` | 688.23 KB | 88.35 KB |
| `polyfills.2f21ec0dd2b96f7e.js` | 35.41 KB | 11.61 KB |
| `runtime.6424435e8fab81cf.js` | 3.46 KB | 1.63 KB |
| **Initial total** | **1.89 MB** | **395.83 KB** |

The largest lazy chunks were:

| Lazy chunk | Route/group | Raw size | Estimated transfer size |
|---|---|---:|---:|
| `220.14cd4accd156d496.js` | WhatsApp chat | 111.19 KB | 28.28 KB |
| `577.5786edf4b6c87842.js` | Demands/offers | 93.32 KB | 17.07 KB |
| `66.85d119817d81bf2d.js` | Notifications/shared SweetAlert2 chunk | 65.58 KB | 16.47 KB |
| `655.87a203dec0abd660.js` | Extra pages/Owl chunk | 61.80 KB | 15.42 KB |

### Total deployment and 10 largest files

- `du -sh dist/skote`: **32 MB**
- Logical file total: **32,318,618 bytes (30.82 MiB)** across **286 files**

| Rank | File | Size |
|---:|---|---:|
| 1 | `assets/images/crypto/blog/img-2.jpg` | 2.54 MiB |
| 2 | `assets/images/crypto/blog/img-3.jpg` | 1.90 MiB |
| 3 | `assets/images/users/avatar-1.jpg` | 1.45 MiB |
| 4 | `main.2b16d19d527b63de.js` | 1.11 MiB |
| 5 | `materialdesignicons-webfont.628b3372f77d6d1d.eot` | 0.96 MiB |
| 6 | `assets/fonts/materialdesignicons-webfont.eot` | 0.96 MiB |
| 7 | `materialdesignicons-webfont.1893e1ccbadf9cdc.ttf` | 0.96 MiB |
| 8 | `assets/fonts/materialdesignicons-webfont.ttf` | 0.96 MiB |
| 9 | `fa-solid-900.b11158633b43fb3a.svg` | 0.86 MiB |
| 10 | `assets/fonts/fa-solid-900.svg` | 0.86 MiB |

The deployment is dominated by copied static assets, especially images and icon fonts, rather than application JavaScript.

### Tree-shaking and dependency observations

- **Firebase compat is statically pulled into the initial bundle even though production selects the fake backend.** `src/app/authUtils.ts:1-3` imports Firebase compat app, auth, and Firestore; `src/app/app.config.ts:9,16-18` statically imports and conditionally initializes it; `src/environments/environment.prod.ts:3` selects `defaultauth: 'fackbackend'`. Webpack stats attribute approximately **1.41 MiB of pre-minification module source** from Firebase/Firestore/Auth and `idb` to the initial `main` chunk. This is currently runtime-unused under the production auth branch, but the dependency cannot simply be removed while these static imports remain.
- **All four configured icon families are global and are not tree-shaken.** `src/assets/scss/custom/plugins/_icons.scss:5-8` imports Material Design Icons, Boxicons, Font Awesome, and Dripicons. The build emitted **60 icon files totaling 14.40 MiB**, including EOT, TTF, WOFF, WOFF2, and SVG files. Many fonts exist both as hashed root assets and under `assets/fonts`, because the global CSS references them while all of `src/assets` is copied at `angular.json:29-32`. All four families therefore ship even if a page uses only a small subset.
- **No date library is bundled.** There are no `moment`, `date-fns`, or equivalent imports/dependencies. The application uses Angular `DatePipe` and built-in date handling.
- **Route-level code splitting is working for several UI dependencies.** SweetAlert2 is isolated in lazy chunk `66` (65.58 KB final asset), while Owl Carousel JavaScript is isolated in lazy chunk `655` (61.80 KB final asset). Two Owl theme stylesheets are nevertheless global at `angular.json:34-35`.
- **ng-bootstrap and RxJS are ESM/standalone-oriented.** The stats show individual RxJS ESM modules in initial and lazy chunks, and ng-bootstrap components are split across main, taxis, demands, auth, and settings chunks rather than importing the package wholesale.
- **Four CommonJS/AMD optimization-bailout warnings remain:** `@stomp/stompjs` and `sockjs-client` from `src/app/core/services/chat-websocket.service.ts:15-16`, `sweetalert2` from `src/app/features/demands-offers/demand-detail/demand-detail.component.ts:4`, and `metismenujs/dist/metismenujs` from `src/app/layouts/sidebar/sidebar.component.ts:2`. These packages can inhibit effective tree-shaking.
- The requested production run emitted **4 explicit warning records**, all the CommonJS dependency warnings above. It also logged non-warning notices for the deprecated browser builder, unsupported legacy browser targets, and the CLI-managed TypeScript target/`useDefineForClassFields` settings. A cold compile can additionally emit Dart Sass deprecation diagnostics; those are not counted in this run's four explicit warnings.

## 2. Authenticated Lighthouse Results

Lighthouse 13.5.0 was run against the production-mode Angular dev server using its default mobile/CPU/network simulation. Authentication was established by submitting the real login form with the fake-backend admin account; localStorage was not injected as a fallback. The final URLs remained authenticated.

Port `4000` was occupied by an unrelated Docker container (`cosmetics-server`, container `553336e0d617`), so the production test server and Lighthouse runs used `http://localhost:4001` without stopping that container. Lighthouse was not rerun during the final report-writing phase.

| Page | Final URL | Performance | Accessibility | Best practices | FCP | LCP | TBT |
|---|---|---:|---:|---:|---:|---:|---:|
| Dashboard | `http://localhost:4001/dashboard` | 34% | 86% | 92% | 14.1 s | 16.0 s | 300 ms |
| Taxis | `http://localhost:4001/taxis` | 49% | 82% | 92% | 14.5 s | 16.4 s | 280 ms |
| Demands | `http://localhost:4001/demands` | 45% | 82% | 92% | 14.7 s | 17.0 s | 310 ms |

The JSON reports each contained exactly two positive-savings performance opportunities:

| Page | Opportunity | Estimated savings |
|---|---|---:|
| Dashboard | Reduce unused JavaScript | 890 KB / 5,450 ms |
| Dashboard | Reduce unused CSS | 649 KB / 3,600 ms |
| Taxis | Reduce unused JavaScript | 946 KB / 5,600 ms |
| Taxis | Reduce unused CSS | 648 KB / 3,600 ms |
| Demands | Reduce unused JavaScript | 1,017 KB / 6,080 ms |
| Demands | Reduce unused CSS | 649 KB / 3,750 ms |

The largest common opportunity is initial JavaScript: Lighthouse estimates roughly 890-1,017 KB unused on the three pages. The 688 KB global stylesheet is the second major opportunity, with approximately 648-649 KB estimated unused on each page.

Common failing accessibility audits were unnamed buttons/links, color contrast, and the missing main landmark. The taxis and demands pages additionally failed the select-label audit. These failures account for the accessibility scores being 82-86%.

## 3. Pagination Findings

### Verdict

| List | Verdict |
|---|---|
| Taxis | **Hybrid.** Normal search, sorting, and paging are backend-driven. Selecting a status filter fetches up to 1,000 rows in one request, then filters and paginates client-side because the endpoint has no status parameter. |
| Demands | **Backend-driven.** Filtering, sorting, page, and size are sent to the API; only the returned page is rendered. There is no fetch-everything path. |

### Taxis evidence

- The UI page size is 10 in `src/app/features/taxis/taxis-list.component.ts:60-62`.
- Normal list requests are documented as server-paged in `src/app/features/taxis/taxis-list.component.ts:43-51`.
- The page index is converted from the component's 1-based value to the API's 0-based value, and the normal request uses the 10-row UI page size at `src/app/features/taxis/taxis-list.component.ts:235-242`.
- With a status filter, the same code requests page `0` with `FETCH_ALL_SIZE = 1000`; the ceiling is declared at `src/app/features/taxis/taxis-list.component.ts:74-78`.
- `TaxiService.searchTaxis()` adds `page`, `size`, and `sort` with `HttpParams` and calls `GET /api/get-all-taxis` at `src/app/core/services/taxi.service.ts:81-95`. The criteria variant does the same for phone/name search at `src/app/core/services/taxi.service.ts:97-118`.
- The page event triggers a new request at `src/app/features/taxis/taxis-list.component.ts:129-132`, and `NgbPagination` is bound to the current page, total, and page size at `src/app/features/taxis/taxis-list.component.html:123-135`.
- Normal responses supply `totalElements` at `src/app/features/taxis/taxis-list.component.ts:267-275`. In status-filter mode, `_pageContent` is filtered locally and totals/paging are recalculated at `src/app/features/taxis/taxis-list.component.ts:287-305`.

Observed local request:

```text
GET /api/get-all-taxis?page=0&size=10&sort=id,asc
```

### Demands evidence

- The UI page size is 10 and the default sort is `date_depot,desc` at `src/app/features/demands-offers/demands-list/demands-list.component.ts:54-58`.
- Filter/reload events are switched into `DemandeService.searchDemandes()` and the returned Spring page drives state at `src/app/features/demands-offers/demands-list/demands-list.component.ts:70-85`.
- A page event triggers a reload at `src/app/features/demands-offers/demands-list/demands-list.component.ts:112-115`.
- `buildParams()` converts the UI page to 0-based, sends `size = 10`, and includes server-side filters and sort at `src/app/features/demands-offers/demands-list/demands-list.component.ts:191-212`.
- `DemandeService.searchDemandes()` calls `GET /api/get-demande` at `src/app/core/services/demande.service.ts:59-71`; `buildParams()` serializes every defined parameter through `HttpParams` at `src/app/core/services/demande.service.ts:203-211`.
- The component reads only `page.content` and `page.totalElements` and syncs the server's 0-based `number` at `src/app/features/demands-offers/demands-list/demands-list.component.ts:215-233`.
- The template binds `collectionSize`, `pageSize`, `page`, and the page event to `NgbPagination` at `src/app/features/demands-offers/demands-list/demands-list.component.html:164-182`.

Observed local request:

```text
GET /api/get-demande?page=0&size=10&sort=date_depot,desc
```

### Local fake-backend limitation

`src/app/core/helpers/fake-backend.ts` only defines user authentication/user CRUD handlers. All unhandled requests pass through to the next interceptor at `src/app/core/helpers/fake-backend.ts:116-117`. It contains no taxi or demand page fixtures. In the local production-mode server, both list requests consequently received 404 responses and the pages displayed zero rows: the taxis paginator was disabled, and the demands paginator was hidden. Source evidence still establishes the intended backend paging contracts, but an end-to-end next-page click could not be exercised without the real API or list fixtures.

## 4. Flags and Recommendations

1. **Remove Firebase compat from the fake-backend production path.** Avoid a static `authUtils` import when `defaultauth` is not Firebase, or isolate Firebase behind a dynamically loaded provider. This is the clearest initial-bundle candidate; roughly 1.41 MiB of pre-minification Firebase-related source is currently attributed to `main` even though production selects fake auth.
2. **Stop shipping every icon family/file format and duplicate font copies.** Retain only required icon families and glyphs, prefer modern formats, and narrow the copied assets configuration. The current icon assets alone total 14.40 MiB, while all four families are in the initial 688 KB CSS.
3. **Reduce the initial JavaScript and global CSS identified by Lighthouse.** Route-split noncritical shell/layout code, remove unused Firebase code, and reduce globally injected Bootstrap/icon/Owl CSS. Lighthouse estimates 890-1,017 KB unused JavaScript and approximately 649 KB unused CSS per tested page.
4. **Address the four CommonJS optimization bailouts.** Prefer ESM-compatible imports or isolate/replace `@stomp/stompjs`, `sockjs-client`, `sweetalert2`, and `metismenujs` where practical. SweetAlert2 and Owl are already lazy, so this work should preserve their route-level isolation.
5. **Move taxi status filtering to a backend parameter when available.** The current workaround can fetch 1,000 rows and paginate them in the browser. A server-side `taxiStatus` criterion would avoid the large-page transfer and client-side slicing. Also consider tightening the current 3 MB/5 MB initial budgets and verifying Brotli/gzip delivery in the production web server.

**Deployment flag:** `src/environments/environment.prod.ts:6-24` still contains placeholder API, notification, and WebSocket URLs. Performance runs with the local fake auth are valid for the checked-in bundle, but list timing against the real backend should be repeated after those URLs are configured.

**No application source was modified, and no commit was created.**
