# Skote Angular Template — Reference Guide for Building SMS Taxi Admin Pages

Skote is a commercial Bootstrap 5 admin/dashboard template. The copy in this repo is
`skote-angular-vertical` **v1.0.0** (RTL package name, horizontal layout also present), running
**Angular 15.0.4** with **Bootstrap 5.2.0**. It ships dozens of demo pages built on top of a
large dependency list: **@ng-bootstrap/ng-bootstrap 14**, **ngx-translate 14**
(`assets/i18n/*.json`), **ApexCharts / ng2-charts / ngx-echarts / chart.js / chartist**,
**ng2-smart-table**, **@fullcalendar/angular**, **firebase 9** (optional auth backend),
**metismenujs** (sidebar menu), **simplebar-angular**, **sweetalert2**, **@ng-select/ng-select**,
**ckeditor**, **ngx-owl-carousel-o**, **angular-archwizard**, **ngx-ui-switch**, **ngx-cookie-service**,
and many more (see `Admin/package.json`). Most page-level code is **demo only**: business data
lives in local `data.ts` arrays, a `FakeBackendInterceptor` stands in for the auth API, and the
only real HTTP calls are for login and a static `assets/dashboard.json`.

Quick inventory (verified on disk):
- 132 `*.component.ts` (100 under `pages/`, 8 under `layouts/`, 4 under `shared/`, 12 under `extrapages/`, 6 under `account/`, 1 `cyptolanding`, 1 `app.component`)
- 50 `*.module.ts`, 17 `*.service.ts`, 223 `*.scss`

---

## 1. Quick Reference

Rows marked **(demo)** are template examples; rows marked **(infra)** are the reusable skeleton.

### Layout components (8) — all under `src/app/layouts/`

| Component | Path | Selector | Purpose |
|---|---|---|---|
| LayoutComponent | `layouts/layout.component.ts` | `app-layout` | Shell wrapper; toggles vertical/horizontal, owns theme/sidebar-width state via body attributes |
| VerticalComponent | `layouts/vertical/vertical.component.ts` | `app-vertical` | Vertical layout: sidebar + topbar + footer + rightsidebar; mobile menu toggling |
| HorizontalComponent | `layouts/horizontal/horizontal.component.ts` | `app-horizontal` | Horizontal layout shell; topbar color handling |
| SidebarComponent | `layouts/sidebar/sidebar.component.ts` | `app-sidebar` | Left nav rendered from `menu.ts` via MetisMenu; active-route highlighting |
| TopbarComponent | `layouts/topbar/topbar.component.ts` | `app-topbar` | Top bar: search, notifications, cart, language picker, profile, logout |
| HorizontaltopbarComponent | `layouts/horizontaltopbar/horizontaltopbar.component.ts` | `app-horizontaltopbar` | Horizontal nav bar built from `menu.ts` + language picker |
| FooterComponent | `layouts/footer/footer.component.ts` | `app-footer` | Static footer, current year |
| RightsidebarComponent | `layouts/rightsidebar/rightsidebar.component.ts` | `app-rightsidebar` | Settings drawer: light/dark mode, sidebar type, topbar color, layout width |

### Shared / reusable components (4) — `src/app/shared/`

| Component | Path | Selector | Purpose |
|---|---|---|---|
| PageTitleComponent | `shared/ui/pagetitle/pagetitle.component.ts` | `app-page-title` | Page heading + breadcrumb; inputs `title: string`, `breadcrumbItems` |
| LoaderComponent | `shared/ui/loader/loader.component.ts` | `app-loader` | Preloader bound to `LoaderService` |
| StatComponent | `shared/widget/stat/stat.component.ts` | `app-stat` | KPI/stat card; inputs `title`, `value`, `icon` |
| TransactionComponent | `shared/widget/transaction/transaction.component.ts` | `app-transaction` | Transactions/table card + ng-bootstrap detail modal; input `transactions` |

### Modules / groupings

| Module | Path | Purpose |
|---|---|---|
| AppModule | `app.module.ts` | Root module: eager imports (HttpClient, TranslateModule forRoot, LayoutsModule, ExtrapagesModule, NgbModule…), wires the 3 interceptors |
| AppRoutingModule | `app-routing.module.ts` | Root routes: `account`, `` (Layout+wrapper), `pages`, `crypto-ico-landing`, wildcard 404 |
| PagesModule | `pages/pages.module.ts` | Aggregates all page feature modules + calendar/chat/filemanager |
| PagesRoutingModule | `pages/pages-routing.module.ts` | Child routes; lazy-loads 16 feature modules |
| LayoutsModule | `layouts/layouts.module.ts` | Declares all 8 layout components |
| SharedModule | `shared/shared.module.ts` | Re-exports UIModule + WidgetModule |
| UIModule | `shared/ui/ui.module.ts` | Declares/export PageTitle + Loader |
| WidgetModule | `shared/widget/widget.module.ts` | Declares/export Stat + Transaction |
| CoreModule | `core/core.module.ts` | **Empty** (no declarations/providers) — core services are `providedIn: 'root'` |
| AccountModule / AuthModule | `account/…` | Login/register/password pages, lazy at `/account/auth/*` |
| ExtrapagesModule | `extrapages/extrapages.module.ts` | 12 utility pages (404/500, coming-soon, lockscreen, verification…) |
| Cyptolanding (shared) | `cyptolanding/shared/shared.module.ts` | One-off landing page module + scrollspy directive |
| 16 lazy feature modules | `pages/{dashboards,ecommerce,crypto,email,invoices,projects,tasks,contacts,blog,utility,ui,form,tables,icons,chart,maps,jobs}/*.module.ts` | One per demo section (see §3c) |

### Key services (17) — infra where noted

| Service | Path | Responsibility |
|---|---|---|
| AuthenticationService | `core/services/auth.service.ts` | Firebase auth wrapper (`authUtils.ts`) — **infra** |
| AuthfakeauthenticationService | `core/services/authfake.service.ts` | Fake auth via `/users/authenticate` HTTP + localStorage token — **demo, replace** |
| EventService | `core/services/event.service.ts` | RxJS pub/sub used for layout/theme events — **infra** |
| LanguageService | `core/services/language.service.ts` | ngx-translate + `lang` cookie |
| ConfigService | `core/services/config.service.ts` | Loads `assets/dashboard.json` — **demo data source** |
| LoaderService | `core/services/loader.service.ts` | `BehaviorSubject<boolean>` loading flag — **infra** |
| UserProfileService | `core/services/user.service.ts` | Skeleton `GET /api/login`, `POST /users/register` — **demo, replace** |
| Page-level services (10) | e.g. `pages/ecommerce/orders/orders.service.ts`, `customers.service.ts`, `tables/advancedtable/advanced.service.ts`, `jobs/*/list.service.ts`, `contacts/userlist/userlist.service.ts`, `crypto/orders`, `crypto/wallet`, `projects/projectgrid` | Search/sort/paginate **in-memory** tables — **demo, replace with real API calls** |

### Guards / interceptors / helpers

| File | Type | Responsibility |
|---|---|---|
| `core/guards/auth.guard.ts` | AuthGuard | Blocks `''` and `pages` routes; redirects to login (see Notes §8) |
| `core/helpers/jwt.interceptor.ts` | HTTP interceptor | Adds `Authorization: Bearer <token>` |
| `core/helpers/error.interceptor.ts` | HTTP interceptor | On 401 → logout + reload; throws `err.error.message` |
| `core/helpers/fake-backend.ts` | HTTP interceptor | In-memory `/users/*` CRUD with `localStorage['users']` — **demo, strip** |
| `authUtils.ts` | helper | Firebase init/register/login/logout; stores user in `sessionStorage['authUser']` |

---

## 2. Folder structure

### `src/app/`

```
src/app/
├── app.module.ts              # root module, interceptor wiring
├── app-routing.module.ts      # root routes (lazy account/pages/extrapages)
├── app.component.{ts,html,scss}
├── authUtils.ts               # firebase auth backend helper
├── account/                   # auth pages (login, signup, password reset) — lazy
│   ├── account.module.ts / account-routing.module.ts   # -> 'auth' lazy
│   └── auth/                  # login, login2, signup, register2, passwordreset, recoverpwd2
│       ├── auth.module.ts, auth-routing.ts   # NOTE: not named *-routing.module.ts
│       └── <page>/<page>.component.{ts,html,scss}
├── core/                      # infra services, interceptors, guard, models
│   ├── core.module.ts         # empty
│   ├── guards/auth.guard.ts
│   ├── helpers/{jwt,error}.interceptor.ts, fake-backend.ts
│   ├── models/auth.models.ts  # User class
│   └── services/              # auth, authfake, config, event, language, loader, user
├── cyptolanding/              # public marketing landing page
│   ├── cyptolanding.component.{ts,html,scss}
│   └── shared/                # scrollspy.directive.ts + shared.module.ts
├── extrapages/                # 12 utility pages, eager module + lazy 'pages' route
│   ├── extrapages.module.ts, extrapages-routing.module.ts
│   └── comingsoon, confirmmail, confirmmail2, lockscreen, lockscreen2,
│       maintenance, page404, page500, steptwoverification(2), verification(2)
├── layouts/                   # all layout/shell components (§3a)
│   ├── layouts.module.ts / layouts.model.ts   # layout constants
│   ├── layout.component.{ts,html}
│   ├── vertical/, horizontal/, sidebar/, topbar/, horizontaltopbar/, 
│   │   footer/, rightsidebar/
│   ├── sidebar/menu.ts, menu.model.ts         # vertical menu definition + MenuItem model
│   └── horizontaltopbar/menu.ts, menu.model.ts
├── pages/                     # everything routed after login (§3c)
│   ├── pages.module.ts, pages-routing.module.ts
│   ├── calendar/, chat/, filemanager/          # single components, eager in PagesModule
│   ├── dashboards/            # default, saas(+shared/sellingchart), crypto, blog, jobs (6)
│   ├── ecommerce/             # products, productdetail, addproduct, cart, checkout,
│   │                          #   shops, orders, customers (8) — KEY CRUD EXAMPLES
│   ├── crypto/                # wallet, orders, exchange, buysell, lending, kycapplication (6)
│   ├── email/                 # inbox, emailread, alert, basic, billing (5)
│   ├── invoices/              # list, detail (2) — list+detail pattern
│   ├── projects/              # overview, create, projectgrid, projectlist (4)
│   ├── tasks/                 # list, createtask, kanbanboard (3)
│   ├── contacts/              # usergrid, userlist, profile (3)
│   ├── blog/                  # bloggrid, bloglist, detail (3)
│   ├── jobs/                  # list, grid, categories, candidate-list, candidate-overview,
│   │                          #   details, apply (7)
│   ├── form/                  # elements, layouts, advancedform, validation, wizard, mask,
│   │                          #   repeater, editor, uploads (9)
│   ├── tables/                # basic, advancedtable, editable(ng2-smart-table) (3)
│   ├── icons/                 # boxicons, materialdesign, dripicons, fontawesome (4)
│   ├── chart/                 # apex, chartjs, echart, chartist (4)
│   ├── maps/                  # google, leaflet (2)
│   ├── ui/                    # 24 bootstrap/widget demo pages (§3c)
│   └── utility/               # starter, faqs, pricing, timeline (4)
└── shared/                    # genuinely shared UI (§3b)
    ├── shared.module.ts
    ├── ui/{pagetitle,loader}/  → ui.module.ts
    └── widget/{stat,transaction}/ → widget.module.ts
```

### `src/assets/` and `src/environments/`

```
src/assets/
├── dashboard.json            # static KPI/stat data loaded via ConfigService (demo)
├── fonts/                    # boxicons, dripicons, fa-(brands|regular|solid), materialdesignicons, summernote
├── i18n/                     # en.json, es.json, de.json, it.json, ru.json (ngx-translate)
├── images/                   # flags/, brands/, clients/, companies/, product/, users/, layouts/, crypto/, small/…
└── scss/                     # the whole theming system (§4)
    ├── bootstrap.scss        # Bootstrap core + Skote overrides
    ├── app.scss              # structure/components/plugins/pages imports
    ├── icons.scss            # 4 font-icon sets
    ├── _variables.scss       # full Bootstrap variable redefinition
    ├── _theme-light.scss / _theme-dark.scss   # CSS-variable themes
    ├── _custom.scss          # 3rd-party CSS + dark-mode tweaks
    └── custom/
        ├── fonts/_fonts.scss      # Poppins (Google Fonts)
        ├── structure/             # general, topbar, page-head, footer, right-sidebar, vertical, horizontal-nav, layouts
        ├── components/            # reboot, badge, buttons, breadcrumb, card, dropdown, nav, table, pagination, progress + widgets, helper, preloader … (app-scope restyles of BS components)
        ├── pages/                 # authentication, ecommerce, email, file-manager, chat, projects, contacts, crypto, coming-soon, timeline, extras-pages, jobs
        ├── plugins/               # apexcharts, echarts, datatable, calendar, select2, sweetalert2 … (per-widget skins)
        ├── plugins/icons/         # _boxicons, _materialdesignicons, _fontawesome-all, _dripicons
        └── rtl/                   # bootstrap-rtl, components-rtl, structure-rtl … (ALL commented out in app.scss)
src/environments/
├── environment.ts            # production:false, defaultauth:'fackbackend', empty firebaseConfig
└── environment.prod.ts       # production:true, defaultauth:'fackbackend', empty firebaseConfig
```

### Module wiring (as actually configured)

- **Eagerly loaded at startup** (imports of `AppModule`): `LayoutsModule`, `ExtrapagesModule`, `SharedModule` (cyptolanding's), `CarouselModule`, `NgbAccordionModule/NgbNavModule/NgbTooltipModule/NgbModule`, `ScrollToModule.forRoot()`, `TranslateModule.forRoot()` (loader reads `assets/i18n/*.json`). `PagesModule` is **not** in `AppModule` imports — it is the `loadChildren` target of the root `''` route, but it eagerly imports all 16 page feature modules itself.
- **Lazy** (`loadChildren` in `app-routing.module.ts`): `account` → AccountModule, `''` → PagesModule, `pages` → ExtrapagesModule. `PagesRoutingModule` further lazy-loads 16 feature modules under it (`dashboards`, `ecommerce`, `crypto`, `email`, `invoices`, `projects`, `tasks`, `contacts`, `blog`, `pages`→UtilityModule, `ui`, `form`, `tables`, `icons`, `charts`→ChartModule, `maps`, `jobs`).
- **Layout wrapper**: root route `{ path: '', component: LayoutComponent, loadChildren: …PagesModule, canActivate: [AuthGuard] }` — `LayoutComponent` renders `<app-vertical>` / `<app-horizontal>` (switched by `isVerticalLayoutRequested()` / `isHorizontalLayoutRequested()`), and its template contains `<router-outlet>` inside the layout shells so every pages child renders inside the shell.
- **Guards**: `AuthGuard` on both `''` (pages) and `pages` (extrapages). `crypto-ico-landing` and `account` are public.
- **Account routes**: `account` → `account-routing` `auth` → `AuthModule` routes: `login`, `login-2`, `signup`, `signup-2`, `reset-password`, `recoverpwd-2`. Full URLs look like `/account/auth/login` (see Notes §8 for a redirect mismatch).

---

## 3. Components inventory

### 3a. Layout components (8)

All selectors/inputs/outputs below were read from the class files.

| Component (path under `src/app/layouts/`) | Selector | @Input / @Output | Purpose |
|---|---|---|---|
| `layout/layout.component.ts` | `app-layout` | none | Sets defaults from `layouts.model.ts` (`LAYOUT_VERTICAL`, `LAYOUT_WIDTH='fluid'`, `TOPBAR='dark'`, `LAYOUT_MODE='light'`, `SIDEBAR_TYPE='dark'`); subscribes to `EventService` events (`changeLayout`, `changeWidth`, `changeSidebartype`, `changeMode`) and applies them by mutating `document.body` attributes: `data-layout-mode`, `data-sidebar`, `data-topbar`, `data-sidebar-size`, `data-layout-size`, `data-layout-scrollable`, classes `vertical-collpsed`/`sidebar-enable` |
| `vertical/vertical.component.ts` | `app-vertical` | none | Sets `data-layout="vertical"`; `onSettingsButtonClicked()` toggles `right-bar-enabled`; `onToggleMobileMenu()` toggles `sidebar-enable` / `vertical-collpsed`; removes `sidebar-enable` on navigation |
| `horizontal/horizontal.component.ts` | `app-horizontal` | none | Sets `data-layout="horizontal"`; handles `changeTopbar` (light/dark/colored) via `data-topbar` |
| `sidebar/sidebar.component.ts` | `app-sidebar` | `@Input() isCondensed = false` | Renders `MENU` from `sidebar/menu.ts` through `<app-sidebar>` templates; `@ViewChild('sideMenu')` instantiated with MetisMenu; `_activateMenuDropdown()` computes `mm-active`/`mm-show` from current `window.location.pathname` |
| `topbar/topbar.component.ts` | `app-topbar` | `@Output() settingsButtonClicked`, `@Output() mobileMenuButtonClicked` | Search, notifications, cart, language dropdown (`setLanguage` via `LanguageService`), profile logout, fullscreen toggle (`fullscreen-enable`) |
| `horizontaltopbar/horizontaltopbar.component.ts` | `app-horizontaltopbar` | none | Horizontal nav from `menu.ts` + `activateMenu()`; language picker; logout; fullscreen |
| `footer/footer.component.ts` | `app-footer` | none | Renders current year |
| `rightsidebar/rightsidebar.component.ts` | `app-rightsidebar` | none | Settings drawer radio controls that `EventService.broadcast('changeMode' / 'changeSidebartype' / 'changeTopbar' / 'changeWidth' / 'changeLayout', …)` back to `LayoutComponent`; `hide()` removes `right-bar-enabled` |

**No `layout.service.ts` exists.** Layout state is *not* centralized in a service: the flow is
Rightsidebar → `EventService` broadcast → `LayoutComponent` listener → `document.body` attribute
mutation → SCSS rules in `custom/structure/*` + `_theme-*.scss` that key off those attributes.
Sidebar/mobile open/close is plain body-class toggling from `VerticalComponent`. Nothing is
persisted (no cookies/localStorage for theme) — refreshing resets to light + dark sidebar.

### 3b. UI / reusable components under `shared/` (4)

| Component | Selector | @Input / @Output | Purpose | Custom vs wrapper |
|---|---|---|---|---|
| `shared/ui/pagetitle/pagetitle.component.ts` | `app-page-title` | `@Input() title: string; @Input() breadcrumbItems` | Card-less page header with breadcrumb list | **Custom** — the single most reused template element (every demo page sets `breadCrumbItems`) |
| `shared/ui/loader/loader.component.ts` | `app-loader` | none | Spinner/preloader; subscribes to `LoaderService.isLoading` | **Custom** (uses Bootstrap spinner markup) |
| `shared/widget/stat/stat.component.ts` | `app-stat` | `@Input() title`, `@Input() value`, `@Input() icon` | Stat/KPI card (icon + label + big number) used on dashboards | **Custom** |
| `shared/widget/transaction/transaction.component.ts` | `app-transaction` | `@Input() transactions: Array<{id?, index?, name?, date?, total?, status?, payment?}>` | Table card with status badges + `NgbModal` detail popup | **Custom** over ng-bootstrap |

Everything else that looks "reusable" is a **thin wrapper around a third-party lib** used directly
in feature pages (not in `shared/`): `ngx-ui-switch` (`ui-switch`), `ngx-owl-carousel-o`
(`<ngx-owl-carousel-o>`), `ng-apexcharts` (`<apx-chart>`), `ngx-echarts`
(`<echarts>`), `ng2-charts` (`<canvas baseChart>`), `angular-archwizard`
(`<aw-wizard>`), `ng2-smart-table` (`<ng2-smart-table>`), `@ctrl/ngx-emoji-mart`, `ngx-lightbox`,
`ngx-masonry`, `ngx-color-picker`, `ngx-otp-input`, `ng5-slider`, `ngx-dropzone`. There is no
custom Angular wrapper/directive for them — they are used directly in page templates.

### 3c. Page components (100) — grouped by folder

| Group | Count | Notable examples |
|---|---|---|
| `pages/dashboards/` | 6 | default (KPI cards + charts, loads `dashboard.json` via `ConfigService`), saas, crypto, blog, jobs |
| `pages/ecommerce/` | 8 | **orders** (add/edit modal table + SweetAlert delete), **customers** (same pattern), **addproduct** (big form), products grid, productdetail |
| `pages/crypto/` | 6 | wallet, orders, kycapplication (archwizard multi-step), exchange, buysell, lending |
| `pages/email/` | 5 | inbox, emailread, alert, basic, billing |
| `pages/invoices/` | 2 | **list** (data table), **detail** (read-only detail view) — list+detail pattern |
| `pages/projects/` | 4 | **overview** (stat cards + table + modal), **create** (form page), projectgrid, projectlist |
| `pages/tasks/` | 3 | **list** (add/edit modal + status filter), createtask, kanbanboard |
| `pages/contacts/` | 3 | **usergrid** (card grid + add-user modal + validated form), userlist, profile |
| `pages/blog/` | 3 | bloggrid, bloglist, detail |
| `pages/jobs/` | 7 | list, grid, categories, candidate-list, candidate-overview, details, **apply** (multi-field application form) |
| `pages/form/` | 9 | **validation** (validators demo incl. custom MustMatch), **wizard** (archwizard), elements, layouts, advancedform, mask, repeater, editor, uploads |
| `pages/tables/` | 3 | **advancedtable** (search/sort/paginate + typeahead), **editable** (ng2-smart-table), basic |
| `pages/icons/` | 4 | boxicons, materialdesign, dripicons, fontawesome |
| `pages/chart/` | 4 | apex, chartjs, echart, chartist |
| `pages/maps/` | 2 | google (AGM), leaflet |
| `pages/ui/` | 24 | modals (ng-bootstrap filter/modal demos), alerts, buttons, cards, carousel (owl), dropdowns, grid, images, lightbox, notification, placeholder, progressbar, rangeslider, rating, sweetalert, tabs, toasts, typography, utilities, video, colors, general, imagecropper, badges |
| `pages/utility/` | 4 | starter, faqs, pricing, timeline |
| Standalone | 3 | `calendar` (FullCalendar), `chat`, `filemanager` |

**Useful CRUD examples to copy** (flagged for §6): `ecommerce/orders`, `ecommerce/customers`,
`contacts/usergrid`, `invoices/list` + `invoices/detail`, `tasks/list`, `tables/editable`,
`tables/advancedtable`, `form/validation`, `form/wizard`.

---

## 4. Styling system

### SCSS architecture

- **`src/assets/scss/bootstrap.scss`** — imports Bootstrap **functions → variables → Skote `_variables.scss` → mixins → full `@import "bootstrap"`** (i.e. Bootstrap 5.2.0 is shipped wholesale, then Skote's `custom/components/` overrides restyle the components: `_reboot`, `_backgrounds`, `_badge`, `_buttons`, `_breadcrumb`, `_card`, `_dropdown`, `_nav`, `_table`, `_pagination`, `_progress`). These files override Bootstrap component classes rather than replacing the framework.
- **`src/assets/scss/app.scss`** — the main skin. Imports fonts, Bootstrap function/variables/mixins, then `_variables`, `_theme-light`, `_theme-dark`, `_custom`, then `custom/structure/*` (general, topbar, page-head, footer, right-sidebar, vertical, horizontal-nav, layouts), `custom/components/*` (waves, avatar, accordion, helper, preloader, forms, widgets, demos, print), a long list of `custom/plugins/*` (apexcharts, echarts, datatable, calendar, dragula, range-slider, sweetalert2, rating, toastr, parsley, select2, switch, colorpicker, timepicker, datepicker, touchspin, form-editors/upload/wizard, responsive/editable tables, sparkline, google/vector/leaflet maps…), then `custom/pages/*` per-section skins. The `custom/rtl/*` block is there but **fully commented out**.
- **`src/assets/scss/icons.scss`** — imports `custom/plugins/_icons.scss` which imports the 4 icon fonts.
- Entry points (from `angular.json` `styles` array): `node_modules/…/owl.carousel.min.css`, `owl.theme.default.min.css`, `node_modules/angular-archwizard/styles/archwizard.css`, `src/styles.scss`, then `src/assets/scss/bootstrap.scss`, `app.scss`, `icons.scss`.

### Key variable files

- **`src/assets/scss/_variables.scss`** — a full Bootstrap 5 variable redefinition. Groups (all in this one file):
  - **Brand / theme colors**: `$blue:#556ee6`, `$purple:#6f42c1`, `$green:#34c38f`, `$yellow:#f1b44c`, `$red:#f46a6a`, `$cyan:#50a5f1`… plus `$theme-colors` map (primary/secondary/success/info/warning/danger/pink/light/dark).
  - **Sidebar**: `$sidebar-bg`, `$sidebar-menu-item-*colors`, `$sidebar-width:250px`, `$sidebar-collapsed-width:70px`, plus dark-sidebar variant (`$sidebar-dark-bg:#2a3042`, `$sidebar-dark-menu-item-color:#a6b0cf`…). **Topbar**: `$header-height:70px`, `$header-bg` (uses `var(--bs-heading-bg)`), dark variant `$header-dark-bg`. **Footer**: `$footer-height:60px`. **Right sidebar**: `$rightbar-width:280px`. **Boxed layout**: `$boxed-layout-width:1300px`.
  - **Body**: `$body-bg:#f8f8fb`, `$body-color:$gray-700`.
  - **Typography**: `$font-family-sans-serif:'Poppins', sans-serif` (loaded via Google Fonts in `custom/fonts/_fonts.scss`), `$font-size-base:0.8125rem`, heading sizes.
  - **Spacing / grid**: `$spacer:1rem` + `$spacers` map, `$grid-gutter-width:24px`, `$grid-breakpoints` (sm 576 … xxl 1400).
  - **Tables/buttons/forms/accordions/modals(z-index)/navs/pagination/cards**: standard Bootstrap sections all overridden.
- **`src/assets/scss/_theme-light.scss`** — CSS custom properties under `:root` (`--bs-heading-bg`, `--bs-topbar-search-bg`, `--bs-input-border-color`, `--bs-footer-bg`, `--bs-custom-white`…).
- **`src/assets/scss/_theme-dark.scss`** — same variable names re-defined under `[data-layout-mode="dark"]`, with dark gray ramp (`#212529…#f8f9fa`), `--bs-body-bg:#222736`, plus per-component dark overrides (`.card`, `.dropdown-menu`, `.modal`, `.nav-tabs`, `.table`, `.accordion`, `.toast`, `.btn-light/dark`).
- `_variables.scss` also flips Bootstrap options: `$enable-shadows:false`, `$enable-caret:false`, `$enable-gradients:false`.

### Bootstrap

Version **5.2.0** (`bootstrap ^5.2.0` in `package.json`). It is imported fully through
`bootstrap.scss` (not tree-shaken), then customized (a) via the `_variables.scss` re-definitions
fed into the Bootstrap compile, and (b) via `custom/components/*` post-import overrides. Dark mode
does **not** use Bootstrap's `data-bs-theme` — it is the template's own `[data-layout-mode="dark"]`
selector that overrides `--bs-*` CSS custom properties (see below).

### Theme-switching / layout variants

- **Dark/light toggle**: `rightsidebar` radio buttons call `RightsidebarComponent.changeMode()` →
  `EventService.broadcast('changeMode', 'light'|'dark')` → `LayoutComponent.changeMode()` sets
  `document.body` attribute `data-layout-mode` → `_theme-dark.scss` / `_theme-light.scss` react.
- **Sidebar variants**: `changeSidebartype()` supports `light`, `dark` (default), `compact`
  (`data-sidebar-size=small`), `icon` (adds `vertical-collpsed` + `data-keep-enlarged`), `colored`
  (`data-sidebar=colored`) — again via body attributes consumed by `custom/structure/_vertical.scss`
  and `_layouts.scss`.
- **Topbar**: `changeTopbar()` sets `data-topbar=light|dark|colored` (horizontal layout).
- **Width**: `changeWidth()` sets `data-layout-size=fluid|boxed` or `data-layout-scrollable=true`.
- **RTL**: **not wired at runtime** — the `custom/rtl/*` SCSS files exist but are commented out in
  `app.scss`; `app.component.ts` has a commented-out `setAttribute("dir","rtl")`; the right sidebar
  just links to an external RTL demo site (`skote-v-rtl.angular.themesbrand.com`).
- Defaults live in `layouts/layouts.model.ts`: `LAYOUT_VERTICAL`, `LAYOUT_WIDTH='fluid'`,
  `SIDEBAR_TYPE='dark'`, `TOPBAR='dark'`, `LAYOUT_MODE='light'`.

### Icon sets

Four font-icon sets ship in fonts + SCSS: **Boxicons** (`bx`/`bxs`), **Material Design Icons**
(`mdi`), **Font Awesome** (`fa`), **Dripicons** (`dripicons`). Evidence:

- Fonts: `src/assets/fonts/boxicons.*`, `materialdesignicons-webfont.*`, `fa-*.woff*`,
  `dripicons-v2.*` (matches the 4 `@import`s in `assets/scss/custom/plugins/_icons.scss`).
- Actual usage in templates: `topbar.component.html` uses `bx bx-search-alt`, `bx bx-bell`,
  `mdi mdi-chevron-down`, `mdi mdi-magnify`…; `sidebar.component.html` renders
  `<i class="bx {{item.icon}}">` fed from `sidebar/menu.ts` (e.g. `bx-home-circle`,
  `bx-calendar`, `bx-store`, `bx-bitcoin`, …).
- Demos: `pages/icons/{boxicons,materialdesign,dripicons,fontawesome}/`.

Feather icons are **not** used — the only "feather" string hits are Font Awesome icon *names*
inside the demo data arrays of `pages/icons/{fontawesome,materialdesign}/data.ts`.

---

## 5. Conventions

### Naming

- Components: one folder per component, lowercase folder name, `<name>.component.{ts,html,scss}`
  files, `export class <PascalCase>Component`, selector `app-<kebab-name>`. Suffix `.spec.ts`
  present but empty for most.
- Folders are a **mix of kebab-case and camelCase/single-word** with no consistent rule:
  `candidate-list` vs `userlist`, `candidate-overview` vs `projectgrid`, `advancedtable`,
  `createtask`, `kanbanboard`, `emailread`, `comingsoon`, `steptwoverification2`.
- Modules: `<feature>.module.ts`, class `<Feature>Module`; routing is `<feature>-routing.module.ts`
  — **except** `account/auth/auth-routing.ts` (no `.module` suffix, class `AuthRoutingModule`).
- Services: `<name>.service.ts` everywhere; class names are mixed (e.g. `AuthfakeauthenticationService`).
- Shared vs feature: only `shared/ui` + `shared/widget` are truly shared; each page folder keeps
  its own `data.ts`, `*.model.ts`, and often a private service/directive (e.g.
  `orders.service.ts` + `orders-sortable.directive.ts` live inside `ecommerce/orders/`).
- **Duplicate selectors exist**: `app-list` (invoices/list, jobs/list, tasks/list), `app-detail`
  (blog/detail, invoices/detail), `app-orders` (ecommerce/orders, crypto/orders), `app-create`
  (projects/create; also similar `app-createtask`). Tolerable because these are route targets, but
  do not re-use them as nested components.
- Forms use Angular 15's migration classes: `UntypedFormBuilder`, `UntypedFormGroup`
  (typed `FormBuilder`/`FormGroup` are not used).

### Routing

- Root (`app-routing.module.ts`): `account` (lazy) · `''` → `LayoutComponent` + lazy `PagesModule`, guarded · `pages` → lazy `ExtrapagesModule`, guarded · `crypto-ico-landing` (public) · `**` → `Page404Component`. `scrollPositionRestoration: 'top'`.
- `PagesRoutingModule` (child of the `''` route): `''` and `dashboard` → `DefaultComponent`; `calendar`, `chat`, `filemanager` eager; everything else lazy per section module; note the alias collision: route `pages` inside the app-rooted `pages` mount-point maps to `utility/utility.module.ts` (`starter`, `faqs`, `pricing`, `timeline`).
- Guard: `AuthGuard` redirects to `/account/login` (see Notes §8). Account sub-routes (AuthModule): `login`, `login-2`, `signup`, `signup-2`, `reset-password`, `recoverpwd-2`.

### Services / state / HTTP

- **No shared business-data REST layer.** `core/services` only cover auth, language, config and UI
  events. Business entities on every page come from local `data.ts` arrays.
- **HTTP wiring**: `HttpClient` is used directly (no custom wrapper class). `JwtInterceptor`
  attaches `Authorization: Bearer <token>` where the token comes from
  `localStorage['currentUser']` (fake backend mode) or `sessionStorage['authUser']` (firebase
  mode). `ErrorInterceptor` auto-logs-out on 401 and rethrows `err.error.message`.
  `FakeBackendInterceptor` answers `/users/authenticate|register|GET|DELETE` from
  `localStorage['users']` with a 500 ms delay and a `fake-jwt-token`.
- **Auth token storage**: localStorage for the fake backend (`currentUser`), sessionStorage for
  firebase (`authUser`), via `authUtils.ts` (`FirebaseAuthBackend` singleton: initializeApp,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut).
  `environment.defaultauth` (`'fackbackend'` in both env files) switches between them at runtime —
  the `app.module.ts` snippet `if (environment.defaultauth === 'firebase') … else FakeBackendInterceptor;`
  is a no-op expression statement (the interceptor is always registered below).
  **`ngx-cookie-service`** is used only for the `lang` cookie in `LanguageService`.
- **State**: layout/theme events go through `EventService` (typed `Subject` pub/sub with
  `broadcast(type, payload)` / `subscribe(type, cb)`). `LoaderService` is a `BehaviorSubject` the
  preloader subscribes to (its spinner is effectively always visible for ~1.5 s since nothing
  toggles the flag; a `LoaderInterceptorService` is commented out in `app.module.ts`).
- **Page-level table services** (`orders.service.ts`, `customers.service.ts`, `advanced.service.ts`,
  `jobs/*/list.service.ts`, `userlist.service.ts`, `crypto/{orders,wallet}.service.ts`,
  `projectgrid.service.ts`) all follow the same demo pattern: private `BehaviorSubject`s +
  `State` object (page/pageSize/searchTerm/sortColumn/sortDirection) + `_search()` that sorts,
  filters and slices the **in-memory** array. This is the shape to copy when you wire a real
  `GET` list endpoint — replace the constant import with the service's HTTP call.

### Forms

Template uses **reactive forms** everywhere a form is real, with Bootstrap validation classes in
markup. Evidence:

- `pages/contacts/usergrid/usergrid.component.ts`: `userForm = this.formBuilder.group({ name, email, designation: [..,[Validators.required]] })`, a `get form()` controls accessor, `submitted` flag, `saveUser()` checks `this.userForm.valid` and pushes into the grid array, opened through `NgbModal`.
- `pages/ecommerce/orders/orders.component.ts` (and `customers.component.ts`): full add **and edit** cycle — `openModal(content)` vs `editDataGet(id, content)` which `setValue`s the `UntypedFormGroup` controls, `ordersForm.valid` gate, `modalService.dismissAll()`, plus `sweetalert2` delete confirmation.
- `pages/form/validation/validation.component.ts` + `validation.mustmatch.ts`: validators (`pattern`, `minLength`, `min/max`, custom cross-field `MustMatch('password','confirmpwd')`).
- `pages/jobs/apply/apply.component.ts`, `pages/tasks/list/list.component.ts`, `pages/ecommerce/addproduct/addproduct.component.ts`, `pages/form/repeater/repeater.component.ts` (FormArray): more form examples.

---

## 6. Reusable pieces for new pages

All paths are exact and verified on disk.

### Recommended starting points

1. **Table with server-side-style filtering/pagination — `src/app/pages/ecommerce/orders/`**
   Files: `orders.component.ts` + `orders.service.ts` + `orders-sortable.directive.ts` + `data.ts` + `orders.model.ts`. The service already implements the full RxJS pipeline you would otherwise write: `BehaviorSubject` loading/total/rows, `_search$` Subject with `debounceTime(200)` + `switchMap`, a `State` object (page, pageSize, searchTerm, sortColumn, sortDirection, startIndex, endIndex, totalRecords, extra filters), sort/filter/paginate over the data, and `@ViewChildren` sortable headers wired via a `NgbdOrdersSortableHeader` directive. **To go live**: replace the `import { Orders } from './data'` constant inside `_search()` with your REST call. Clone this trio (component + service + sortable directive) per entity.
   Same pattern: `pages/ecommerce/customers/` (adds an email-pattern validator), `pages/tables/advancedtable/` (adds `NgbTypeahead` search + `advanced-sortable.directive.ts`).
2. **Grid/list + add/edit modal + delete confirm — `src/app/pages/ecommerce/customers/`** (or `orders/`)
   CRUD modal form (`openModal`/`editDataGet`/`saveCustomer`, `submitted` flag, `formData.valid`), SweetAlert2 confirm delete, master checkbox. This is the closest thing to a real admin CRUD page in the template.
3. **Simple add-through-modal + validated form — `src/app/pages/contacts/usergrid/`**
   Smallest complete example: `NgbModal` add form with `Validators.required`, push into the list. Great first clone.
4. **List + detail pages — `src/app/pages/invoices/list/` + `invoices/detail/`**
   Table list page and a separate read-only detail page with its own route, breadcrumb and model. Map one-to-one onto "list screen → detail screen" flows.
5. **Stat cards + charts dashboard — `src/app/pages/dashboards/default/`**
   Uses `<app-stat>` (from `shared/widget/stat`), `<apx-chart>` ApexCharts, and `ConfigService` (which currently reads `assets/dashboard.json` — swap for real count endpoints). Charts reference library: `pages/chart/apex`, `pages/chart/echart`, `pages/chart/chartjs`.
6. **Validation reference — `src/app/pages/form/validation/`** (validators + classes + custom `MustMatch`), **wizard — `src/app/pages/form/wizard/`** and `crypto/kycapplication/` (`<aw-wizard>` from angular-archwizard), **modal gallery — `src/app/pages/ui/modals/`**.

### Mapping to SMS Taxi API groups (names from `docs/API_REFERENCE.md`)

| Skote pattern (exact path) | Why | Suits API groups |
|---|---|---|
| `pages/ecommerce/orders/` (component + service + sortable directive) | searchable/sortable/paginated table with status + payment columns | **Taxis**, **Clients**, **Demands**, **Offers**, **SMS In** (all have admin list + paginated variants: `get-all-taxis`, `get-allClients`, `get-demande`, `get-allOffre`, `get-all`) |
| `pages/ecommerce/customers/` | same pattern + add/edit modal + delete confirm | **Taxis**, **Clients**, **Offers**, **reservations admin** |
| `pages/contacts/usergrid/` | minimal add-modal form | **Clients**, **Taxis** (`add-client`, `add-taxi`), **Offers** (`ajouterOffre`) |
| `pages/invoices/list/` + `detail/` | route-based list → detail | **Demands** (`get-demande` list / `get-demande/{id}`), **Offers** (`get-offreParId/{id}`), **reservations admin** (`/api/admin/reservations`, `/{id}`) |
| `pages/tasks/list/` | list + modal to change status fields | **Demands** / **Offers** state updates (`update-EtatDemande`, `update-EtatOffre`) |
| `pages/dashboards/default/` (+ `shared/widget/stat`, `ConfigService`) | stat cards + charts | count endpoints: **Taxis** (`nbr-taxi`), **Clients** (`nbr-client`), **Demands** (`nbr-NbrDemandeEncours`, `nbr-DemandeEnattente`), **Offers** (`NbrOffreEncours`, `NbrOffreEnattente`), **SMS In** (`nbr-sms`) |
| `pages/tables/editable/` | `ng2-smart-table` with column-level filters | quick admin grids for **Taxis**/**Clients**/**SMS In** |
| `pages/form/validation/` + `pages/form/wizard/` | validation + multi-step form shells | **reservations admin** (create with assignment), **Clients/Taxis** registration forms |

### Demo-only things to strip/ignore when wiring real APIs

- `core/helpers/fake-backend.ts` interceptor and its 500 ms delay + `localStorage['users']`.
- `environment.defaultauth` + `authUtils.ts` firebase init, unless you want firebase auth.
- Every page's local `data.ts` (mock arrays) and the page services that just sort/filter them —
  keep the service skeleton, swap the source.
- `assets/dashboard.json` + `ConfigService` (static dashboard numbers).
- `core/services/user.service.ts` endpoints (`/api/login`, `/users/register`).
- Most `icons/*`, `chart/*`, `maps/*`, `ui/*` pages are pure demos — no business logic.
- Commented-out `LoaderInterceptorService` in `app.module.ts` (global spinner exists but unused).

---

## 7. Notes / ambiguities

1. **There is no `layout.service.ts`.** Layout/theme state is spread across `EventService` (broadcast/subscribe) + direct `document.body` attribute manipulation in `layout.component.ts` and the vertical/horizontal shells. Nothing persists a chosen theme; reload resets to light mode + dark sidebar.
2. **Auth guard redirect may 404.** `AuthGuard` navigates to `/account/login`, but the actual login route is `/account/auth/login` (AccountModule → `auth` → AuthModule `login`). `/account/login` hits the `**` wildcard (Page404). Verify before relying on login redirect.
3. **RTL is not functional.** `custom/rtl/*` SCSS files exist but are commented out in `app.scss`; `app.component.ts` has a commented `dir="rtl"` line; no runtime dir toggling exists (the right sidebar only links to an external RTL demo).
4. **Duplicate component selectors** in the template: `app-list` ×3 (invoices, jobs, tasks), `app-detail` ×2 (blog, invoices), `app-orders` ×2 (ecommerce, crypto), `app-create` (projects). OK as route targets, but never nest two in one view.
5. **Fake/mock data everywhere.** Only auth and `dashboard.json` go through HTTP; all business tables are local arrays. Page services simulate server behavior in-memory — they must be rewired to the SMS Taxi backend.
6. **Mixed naming conventions**: folders `userlist`/`projectgrid`/`advancedtable`/`createtask` vs `candidate-list`/`candidate-overview`; routing file `auth-routing.ts` (no `.module`) vs every other `*-routing.module.ts`; service class `AuthfakeauthenticationService`. There is no enforced style beyond "one folder per component".
7. **`CoreModule` is an empty shell** and `ExtrapagesModule` is imported both eagerly (AppModule) and lazy (`pages` route); `account/auth/login2` is also re-registered as an extrapages route (`pages/login-2`). Clean-up candidates when you trim the demo.
8. **Interceptors run in order** Jwt → Error → FakeBackend (`multi: true` in `app.module.ts`). The firebase branch of `app.module.ts` only *mentions* `FakeBackendInterceptor` (expression statement) — the interceptor is registered regardless, so if you switch `defaultauth` to `firebase` it still intercepts `/users/*` calls.
9. **Language service double-registration**: `LanguageService` is `providedIn: 'root'` *and* listed in `LayoutsModule.providers`; harmless but redundant.
10. **Documented counts vs reality**: 132 components / 50 modules / 17 services / 223 scss confirmed, but the task-note "132" includes generated `.spec.ts`-paired components and `loader.service.zip`/`loader.zip` (vendored zips) exist in `core/services/` and `shared/ui/` — leftover artifacts, ignore them.
11. **Sortable directive filenames differ** per page (`advanced-sortable.directive.ts`, `orders-sortable.directive.ts`, `customers-sortable.directive.ts` — not `*.directive.ts` uniform), and `advancedtable` uses a custom `advanced.model.ts` + `advanced.service.ts`. Expect per-page naming drift.
12. **Bootstrap is v5.2.0 with `$prefix: bs-`**; dark mode is achieved by overriding `--bs-*` CSS vars under `[data-layout-mode="dark"]` (template-specific, not Bootstrap's `data-bs-theme`).