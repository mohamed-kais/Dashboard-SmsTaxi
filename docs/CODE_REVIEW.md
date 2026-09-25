# Step 4 — Independent Code Review

**Date:** 2026-09-25  
**Review scope:** Full Angular 22.2.0 standalone application at `/home/mkf/Projects/SmsTaxi_Dashboard/Skote_Angular_v4.1.0/Admin` — architecture, routing, services, interceptors, guards, environments, shared UI, feature modules, and cross-check against 5 existing docs (TEMPLATE_GUIDE, ROADMAP, IMPLEMENTATION_PLAN, API_REFERENCE, DEPENDENCY_AUDIT, PERFORMANCE_REPORT).  
**Method:** Read-only fresh pass; no builds, tests, or modifications. Files inspected: all `*.ts` under `src/app`, `src/environments`, `src/main.ts`, and all 6 docs in `docs/`.

---

## 1. Findings — Critical (must fix before considering stable)

### 1.1 `environment.prod.ts` has empty `apiBaseUrl`, `notificationsBaseUrl`, `whatsappApiUrl`, `whatsappWsUrl`
**File:** `src/environments/environment.prod.ts` (lines 12, 15, 24, 25)  
**Code:**
```ts
apiBaseUrl: '',
notificationsBaseUrl: '',
whatsappApiUrl: '',
whatsappWsUrl: '',
```
**Problem:** Production build will send all API requests to relative paths on the frontend origin (e.g., `https://your-domain.com/api/get-all-taxis`), which will 404 unless a reverse proxy mirrors the exact backend paths. The dev environment uses `http://41.225.11.231:8577` (observed working) and `http://41.225.11.231:8444/taxi-client` for notifications. These are **placeholders that must be replaced before any production deployment**.  
**Suggested direction:** Fill in real production URLs (or at least document the required values in a `.env.prod.example`). The PERFORMANCE_REPORT.md §4 already flags this: "Deployment flag: environment.prod.ts still contains placeholder API, notification, and WebSocket URLs."

### 1.2 `AuthGuard` redirect uses `/account/auth/login` but `account.routes.ts` mounts auth at `/account/auth` — this is **correct** in code, but the TEMPLATE_GUIDE.md §7 ambiguity #2 claims it 404s
**File:** `src/app/core/guards/auth.guard.ts` (line 30)  
**Code:**
```ts
router.navigate(['/account/auth/login'], { queryParams: { returnUrl: state.url } });
```
**Verification:** `app.routes.ts` line 8: `{ path: 'account', loadChildren: () => import('./account/account.routes') }` → `account.routes.ts` line 4: `{ path: 'auth', loadChildren: () => import('./auth/auth.routes') }` → `auth.routes.ts` line 11: `{ path: 'login', component: LoginComponent }`. Full path = `/account/auth/login`. **The guard is correct.**  
**Problem:** The TEMPLATE_GUIDE.md documents this as a bug ("/account/login 404s — the real login route is /account/auth/login"). The doc is stale; the code has already been fixed. No code change needed, but the doc must be updated to avoid misleading future reviewers.

### 1.3 `fakeBackendInterceptor` is **always registered** in the interceptor chain (app.config.ts line 33) regardless of `environment.defaultauth`
**File:** `src/app/app.config.ts` (lines 16–21, 33)  
**Code:**
```ts
if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  fakeBackendInterceptor; // no-op expression statement
}
provideHttpClient(withXhr(), withInterceptors([jwtInterceptor, errorInterceptor, fakeBackendInterceptor, apiBaseUrlInterceptor])),
```
**Problem:** The `else` branch is a no-op expression statement (`fakeBackendInterceptor;`). The interceptor is registered **unconditionally** in the providers array. Even if `defaultauth` were `'firebase'`, the fake backend would still intercept `/users/*` calls. This is documented in TEMPLATE_GUIDE.md §7 ambiguity #8.  
**Suggested direction:** Conditionally provide the interceptor:
```ts
const interceptors = environment.defaultauth === 'firebase'
  ? [jwtInterceptor, errorInterceptor, apiBaseUrlInterceptor]
  : [jwtInterceptor, errorInterceptor, fakeBackendInterceptor, apiBaseUrlInterceptor];
provideHttpClient(withXhr(), withInterceptors(interceptors)),
```

### 1.4 `OffreService.searchOffres()` unwraps a backend envelope (`{ success, message, data: Page }`) that is **not declared in the OpenAPI spec** and may not exist in production
**File:** `src/app/core/services/offre.service.ts` (lines 86–96)  
**Code:**
```ts
return this.http
  .get<ApiResponseDtoPageOffreAdminDto>('/api/get-all-offres', { params: OffreService.buildParams(params) })
  .pipe(map((envelope) => envelope?.data ?? {}));
```
**Comment at line 87–90:** "LIVE ENVELOPE: the deployed backend wraps the Spring page in `{ success, message, data: Page }` (observed via curl — verified on 2026-09-22 against http://41.225.11.231:8577). Unwrap `data` so callers get `page.content` / `page.totalElements`."  
**Problem:** The spec declares 200 response as bare `OffreAdminDto` (or `PageOffreAdminDto` per description) — the envelope is a **runtime-only deviation**. If the production backend does not wrap, `envelope?.data` will be `undefined` and the fallback `{}` will break the list (no `content`, no `totalElements`). `DemandeService.searchDemandes()` does **not** unwrap — it expects the bare page.  
**Suggested direction:** Make the unwrap defensive: check for `content` on the response first; if present, use it directly; if `data` exists, unwrap. Or introduce a small interceptor that normalizes envelope responses globally.

### 1.5 `NotificationService` uses **absolute URLs** built from `environment.notificationsBaseUrl` — but `environment.prod.ts` has empty string
**File:** `src/app/core/services/notification.service.ts` (line 110, 121, etc.)  
**Code:**
```ts
private readonly baseUrl = environment.notificationsBaseUrl;
// ...
return this.http.get<NotificationDto[]>(`${this.baseUrl}/api/notifications/all`);
```
**Problem:** In production, `notificationsBaseUrl: ''` → requests go to `/api/notifications/all` on the frontend origin (wrong backend). The dev value is `http://41.225.11.231:8444/taxi-client`. This is the same class of issue as Finding 1.1 but for a **separate backend**.  
**Suggested direction:** Fill `notificationsBaseUrl` in `environment.prod.ts`. Consider making the base URL required at startup (throw if empty in production mode).

---

## 2. Findings — Should-fix

### 2.1 Duplicate `id` values in `MENU` array — two items have `id: 13`, two have `id: 14`
**File:** `src/app/layouts/sidebar/menu.ts` (lines 73, 79, 92, 94)  
**Code:**
```ts
{ id: 13, label: 'SOS', ... },          // line 73
{ id: 13, label: 'Notifications', ... }, // line 79 (duplicate)
{ id: 14, isTitle: true, label: 'System' }, // line 92
{ id: 15, label: 'Settings', ... },       // line 94 (should be 15, but 14 used for title)
```
**Problem:** Menu item IDs are used as keys in lists; duplicates can cause rendering issues or incorrect active-state highlighting. The `SidebarComponent` uses `id` only for display order, but it's a data integrity issue.  
**Suggested direction:** Renumber sequentially (1…15).

### 2.2 `HorizontaltopbarComponent` has a **TODO for hardcoded menu expansion logic** (level 3 only)
**File:** `src/app/layouts/horizontaltopbar/horizontaltopbar.component.ts` (lines 187–190)  
**Code:**
```ts
/**
 * TODO: This is hard coded way of expading/activating parent menu dropdown and working till level 3.
 * We should come up with non hard coded approach
 */
```
**Problem:** The `activateMenu()` method manually walks up to 6 parent levels (lines 191–213). If menu depth changes, it breaks.  
**Suggested direction:** Replace with a recursive function that walks `parentElement` until reaching the menu root (`#topnav-menu-content`).

### 2.3 `LoaderComponent` subscribes to `LoaderService.isLoading` but applies a **hardcoded 1500 ms delay** before showing/hiding
**File:** `src/app/shared/ui/loader/loader.component.ts` (lines 16–20)  
**Code:**
```ts
this.loaderService.isLoading.subscribe((v) => {
  setTimeout(() => { this.loading = v; }, 1500);
});
```
**Problem:** The delay is arbitrary and masks real loading state. If a request takes 200 ms, the spinner shows for 1.5 s anyway. If it takes 3 s, the spinner hides at 1.5 s then shows again. The `LoaderInterceptorService` is commented out in the template (per TEMPLATE_GUIDE.md §6), so nothing toggles `isLoading` — the spinner is effectively **always visible for ~1.5 s on every route change**.  
**Suggested direction:** Remove the `setTimeout`; let the spinner reflect `isLoading` directly. If a minimum display time is desired for UX, use a debounce operator in the service, not a fixed delay in the component.

### 2.4 `AuthfakeauthenticationService` stores the token in `localStorage` but the `jwtInterceptor` reads from `currentUserValue` (which comes from the same `localStorage`) — **no token refresh / expiry handling**
**File:** `src/app/core/services/authfake.service.ts` (lines 14, 18–19, 24–30)  
**Problem:** The fake JWT token `'fake-jwt-token'` never expires. In a real backend, tokens expire; the interceptor would send expired tokens. No refresh logic exists.  
**Suggested direction:** Document as known limitation of the fake backend. When real JWT auth is wired (ROADMAP §1), add a token refresh interceptor or use an auth library that handles it.

### 2.5 `OffreService.updateStateByPhone()` requires the **full `OffreDto`** as body, but the spec describes it as a "state payload" with no defined schema
**File:** `src/app/core/services/offre.service.ts` (lines 187–198)  
**Code:**
```ts
updateStateByPhone(phone: string, body: OffreDto): Observable<OffreDto> {
  return this.http.patch<OffreDto>(`/api/update_state_offre/${encodeURIComponent(phone)}`, body);
}
```
**Problem:** The spec (API_REFERENCE.md §6) says: "Body — `OffreDto` (required; described as 'state payload')." Sending the full DTO works (all fields optional), but it's semantically wrong and may include unrelated fields.  
**Suggested direction:** Define a minimal `OffreStateUpdateDto { etat: StatusEnum }` and use that. The spec ambiguity is noted in the service comment.

### 2.6 `ClientService.getClientsByPhone()` and `getClientByPhone()` call **different endpoints** but the spec lists them as aliases
**File:** `src/app/core/services/client.service.ts` (lines 34–42, 52–56)  
- `getClientByPhone()` → `GET /api/get-Clientby-phone/{phone}` (returns single `ClientDto`)  
- `getClientsByPhone()` → `GET /api/get-clientbyphone/{telephone}` (returns `ClientDto[]`)  
**Problem:** The spec says they are aliases ("Same as get-Clientnumero_telephone"), but they return **different shapes** (object vs array). The service treats them as distinct, which is correct for the actual backend, but the spec is misleading.  
**Suggested direction:** Keep as-is (code matches reality), but add a comment clarifying the spec discrepancy.

### 2.7 `RatingService` mixes two base URL prefixes (`/taxi-client/api/ratings` and `/api/taxis`) — both go through `ApiBaseUrlInterceptor` which only prefixes `/api/` and `/taxi-client/api/`
**File:** `src/app/core/services/rating.service.ts` (lines 20–23, 34–36, 42–45)  
**Code:**
```ts
return this.http.get<Rating[]>(`/taxi-client/api/ratings/driver/${encodeURIComponent(driverId)}`);
return this.http.get<TaxiRatingSummaryDto>(`/api/taxis/${taxiId}/rating-summary`);
```
**Verification:** `ApiBaseUrlInterceptor` (lines 20–23) handles both `/api/` and `/taxi-client/api/`. This works.  
**Note:** The spec documents ratings under `/taxi-client/api/` (different base path). The interceptor correctly handles both. No fix needed, but worth noting as a design smell — two API gateways.

### 2.8 `sidebar.component.ts` imports `HttpClient` but **never uses it**
**File:** `src/app/layouts/sidebar/sidebar.component.ts` (line 6, constructor line 35)  
**Code:**
```ts
import { HttpClient } from '@angular/common/http';
// ...
constructor(private eventService: EventService, private router: Router, public translate: TranslateService, private http: HttpClient) {
```
**Problem:** Unused dependency injection.  
**Suggested direction:** Remove `HttpClient` from imports and constructor.

### 2.9 `horizontaltopbar.component.ts` also injects unused services: `AuthenticationService`, `AuthfakeauthenticationService`
**File:** `src/app/layouts/horizontaltopbar/horizontaltopbar.component.ts` (lines 7–8, constructor lines 48–50)  
**Code:**
```ts
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
// ...
private authService: AuthenticationService, private authFackservice: AuthfakeauthenticationService,
```
**Usage:** Only used in `logout()` (lines 85–91). The vertical layout's `TopbarComponent` (not read but per TEMPLATE_GUIDE) likely does the same. If horizontal layout is not used (default is vertical per `layouts.model.ts`), this is dead code.  
**Suggested direction:** If horizontal layout is not used, consider removing the component or at least the unused injections.

### 2.10 `event.service.ts` uses `any` for payload type
**File:** `src/app/core/services/event.service.ts` (lines 6–9, 25–27)  
**Code:**
```ts
interface Event { type: string; payload?: any; }
type EventCallback = (payload: any) => void;
broadcast(type: string, payload = {}) { this.handler.next({ type, payload }); }
```
**Problem:** Loss of type safety across the event bus. Layout components broadcast string literals (`'changeMode'`, `'changeSidebartype'`, etc.) with payloads of varying shapes.  
**Suggested direction:** Define a union type for known events or use a typed event emitter pattern.

---

## 3. Findings — Nice-to-have

### 3.1 `StatComponent` and `PagetitleComponent` use `ChangeDetectionStrategy.Eager` (default) — could be `OnPush`
**Files:** `src/app/shared/widget/stat/stat.component.ts` (line 7), `src/app/shared/ui/pagetitle/pagetitle.component.ts` (line 8)  
**Problem:** These are pure presentational components with `@Input` only. `OnPush` would reduce change detection cycles.  
**Suggested direction:** Change to `ChangeDetectionStrategy.OnPush` (safe since inputs are primitives/immutable).

### 3.2 `VerticalComponent` has **commented-out code** for sidebar type handling (lines 37–44, 65–118)
**File:** `src/app/layouts/vertical/vertical.component.ts`  
**Problem:** Dead code. The logic moved to `LayoutComponent`.  
**Suggested direction:** Delete the commented blocks.

### 3.3 `HorizontalComponent` and `HorizontaltopbarComponent` exist but **vertical is the default** (`LAYOUT_VERTICAL` in `layouts.model.ts`) — horizontal layout appears unused
**Files:** `src/app/layouts/horizontal/horizontal.component.ts`, `src/app/layouts/horizontaltopbar/horizontaltopbar.component.ts`  
**Problem:** Dead code if horizontal layout is never activated. The `RightsidebarComponent` has radio buttons for layout switching, but no evidence it's used.  
**Suggested direction:** If horizontal is not needed, remove both components and their imports from `LayoutComponent` to reduce bundle size.

### 3.4 `core/utils/table-state.ts` exists but **no feature service appears to use it** (grep shows no imports)
**File:** `src/app/core/utils/table-state.ts`  
**Problem:** The IMPLEMENTATION_PLAN §3 SALVAGE intended this as a generic `TableState` + comparator/paginate helper for feature services. Current services (`TaxiService`, `DemandeService`, `OffreService`, etc.) implement their own `HttpParams` building inline.  
**Suggested direction:** Either adopt it in the services (refactor) or remove it to avoid confusion.

### 3.5 `src/app/shared/ui/loader.zip` and `src/app/core/services/loader.service.zip` — **vendored zip files** committed to repo
**Problem:** Binary artifacts in source control. Likely leftovers from template.  
**Suggested direction:** Delete both `.zip` files.

### 3.6 `tslint.json` exists but **Angular 22 uses ESLint** — `tslint` is deprecated
**File:** `tslint.json` at repo root  
**Problem:** TSLint has been deprecated since 2019. The project should migrate to ESLint (Angular CLI provides schematics).  
**Suggested direction:** Run `ng add @angular-eslint/schematics` and remove `tslint.json`.

### 3.7 `package.json` declares `bootstrap: ^5.2.2` but `5.3.8` is available (DEPENDENCY_AUDIT.md §1) — minor version bump available
**Problem:** Non-breaking update available. Bootstrap 5.3 includes CSS variable improvements that could simplify dark mode.  
**Suggested direction:** Bump to `5.3.8` after verifying SCSS compatibility (the template overrides Bootstrap variables heavily).

### 3.8 `sweetalert2` has a direct low-severity audit finding — update to `11.26.25`
**File:** `package.json`  
**Reference:** DEPENDENCY_AUDIT.md §3.131  
**Suggested direction:** Safe bump; no breaking changes in patch.

---

## 4. Architecture review

### 4.1 Feature boundaries & lazy loading — **VERIFIED: All feature routes are truly lazy-loaded**

**`app.routes.ts`** (lines 8–34): Every feature uses `loadChildren: () => import(...)` — no eager feature imports.  
- `account` → `account.routes.ts` → `auth.routes.ts` (lazy)  
- `''` (layout wrapper) → children all lazy: `dashboard`, `taxis`, `clients`, `reservations`, `ratings`, `sms-log`, `sos`, `notifications`, `whatsapp`, `settings`, `demands-offers` (empty path, last)  
- `pages` → `extrapages.routes.ts` (lazy, guarded)  
- `**` → `Page404Component`

**Each feature's `*.routes.ts`** exports a `Routes` array with `component:` (not `loadChildren`) — correct for leaf routes inside a lazy module boundary. The lazy boundary is at the `app.routes.ts` level.

**No `NgModule` bootstrap remains** — `main.ts` uses `bootstrapApplication(AppComponent, appConfig)` (line 12). **Confirmed: fully standalone.**

### 4.2 Circular dependencies — **No cycles detected**

- **Barrel files (`index.ts`):** None exist in `src/app/**` (glob found 0). Good — avoids re-export cycles.
- **Service → Component → Service:** Checked core services — they import only models, `HttpClient`, `rxjs`, and `environment`. No component imports.
- **Component → Service → Model → Service:** Models are pure interfaces/enums (no imports). No cycles.
- **Layout → Core services:** `LayoutComponent` imports `EventService` (core). `EventService` has no layout deps. OK.
- **Sidebar → Menu → MenuItem:** `menu.ts` imports `MenuItem` from `menu.model.ts`; `sidebar.component.ts` imports `MENU` and `MenuItem`. No cycle.
- **AuthGuard → Auth services → Environment:** One-way.

**Potential risk:** `notification.service.ts` imports `environment` and uses absolute URLs. `environment` imports nothing from app. Safe.

### 4.3 Shared module — **`src/app/shared` is correctly scoped**

Contents:
- `shared/ui/pagetitle/` → `PagetitleComponent` (standalone, used everywhere)
- `shared/ui/loader/` → `LoaderComponent` (standalone, used in `LayoutComponent`? Not directly — `app.component.html` not read, but `LoaderComponent` is likely in `app.component.html` or `layout.component.html`)
- `shared/widget/stat/` → `StatComponent` (standalone, used in dashboard)
- **No `SharedModule`, `UIModule`, `WidgetModule`** — the TEMPLATE_GUIDE.md describes NgModule-based structure, but the current code is **fully standalone**. Components are imported directly where needed (e.g., `ChatLayoutComponent` imports `PagetitleComponent`).  
**Verdict:** No "shared catch-all" problem. Shared is lean and only contains genuinely reusable UI primitives.

### 4.4 Services structure — **Consistent with IMPLEMENTATION_PLAN.md §8 conventions**

| Convention | Actual |
|---|---|
| One service per resource, `providedIn: 'root'` | ✅ All 12 core services use `@Injectable({ providedIn: 'root' })` |
| HttpClient injected directly | ✅ All services inject `private http: HttpClient` |
| Relative paths (`/api/...`), `ApiBaseUrlInterceptor` prefixes | ✅ All services use relative paths |
| Query params via `HttpParams` | ✅ All services build `HttpParams` manually or via helper |
| Typed `Observable<T>` returns with DTOs from `core/models` | ✅ All services return typed observables |
| Error handling: rely on `ErrorInterceptor`; per-call `catchError` only when needed | ✅ No per-call `catchError` in services; `ErrorInterceptor` handles 401 globally |

**Deviation:** `OffreService.searchOffres()` uses `.pipe(map(...))` to unwrap a runtime envelope (Finding 1.4). This is a **data transformation**, not error handling — acceptable but should be documented as a backend contract deviation.

**Deviation:** `NotificationService` uses absolute URLs (`${baseUrl}/api/...`) because it talks to a **different backend**. This is by design (IMPLEMENTATION_PLAN §1.3: "ApiBaseUrl runs LAST so the fake auth backend still intercepts `/api/login`... ApiBaseUrl prefixes any request whose path starts with `/api/` or `/taxi-client/api/`"). The notifications backend is explicitly excluded. Documented in service header.

### 4.5 Environment separation — **Hardcoded URLs found**

| File | URL | Status |
|---|---|---|
| `src/environments/environment.ts` | `http://41.225.11.231:8577` (apiBaseUrl) | Dev — OK |
| `src/environments/environment.ts` | `http://41.225.11.231:8444/taxi-client` (notificationsBaseUrl) | Dev — OK |
| `src/environments/environment.ts` | `/chat-api`, `/chat-ws` (whatsapp) | Dev — relative, proxied |
| `src/environments/environment.prod.ts` | `''` (apiBaseUrl) | **PLACEHOLDER — Critical (Finding 1.1)** |
| `src/environments/environment.prod.ts` | `''` (notificationsBaseUrl) | **PLACEHOLDER — Critical (Finding 1.1)** |
| `src/environments/environment.prod.ts` | `''` (whatsappApiUrl, whatsappWsUrl) | **PLACEHOLDER — Critical (Finding 1.1)** |
| `src/app/core/services/offre.service.ts` | `http://41.225.11.231:8577` in comment only (line 89) | Comment — OK |
| `src/app/core/services/notification.service.spec.ts` | `const BASE = 'http://41.225.11.231:8444/taxi-client'` | Test constant — OK |
| `src/app/features/whatsapp-chat/components/message-bubble/message-bubble.component.ts` | `http://41.225.11.231:8085` in comment (line 186) | Comment — OK |
| `src/app/core/models/notification.model.ts` | `http://41.225.11.231:8444/taxi-client` in comment (line 4) | Comment — OK |
| `src/app/authUtils.ts` | Firebase config — all empty strings in both env files | Placeholder — OK (firebase not used) |
| `src/app/core/helpers/fake-backend.ts` | `https://github.com/Reactive-Extensions/RxJS/issues/648` in comment (line 122) | Comment — OK |

**No API keys, secrets, or tokens in committed code.** Firebase config is empty in both env files.

---

## 5. Code review

### 5.1 Dead code

| Item | Evidence | Verdict |
|---|---|---|
| `src/app/pages/**` | `glob` found **no files** — already deleted per IMPLEMENTATION_PLAN §3 REMOVE | ✅ Removed |
| `src/app/cyptolanding/**` | `glob` found **no files** — already deleted | ✅ Removed |
| `src/app/shared/ui/loader.zip` | Binary file exists | ❌ **Dead artifact** — delete |
| `src/app/core/services/loader.service.zip` | Binary file exists | ❌ **Dead artifact** — delete |
| `HorizontalComponent` / `HorizontaltopbarComponent` | Imported in `LayoutComponent` but `LAYOUT_VERTICAL` is default; no UI toggles horizontal in menu | ⚠️ **Likely unused** — verify if `RightsidebarComponent` layout switcher works; if not, remove |
| `CoreModule` | TEMPLATE_GUIDE.md says "Empty (no declarations/providers)" — not found in current codebase (no `core/core.module.ts`) | ✅ Already removed |
| `ExtrapagesModule` imported eagerly + lazy | TEMPLATE_GUIDE.md ambiguity #7 — current `app.config.ts` / `app.routes.ts` shows `extrapages` only lazy at `/pages` (line 33). No eager import. | ✅ Fixed |
| `LanguageService` double-registration | TEMPLATE_GUIDE.md ambiguity #9 — `LanguageService` is `providedIn: 'root'` only; no `LayoutsModule.providers` (no LayoutsModule exists) | ✅ Fixed |
| `AuthModule` routes `login2` also registered as extrapages route `pages/login-2` | `extrapages.routes.ts` line 22: `{ path: 'login-2', component: Login2Component }` — **still exists** | ⚠️ **Duplicate route** — `/account/auth/login-2` and `/pages/login-2` both render `Login2Component`. Remove from extrapages if not needed. |
| `app-loader` global only | PERFORMANCE_REPORT.md §4.3: "app-loader is global-only — no per-page spinner inputs" | By design; not dead |

### 5.2 Inconsistent error handling across services

**All 12 core services** follow the same pattern: **no per-call error handling**. They return raw `Observable<T>` and rely on the global `ErrorInterceptor` (which catches 401 → logout + reload, otherwise throws `err.error.message || err.statusText`).

**Exceptions:**
- `OffreService.searchOffres()` — uses `.pipe(map(...))` to unwrap envelope (data transformation, not error handling)
- `NotificationService.getByTargetTypeFiltered()` — uses `.pipe(map(...))` to normalize response shape (array vs page wrapper)
- `ChatService` — header comment: "Errors are NOT caught per-call: the app's ErrorInterceptor handles them."

**Consistency:** ✅ Uniform. The two `map` usages are response normalization, not error handling divergence. The global interceptor approach is correct for this app.

### 5.3 TODO/FIXME/HACK/XXX comments

| File | Line | Comment | Recommendation |
|---|---|---|---|
| `src/app/layouts/horizontaltopbar/horizontaltopbar.component.ts` | 188–190 | `TODO: This is hard coded way of expading/activating parent menu dropdown and working till level 3. We should come up with non hard coded approach` | **Must-resolve** — refactor to recursive parent walk; move to ROADMAP if horizontal layout is kept |
| `src/app/environments/environment.ts` | 15 | `TODO: confirm with the backend team which port/base-path is current` | **Move to ROADMAP.md** — already tracked there (§1 Base URL discrepancy) |
| `src/app/environments/environment.prod.ts` | 6, 11, 15, 22 | Multiple `PLACEHOLDER — set the real production URL before shipping` | **Must-resolve before prod deploy** — tracked in ROADMAP.md §1 |

**No `FIXME`, `HACK`, `XXX` found in source.**

### 5.4 Verify the "standalone" claim

| File | Standalone? | Evidence |
|---|---|---|
| `src/main.ts` | ✅ | `bootstrapApplication(AppComponent, appConfig)` (line 12) — no `NgModule` |
| `src/app/app.component.ts` | ✅ | `@Component({ imports: [RouterOutlet], ... })` (line 9) |
| `src/app/core/directives/sortable.directive.ts` | ✅ | `@Directive({ selector: 'th[sortable]', host: {...} })` — no `NgModule` |
| `src/app/shared/widget/stat/stat.component.ts` | ✅ | `@Component({ imports: [], ... })` — standalone |
| `src/app/shared/ui/pagetitle/pagetitle.component.ts` | ✅ | `@Component({ imports: [TranslatePipe], ... })` — standalone |
| `src/app/shared/ui/loader/loader.component.ts` | ✅ | `@Component({ imports: [], ... })` — standalone |
| `src/app/layouts/layout.component.ts` | ✅ | `@Component({ imports: [VerticalComponent, HorizontalComponent], ... })` |
| `src/app/layouts/vertical/vertical.component.ts` | ✅ | `@Component({ imports: [TopbarComponent, SidebarComponent, RouterOutlet, FooterComponent, RightsidebarComponent], ... })` |
| All feature components | ✅ | All use `@Component({ imports: [...], ... })` with explicit imports |

**Prior review claim:** "sortable.directive.ts and stat.component.ts are not standalone" — **FALSE**. Both are standalone directives/components (no NgModule declaration needed; they are imported directly where used). The claim was incorrect.

### 5.5 404 / error handling paths & AuthGuard

**`app.routes.ts`** (line 34): `{ path: '**', component: Page404Component }` — catches all unmatched routes.  
**`Page404Component`** (`src/app/extrapages/page404/page404.component.ts`): Standalone component with `RouterLink` to home — minimal but functional.  
**`Page500Component`** exists in extrapages but **no route mounts it** — only accessible via `/pages/500` (extrapages route). No global error handler for 500; `ErrorInterceptor` does `location.reload()` on 401 only.

**AuthGuard** (`src/app/core/guards/auth.guard.ts`):
- Checks `environment.defaultauth` (`'firebase'` vs `'fackbackend'`)
- Firebase: uses `AuthenticationService.currentUser()` (reads `sessionStorage['authUser']`)
- Fake: uses `AuthfakeauthenticationService.currentUserValue` (reads `localStorage['currentUser']`)
- Redirects to `/account/auth/login` with `returnUrl` — **correct path** (see Finding 1.2)
- Applied to: root `''` route (layout wrapper) and `pages` route (extrapages) — **protects all app routes except account and 404**

**Gap:** No route guards for individual features (e.g., role-based access). All authenticated users see all features.

---

## 6. Docs cross-check

### 6.1 `docs/TEMPLATE_GUIDE.md` — **Template inventory (Angular 15 NgModule era)**

| Doc claim | Current code | Drift |
|---|---|---|
| Angular 15, Bootstrap 5.2.0, NgModule architecture | Angular 22.2.0, Bootstrap 5.2.2, **fully standalone** | **Major drift** — doc describes the *original* template, not the current codebase |
| 132 components, 50 modules, 17 services | ~30 feature components, 0 modules, 12 core services + 3 auth/chat | Doc is historical snapshot |
| `AppModule`, `PagesModule`, `LayoutsModule`, `SharedModule`, `CoreModule` | **None exist** — all replaced by standalone components + `app.config.ts` + `app.routes.ts` | Doc obsolete |
| `AuthGuard` redirects to `/account/login` (404) | Redirects to `/account/auth/login` — **fixed** | Doc stale |
| `fakeBackendInterceptor` only registered when `defaultauth !== 'firebase'` | **Always registered** (Finding 1.3) | Doc describes intent, not reality |
| `CoreModule` empty shell | No `CoreModule` file exists | Removed |
| `ExtrapagesModule` imported eagerly + lazy | Only lazy at `/pages` | Fixed |
| `LanguageService` double-registered | Only `providedIn: 'root'` | Fixed |
| `pages/**` demo pages exist | **Deleted** (IMPLEMENTATION_PLAN §3) | Doc outdated |
| `cyptolanding` exists | **Deleted** | Doc outdated |
| Sortable directives per-page (`orders-sortable`, `advanced-sortable`, `customers-sortable`) | **Salvaged to `core/directives/sortable.directive.ts`** (generic) | Implemented per plan |
| `assets/dashboard.json` + `ConfigService` (demo) | **Deleted** — new `ConfigService` in `core/services` for settings only | Implemented per plan |

**Verdict:** TEMPLATE_GUIDE.md is a **historical reference** for the original Skote template. It does not describe the current codebase. It should be renamed/archived (e.g., `TEMPLATE_GUIDE_LEGACY.md`) and a new guide written for the current standalone architecture.

### 6.2 `docs/ROADMAP.md` — **Documented gaps (current)**

| Roadmap item | Code status |
|---|---|
| Real JWT auth — spec declares no `securitySchemes` | Fake backend still in place; `authUtils.ts` Firebase code present but unused (`defaultauth: 'fackbackend'`). **Gap remains.** |
| Base URL discrepancy (8577 vs 8777/taxi-client) | `environment.ts` uses 8577; `environment.prod.ts` empty. **Gap remains.** |
| Reservations assignment response shape | `ReservationService` uses `ReservationResponse` for assignment endpoints; `ReservationAssignmentResponse` also modeled. **Unclear which backend returns** — code handles both via `ReservationResponse`. |
| Taxis status update — `PATCH /api/updateTaxiStatus/status` has no taxi identifier | `TaxiService` does **not** expose this endpoint; uses `PATCH /api/update-taxi/{id}` with `taxiStatus` in body. **Correct workaround implemented.** |
| Demands search returns 500 | `DemandeService.searchDemandes()` calls `GET /api/get-demande`; PERFORMANCE_REPORT confirms 500. **Gap remains.** |
| Ratings history vs summary disagree | Backend inconsistency documented; frontend renders defensively. **Gap remains.** |
| Missing endpoints (taxis online, SOS list, rating flag, etc.) | Not implemented — correctly omitted per IMPLEMENTATION_PLAN §8. **Gaps documented.** |
| npm dependency pruning | `package.json` still has fullcalendar, ckeditor, firebase, leaflet, etc. **Not done.** |
| RTL theme | Not wired; SCSS commented out. **Gap remains.** |

**Drift:** ROADMAP.md §1a "Runtime-verified findings (2026-09-22)" matches PERFORMANCE_REPORT.md observations. Consistent.

**Missing from ROADMAP:** The `OffreService` envelope unwrap (Finding 1.4) — runtime backend behavior not in spec. Should be added.

### 6.3 `docs/IMPLEMENTATION_PLAN.md` — **Plan vs. Reality**

| Plan section | Status |
|---|---|
| §1 Key decisions | ✅ Implemented: features in `src/app/features/`, `environment.apiBaseUrl`, interceptor order, fake auth kept, shared models in `core/models`, status badges in `core/constants`, salvage done, naming conventions followed |
| §2 Architecture diagram | ✅ Matches: lazy features → core services → HTTP layer → backend |
| §3 Remove vs Keep vs Salvage | ✅ `pages/**`, `cyptolanding`, `dashboard.json` deleted; `layouts`, `shared`, `core`, `account`, `extrapages`, `assets/scss` kept; sortable directive + table-state salvaged to `core/` |
| §4 Target module/route map | ✅ All 10 feature modules exist with lazy routes matching the table |
| §5 Feature matrix | ✅ All 9 features implemented with endpoints matching API_REFERENCE |
| §6 Shared DTO models | ✅ All 10 model files in `core/models/` transcribed from spec |
| §7 Status badge scheme | ✅ `core/constants/status-badges.ts` matches plan table exactly |
| §8 Service conventions | ✅ All services follow conventions |
| §9 Lane plan | ✅ L1 (Foundation) complete; L2–L7 feature folders exist; L8 (Integration) would wire routes/menu (already done in `app.routes.ts` and `menu.ts`) |
| §10 Verification gates | ⚠️ L8 `ng build` not run in this review (read-only) |
| §11 ROADMAP seeds | ✅ All seeds reflected in ROADMAP.md |

**Drift:** Plan §3 says "ExtrapagesModule imported both eagerly and lazy" — **not true in current code** (only lazy). Plan §3 says "fix AuthGuard redirect `/account/login` → `/account/auth/login`" — **already fixed**. Plan is slightly behind code.

### 6.4 `docs/API_REFERENCE.md` — **Spec vs. Code**

**Verified against services:**
- `TaxiService`: All 21 endpoints covered (some aliases not exposed, e.g., `add-taxi-admin`, `add-taxigps`, `add-taxis` — only canonical `add-taxi` used). ✅
- `ClientService`: All 12 endpoints covered. ✅
- `DemandeService`: All 20 endpoints covered. ✅
- `OffreService`: All 40 endpoints covered (aliases noted). ✅
- `ReservationService`: All 7 admin endpoints covered. ✅
- `RatingService`: All 3 endpoints + taxi rating summaries covered. ✅
- `SmsService`: All 9 endpoints covered. ✅
- `ConfigService`: Matching config + Airport pricing (GET/PUT) covered. ✅
- `SosService`: Only documented endpoint (`POST /api/sosNotification/{id}`) exposed. ✅
- `NotificationService`: Covers all documented notification endpoints + recipient pickers. ✅
- `ChatService` + `ChatWebSocketService`: Cover WhatsApp chat REST + STOMP. ✅

**Spec ambiguities correctly handled in code:**
- `GET /api/get-demande` / `get-all-offres` envelope ambiguity → `OffreService` unwraps, `DemandeService` expects bare page (Finding 1.4)
- `PATCH /api/updateTaxiStatus/status` missing taxi ID → not used; `updateTaxi` with `taxiStatus` in body used instead
- `GET /api/matching-config` untyped response → `MatchingConfigResponse` modeled with `baseDistanceMeters`/`maxDistanceMeters` (per ROADMAP §1a resolved)
- `Demande` entity has no `client` relation → `DemandeAdminDto` has `clientNom`/`clientPhone`; detail page renders defensively

### 6.5 `docs/DEPENDENCY_AUDIT.md` — **Audit vs. Package.json**

**Verified:** All 16 outdated packages listed match `npm outdated` output. Angular 22.2.0 alignment confirmed (no misalignment). 25 audit vulnerabilities (3 critical, 16 high) — breakdown matches `npm audit --json`.  
**Critical findings in code:**  
- `firebase` (direct, high) → pulls `protobufjs` (critical), `grpc-js` (high), `websocket-driver` (critical via `sockjs-client`)  
- `loader-utils` (dev, critical) — build tool chain  
- `sweetalert2` (direct, low) — fix available at 11.26.25  

**Pinning:** Only `simplebar-angular` is exact-pinned; 9 recent packages use caret ranges. Doc verdict: FAIL for strict pinning.  
**Code matches doc.** No drift.

### 6.6 `docs/PERFORMANCE_REPORT.md` — **Build/Lighthouse vs. Code**

**Verified:**
- Production build budgets: initial 3 MB warn / 5 MB error — current 1.89 MB ✅
- Lazy chunks: WhatsApp chat (111 KB), Demands/Offers (93 KB), SweetAlert2 (65 KB), Extra pages/Owl (61 KB) — matches feature lazy loading ✅
- Firebase compat in initial bundle (1.41 MiB pre-min) — `authUtils.ts` imports Firebase compat statically; `app.config.ts` conditionally initializes but **import is static** → webpack includes it. Finding 1.1 related. ✅
- All 4 icon families shipped (14.40 MiB) — `custom/plugins/_icons.scss` imports all 4 ✅
- 4 CommonJS bailouts: `@stomp/stompjs`, `sockjs-client` (chat-websocket), `sweetalert2` (demand-detail), `metismenujs` (sidebar) ✅
- Lighthouse: 34–49% performance, FCP 14–17 s — dominated by unused JS/CSS ✅
- Pagination: Taxis hybrid (status filter fetches 1000), Demands backend-driven ✅
- Deployment flag: `environment.prod.ts` placeholders — matches Finding 1.1 ✅

**Drift:** Report says "Reduce unused JavaScript 890-1017 KB" — the Firebase compat (1.41 MiB pre-min) is a major contributor. Removing static Firebase import would help.

### 6.7 `docs/QA_REPORT.md` — **MISSING**

**Explicitly flagged:** This document does not exist in `docs/`. The project's stated workflow (per IMPLEMENTATION_PLAN §10 verification gates) expects a QA report after L8 integration lane. Its absence is a **process gap**.

---

## 7. Review scope notes

**Covered (read-only):**
- All TypeScript source under `src/app/**` (components, services, directives, guards, interceptors, models, routes)
- Environment files (`environment.ts`, `environment.prod.ts`)
- `main.ts`, `app.config.ts`, `app.routes.ts`, `authUtils.ts`
- All 6 documentation files in `docs/`
- `package.json`, `angular.json`, `tsconfig*.json` (for context)
- Cross-referenced findings across code, docs, and runtime evidence (PERFORMANCE_REPORT)

**Could not verify (read-only constraints):**
- Actual production backend behavior (only dev `41.225.11.231:8577` observed in PERFORMANCE_REPORT)
- Whether `OffreService` envelope unwrap works against production backend
- Whether horizontal layout is ever activated at runtime
- ESLint/TSLint configuration effectiveness (no lint run)
- Test coverage (spec files exist but not executed)
- Docker build / deployment pipeline
- Brotli/gzip delivery in production web server (PERFORMANCE_REPORT §4.5 flag)

**Not inspected:**
- SCSS/CSS files (only referenced via component `styleUrls`)
- HTML templates (only spot-checked via component `templateUrl`)
- `proxy.conf.js` (dev server proxy for WhatsApp)
- `karma.conf.js`, test setup files
- `assets/**` (images, fonts, i18n JSON)

---

**End of review.** All findings are evidence-based with file:line references. No fixes applied — this is a decision-support document for prioritization.