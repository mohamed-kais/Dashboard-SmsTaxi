# SMS Taxi Ops Dashboard — Implementation Plan

Goal: turn the generic Skote Angular template into the real SMS Taxi ops dashboard: strip demo
content, keep reusable building blocks, and build feature pages wired to the real backend.

Sources of truth:
- `docs/API_REFERENCE.md` — backend OpenAPI spec (endpoints, DTOs, enums, error shape). Do not
  invent endpoints/fields beyond it.
- `docs/TEMPLATE_GUIDE.md` — template inventory (components, structure, styling, conventions).
- Project root: `Skote_Angular_v4.1.0/Admin` (Angular 15, Bootstrap 5.2, ng-bootstrap 14,
  ng2-smart-table, ApexCharts, ngx-translate).

---

## 1. Key decisions (the contract)

1. **New feature code lives in `src/app/features/<area>/`** — one lazy-loaded module per feature
   area. ALL demo pages under `src/app/pages/*` are deleted. `layouts/`, `shared/`, `core/`,
   `account/`, `extrapages/` and `assets/scss` stay.
2. **Base URL:** `environment.apiBaseUrl` (`src/environments/environment*.ts`) +
   `ApiBaseUrlInterceptor`. Dev default `http://41.225.11.231:8577` (observed working); the spec's
   declared servers (`http://41.225.11.231:8777/taxi-client`, `https://api.example.com`) are kept as
   comments for prod. **Swapping dev/prod = one env change.** Flag the port/base-path discrepancy for
   backend-team confirmation (see API_REFERENCE.md "Base URLs").
3. **Interceptor order** (registered `multi: true` in `app.module.ts`):
   `Jwt → Error → FakeBackend → ApiBaseUrl`. ApiBaseUrl runs LAST so the fake auth backend still
   intercepts `/api/login` + `/users/*`; ApiBaseUrl prefixes any request whose path starts with
   `/api/` or `/taxi-client/api/` with `environment.apiBaseUrl`.
4. **Auth:** keep the template `AccountModule` (login/register) and its fake-backend wiring as-is.
   Real JWT auth must NOT be built: the spec does not document `/jwt-authentication`. → ROADMAP.
5. **Shared DTO models** are transcribed verbatim from API_REFERENCE.md into
   `src/app/core/models/*.model.ts` (exact list in §6). Feature code imports types from there;
   no per-feature redefinition of shared entities.
6. **Status badges:** `src/app/core/constants/status-badges.ts` exports badge maps + a
   `statusBadge(key, map)` helper. ONE scheme across the whole app (see §7). Badge CSS classes must
   be ones that exist in the template SCSS (`badge-soft-*` / `bg-*`); add a small
   `_app-status.scss` only if a class genuinely doesn't exist.
7. **Reuse live template pieces** rather than rebuilding: layout shell (`layouts/*`),
   `shared/ui` (`app-page-title`, `app-loader`), `shared/widget` (`app-stat`, `app-transaction`),
   ng-bootstrap (modal, pagination, typeahead, datepicker, dropdown), `ng2-smart-table`,
   `ng-apexcharts`. Reusable *patterns* from deleted demo pages (sortable-table directive +
   filter/paginate pipeline) are **salvaged into `core/` before deletion** (§3).
8. **No invented endpoints.** Any feature need without a documented endpoint → note in
   `docs/ROADMAP.md`; use the closest documented proxy or omit the piece.
9. **Naming:** kebab-case filenames; selector `app-<name>`; module `<Name>Module`; service
   `<Resource>Service` (`providedIn: 'root'`) at `core/services/`; model `<name>.model.ts`;
   routes: `dashboard, taxis, clients, demands, offers, reservations, ratings, sms-log, sos,
   settings`.
10. **Build gate is the integration lane only.** The app is intentionally mid-refactor between
    lanes; individual feature lanes do NOT run `ng build`/`tsc` on the whole project (unwired
    modules aren't compiled anyway). Feature lanes self-review instead. L8 runs the real build.

---

## 2. Architecture

```
+--------------------------------+---------------------------------+
| Angular lazy feature modules (src/app/features/*)                |
| Dashboard | Taxis | Clients | Demands+Offers | Reservations      |
| Ratings | SMS Log | SOS | Settings                               |
|                                                                  |
+--------------------------------+---------------------------------+
                                  |
                                  v
+--------------------------------+---------------------------------+
| Per-resource API services (src/app/core/services/*)              |
| TaxiService  ClientService  DemandeService  OffreService         |
| ReservationService  RatingService  SmsService  ConfigService     |
|                                                                  |
+--------------------------------+---------------------------------+
                                  |
                                  v
+--------------------------------+---------------------------------+
| Shared HTTP layer                                                |
| HttpClient + ApiBaseUrlInterceptor (+Jwt/Error kept)             |
| environment.apiBaseUrl -- single dev/prod swap                   |
|                                                                  |
+--------------------------------+---------------------------------+
                                  |
                                  v
+--------------------------------+---------------------------------+
| SMS Taxi backend  (OpenAPI: docs/API_REFERENCE.md)               |
| /api/get-all-taxis  /api/add-demande  /api/ride-offers/* ...     |
| All DTOs / status enums / error shape taken verbatim from spec   |
|                                                                  |
+--------------------------------+---------------------------------+
```

---

## 3. Remove vs keep vs salvage

**REMOVE (foundation lane):**
- `src/app/pages/**` entirely — every demo section: dashboards, ecommerce, crypto, email,
  invoices, projects, tasks, contacts, blog, utility, ui, form, tables, icons, chart, maps, jobs,
  calendar, chat, filemanager. (Including `pages.module.ts`, `pages-routing.module.ts`,
  `pages/pages-routing.module.ts`.)
- `src/app/cyptolanding/` (marketing landing) + its `/crypto-ico-landing` route.
- `src/assets/dashboard.json` (demo numbers).
- Demo `data.ts` / demo page services — die with their folders.
- Routes + sidebar `menu.ts` entries pointing at anything deleted.

**KEEP:**
- `src/app/layouts/` (vertical/horizontal shell, sidebar, topbar, footer, rightsidebar).
- `src/app/shared/` (`UIModule` + `WidgetModule`: page-title, loader, stat, transaction).
- `src/app/core/` (guards, interceptors [Jwt/Error/fake-backend], helpers) — trimmed only:
  fix `AuthGuard` redirect `/account/login` → `/account/auth/login` (documented bug), drop the
  double `LanguageService` registration.
- `src/app/account/` (auth pages), `src/app/extrapages/` (404/500/lockscreen/coming-soon).
- `src/assets/scss/**` (all themes/icons/fonts), `assets/i18n`, `assets/fonts`, `assets/images`.
- `app.component.*`, `environments/` (edited, not deleted).
- npm libraries stay in `package.json` (pruning unused ones → ROADMAP).

**SALVAGE into `core/` BEFORE deleting `pages/` (foundation lane):**
- `pages/ecommerce/orders/orders-sortable.directive.ts` → `core/directives/sortable.directive.ts`
  (generic `NgbdSortableHeader`, `sortable` input, `sortchange` output).
- `pages/ecommerce/orders` table pipeline (BehaviorSubject + `_search$` + `switchMap` + `State`
  object: page/pageSize/searchTerm/sortColumn/sortDirection) → `core/utils/table-state.ts`
  (generic `TableState` + comparator/paginate helpers). Features build their per-entity service
  pipeline from these.

---

## 4. Target module / route map

| Feature module | Folder | Lazy route | Sidebar group |
|---|---|---|---|
| DashboardModule | features/dashboard | `dashboard` (default redirect) | Overview |
| TaxisModule | features/taxis | `taxis` (+ `taxis/:id`) | Fleet |
| ClientsModule | features/clients | `clients` (+ `clients/:id`) | Fleet |
| DemandsOffersModule | features/demands-offers | `demands`, `demands/:id`, `offers`, `offers/:id` | Operations |
| ReservationsModule | features/reservations | `reservations` (+ `reservations/:id`) | Operations |
| RatingsModule | features/ratings | `ratings` (+ `ratings/driver/:id`) | Fleet |
| SmsLogModule | features/sms-log | `sms-log` | Operations |
| SosModule | features/sos | `sos` | Alerts |
| SettingsModule | features/settings | `settings` | System |

Integration lane wires these as lazy routes under the layout wrapper in the shell that the
foundation lane leaves behind, and rebuilds `menu.ts` with the side-bar groups above.

---

## 5. Feature matrix (endpoints are from API_REFERENCE.md)

### 5.1 Dashboard / Overview — `features/dashboard`
- Pattern: deleted `pages/dashboards/default` + `app-stat` (shared/widget) + `ng-apexcharts`.
- Endpoints: `GET /api/nbr-taxi`, `/api/nbr-client`, `/api/nbr-DemandeEnattente`,
  `/api/nbr-NbrDemandeEncours`, `/api/NbrOffreEnattente`, `/api/NbrOffreEncours`, `/api/nbr-sms`.
  Activity feed: `GET /api/get-demande` and `GET /api/get-all-offres` (small page, newest first).
- Files: `dashboard.module.ts`, `dashboard-routing.module.ts`, `dashboard.component.{ts,html,scss}`,
  `dashboard.model.ts`. No new service — call Taxi/Client/Demande/Offre/Sms services.
- Gaps: "taxis online", "rides today" have no single documented endpoint → show documented
  counters + recent activity; those two counters → ROADMAP.

### 5.2 Taxis — `features/taxis`
- Pattern: salvaged sortable-table pipeline (searchable/sortable/paginated) + list→detail
  (like deleted `ecommerce/orders`, `invoices/*`).
- Endpoints: list `GET /api/get-all-taxis` (+ `/api/get-all-taxis-criteria`), detail
  `GET /api/get-taxis/{id}`, by phone `GET /api/taxi_byphone/{tel}`; rating summary
  `GET /api/taxis/{taxiId}/rating-summary`, `GET /api/taxis/by-phone/{phone}/rating-summary`;
  create `POST /api/add-taxi` (+ `/api/add-taxi-admin`, `/api/add-taxigps`, `/api/add-taxis`
  alias family — pick canonical, note aliases); update `PATCH /api/update-taxi/{id}`,
  `PUT /api/update_taxi_byphone/{phone}`; GPS `PATCH /api/update_gps/{taxiID}`; status
  `PATCH /api/updateTaxiStatus/status` (⚠ spec gap: no taxi identifier on the path/query — see
  API_REFERENCE ambiguity #2; prefer updating `taxiStatus` via `PATCH /api/update-taxi/{id}` when
  `TaxiDto.taxiStatus` exists, and note the gap in ROADMAP); check `GET /api/checkTaxiStatus/{phone}`,
  `GET /api/existByPhone/{phone}`; delete `DELETE /api/delete-taxi/{id}`; history
  `GET /api/history-traffic-taxi/{phone}/page`.
- Files: `taxis.module.ts`, `taxis-routing.module.ts`, `taxis-list.component.*`,
  `taxi-detail.component.*` (profile + rating summary + ride-history tab + approve/reject +
  GPS display), `taxi-form` (modal), `taxis.model.ts`; `core/services/taxi.service.ts`.
- Badges: `TAXI_STATUS` map.

### 5.3 Clients — `features/clients`
- Pattern: salvaged table pipeline + add/edit modal + delete confirm (like deleted
  `ecommerce/customers`).
- Endpoints: list `GET /api/get-allClients`, by phone `GET /api/get-clientbyphone/{telephone}` /
  `GET /api/get-Clientby-phone/{phone}`, detail `GET /api/get-client/{client-id}`; create
  `POST /api/add-client` (+ `/api/add-clientgps`, `/api/add_client_gps` aliases — note: no GPS
  fields in body per spec, do not invent them); update `PUT /api/update-client/{client_id}`,
  `PATCH /api/update-client-by-phone/{phone}`; delete `DELETE /api/delete-client/{client_id}`;
  history `GET /api/history-traffic-client/{phone}/page`.
- Files: `clients.module.ts`, `clients-routing.module.ts`, `clients-list.component.*`,
  `client-detail.component.*` (profile + delivery history), `clients.model.ts`;
  `core/services/client.service.ts`.

### 5.4 Demands & Offers — `features/demands-offers`
- Pattern: list + detail with timeline/status (like deleted `invoices/list` + `detail`); two tabs
  or two routes sharing the module.
- Demand endpoints: list `GET /api/get-demande` (+ 400/500 wrapper note — see API_REFERENCE
  ambiguity #3), by id `GET /api/get-demande/{id}`, by state `GET /api/get-listDemandeParEtat/{etat}`,
  state counts `GET /api/get-nombreDemandesParEtat/{etat}`, pending count
  `GET /api/nbr-DemandeEnattente`, in-progress `GET /api/nbr-NbrDemandeEncours`; create
  `POST /api/add-demande`; update `PUT /api/update-demande`; state changes
  `PUT /api/update-EtatDemande/{etat}`, `PUT /api/update-EtatDemandeAffectee/{etat}`
  (⚠ integration note from lanes: the implemented endpoint is
  `PUT /api/update-modifierEtatDemandeAffectee/{etat}` — `update-EtatDemandeAffectee` does
  not exist; ROADMAP),
  `PATCH /api/update-state-demands/{phone}` (body `{ "etat": "EXPIRED" }` — per spec description,
  untyped schema); cancel `DELETE /api/cancel-demande/{demandeId}`; delete
  `DELETE /api/delete-demande/{demande_id}`; ops watchdogs `PUT /api/update-annulerDemandes60minutes`,
  `PUT /api/update-traiterDemandesParSMSMasquerNumero`.
- Offer endpoints: list `GET /api/get-all-offres`, by id `GET /api/get-offreParId/{id}` /
  `GET /api/getOffresById/{id}`, by state `GET /api/get-listOffresParEtat/{etat}`, state counts
  `GET /api/nombreOffreParEtat/{etat}`, counts `GET /api/NbrOffreEnattente`,
  `GET /api/NbrOffreEncours`, en-cours by client `GET /api/offreEnCoursParClient/{id_client}`,
  matching `GET /api/offre_matching_client/{phone}`, `GET /api/offre_matching_taxi/{phone}`;
  create `POST /api/ajouterOffre`; update `PUT /api/update-offre`; state
  `PUT /api/update-EtatOffre` (body), `PUT /api/update-EtatOffre/{etat}` (path),
  `PATCH /api/update-state-offer/{id}/{offerStatusEnum}`, `PATCH /api/update_state_offre/{phone}`;
  route-text patch `PATCH /api/offers/{offreId}/route-text/{clientPhone}`; cancel
  `DELETE /api/cancel-offre/{offreId}`; delete `DELETE /api/delete-Offre/{id}`; watchdog
  `PUT /api/update-annulerOffres60minutes`.
- Files: `demands-offers.module.ts`, `demands-offers-routing.module.ts`, `demands-list.component.*`,
  `demand-detail.component.*`, `offers-list.component.*`, `offer-detail.component.*`,
  `demande.model.ts`, `offre.model.ts`; `core/services/demande.service.ts`,
  `core/services/offre.service.ts`.
- Actions: cancel (documented), state change (documented). **"Reassign" is not a documented
  concept** — expose the documented state/cancel actions; a true reassign flow → ROADMAP.
- Badges: `DEMANDE_STATUS`, `OFFRE_STATUS`.

### 5.5 Reservations — `features/reservations`
- Pattern: filterable table (etat/status filter) + detail modal.
- Endpoints: `GET /api/admin/reservations` (list, status filter), `GET /api/admin/reservations/by-taxi`,
  `GET /api/admin/reservations/{id}`, `PUT /api/admin/reservations/{id}`,
  `PUT /api/admin/reservations/{id}/assignment` (assign taxi), `DELETE /api/admin/reservations/{id}/assignment`
  (unassign), `POST /api/admin/reservations/with-assignment` (create+assign).
- Files: `reservations.module.ts`, `reservations-routing.module.ts`, `reservations-list.component.*`,
  `reservation-detail.component.*` (assign/unassign modal, source indicator), `reservation.model.ts`;
  `core/services/reservation.service.ts`.
- Badges: `RESERVATION_STATUS`, `ASSIGNMENT_STATUS` + `source` label map.

### 5.6 Ratings — `features/ratings`
- Pattern: simple list + per-driver cards.
- Endpoints: driver history `GET /taxi-client/api/ratings/driver/{driverId}`, average
  `GET /taxi-client/api/ratings/driver/{driverId}/average`, per-taxi summary
  `GET /api/taxis/{taxiId}/rating-summary`, `GET /api/taxis/by-phone/{phone}/rating-summary`;
  submit `POST /taxi-client/api/ratings` (service method only, no admin UI).
- Files: `ratings.module.ts`, `ratings-routing.module.ts`, `ratings-list.component.*`,
  `driver-ratings.component.*` (average + history + low-average highlight), `rating.model.ts`;
  `core/services/rating.service.ts`.
- Gap: no "flag low rating" endpoint → highlight UI only; flag action → ROADMAP.

### 5.7 SMS Log — `features/sms-log`
- Pattern: salvaged table pipeline + minimal modal form for injection.
- Endpoints: list `GET /api/get-all`, untreated `GET /api/get-listSMSnonTraites`, untreated by
  phone `GET /api/get-listSMSnonTraitesParTelephone/{numero_telephone}`, count `GET /api/nbr-sms`;
  update `PUT /api/update-sms`; delete `DELETE /api/delete-sms/{smsin_id}`; receive `POST /api/add-sms`
  (SmsReceived) / `POST /api/ajouter-sms` (SmsIn); **injection form → `POST /api/inject-sms`**;
  advanced `POST /api/rabbitMQSender`.
- Files: `sms-log.module.ts`, `sms-log-routing.module.ts`, `sms-list.component.*`
  (processed/unprocessed filter), `sms-inject.component.*` (form calling inject-sms),
  `sms.model.ts`; `core/services/sms.service.ts`.

### 5.8 SOS / Alerts — `features/sos`
- Pattern: alert-style panel (cards/list).
- Endpoints: the spec documents only `POST /api/sosNotification/{id}`.
- Files: `sos.module.ts`, `sos-routing.module.ts`, `sos-panel.component.*` (trigger via sosNotification
  + explanatory state), `sos.model.ts`; `core/services/sos.service.ts`.
- Gap: no SOS list / live feed / acknowledge endpoints → panel shows the documented trigger action;
  alert list + acknowledge → ROADMAP.

### 5.9 Settings — `features/settings`
- Pattern: reactive-forms pages with validation (template `form/validation` conventions).
- Endpoints: matching radius `GET /api/matching-config`, `PUT /api/matching-config` (+ `PATCH`
  alias), airport pricing `GET /api/airport-pricing`, `PUT`/`PATCH /api/airport-pricing`.
- Files: `settings.module.ts`, `settings-routing.module.ts`, `settings.component.*` (tabs:
  Matching radius / Airport pricing), `matching-config.model.ts`, `airport-pricing.model.ts`;
  `core/services/config.service.ts` (settings config only — the demo `ConfigService` dies with
  `pages/dashboards`).
- Validation: radius numeric ≥ 0; surchargeType `PERCENTAGE | FIXED_AMOUNT`; amounts ≥ 0.

---

## 6. Shared DTO models in `src/app/core/models/` (foundation lane)

Transcribed VERBATIM from API_REFERENCE.md (fields, types, optionality). Exact filenames:
`taxi.model.ts`, `client.model.ts`, `demande.model.ts`, `offre.model.ts`,
`reservation.model.ts`, `rating.model.ts`, `sms.model.ts`, `config.model.ts`,
`common.model.ts` (Pageable, ErrorResponseDto, MessageResponse, Cancel*ResponseDto,
ApiResponseDto* wrappers, Page* wrappers). Feature lanes import these — never redefine shared DTOs.

---

## 7. Status badge scheme (`core/constants/status-badges.ts`)

| Map key | Values → badge class (scheme) |
|---|---|
| `DEMANDE_STATUS` / `OFFRE_STATUS` | WAITING→warning, STARTED→info, IN_PROGRESS→info, TERMINATED→success, CANCELLED→danger, CANCELLED_BY_CLIENT→danger, CANCELLED_BY_TAXI→danger, EXPIRED→secondary |
| `TAXI_STATUS` | APPROVED→success, PENDING→warning, REJECTED→danger |
| `RESERVATION_STATUS` | CREATED→secondary, CONFIRMED→info, WAITING_DRIVER→warning, ASSIGNED→info, ACCEPTED→success, IN_PROGRESS→info, COMPLETED→success, CANCELLED→danger, EXPIRED→secondary |
| `ASSIGNMENT_STATUS` | PENDING→warning, ACTIVE→success, REPLACED→info, CANCELLED→danger, COMPLETED→success, EXPIRED→secondary |
| `SOURCE` (reservation) | WHATSAPP/SMS/MOBILE_APP/DASHBOARD → label-only text badges |

Helper: `statusBadge(key, map): { label: string, class: string }`. Use `badge-soft-*` classes if
they exist in the template SCSS, else `bg-*`; only if neither exists add `_app-status.scss`
(verified against `src/assets/scss/custom/components/_badge.scss` first).

---

## 8. Service conventions

- One service per resource, `providedIn: 'root'`, defined by the owning feature lane at
  `core/services/<resource>.service.ts` (e.g. `taxi.service.ts`). Dashboard reuses other lanes'
  services and must not redefine them.
- HttpClient injected directly; request paths are relative (`'/api/get-all-taxis'`,
  `'/taxi-client/api/ratings/driver/5'`) — the ApiBaseUrlInterceptor adds the base URL.
- Query params via `HttpParams`; typed `Observable<T>` returns with DTO types from `core/models`.
- Error handling: rely on the kept ErrorInterceptor; per-call `catchError` only when a component
  needs a specific `ErrorResponseDto` field (message/path).

---

## 9. Lane plan & sequencing (ownership / write scopes)

| # | Lane | Scope (files it may write) | Runs after |
|---|---|---|---|
| L1 | **Foundation** — strip demo, shell, env+interceptor, core/models, constants, salvage, guard fix | deletes `pages/**`, `cyptolanding/`, `assets/dashboard.json`; writes `environments/*`, `core/directives/sortable.directive.ts`, `core/utils/table-state.ts`, `core/models/*`, `core/constants/status-badges.ts`, `core/interceptors/api-base-url.interceptor.ts`; edits `app.module.ts`, `app-routing.module.ts`, `layouts/sidebar/menu.ts`, `core/guards/*`, LanguageService registration, (scss if badge class missing) | — |
| L2 | **Taxis** | `features/taxis/**`, `core/services/taxi.service.ts` | L1 |
| L3 | **Clients** | `features/clients/**`, `core/services/client.service.ts` | L1 |
| L4 | **Demands & Offers** | `features/demands-offers/**`, `core/services/demande.service.ts`, `core/services/offre.service.ts` | L1 |
| L5 | **Reservations + Ratings** | `features/reservations/**`, `features/ratings/**`, `core/services/reservation.service.ts`, `core/services/rating.service.ts` | L1 |
| L6 | **SMS Log + SOS + Settings** | `features/sms-log/**`, `features/sos/**`, `features/settings/**`, `core/services/sms.service.ts`, `core/services/sos.service.ts`, `core/services/config.service.ts` | L1 |
| L7 | **Dashboard** | `features/dashboard/**` (no service; uses other lanes' services — must not touch `core/`) | L1 |
| L8 | **Integration** — wire routes + menu, ROADMAP.md, build gate | `app-routing.module.ts`, `layouts/sidebar/menu.ts`, `app.module.ts` (final trim), `src/app/**` for error fixes, `docs/ROADMAP.md` | L2–L7 |

Feature lanes (L2–L7) may READ anything but may only WRITE paths in their own scope. L2–L7 never
touch `core/models`, `core/constants`, `core/directives`, `core/utils`, `environments/`,
`app.module.ts`, `app-routing.module.ts`, or `menu.ts` (L1/L8 own those).

---

## 10. Verification gates

1. L1 report: final shell routing shape, exact `core/models` inventory, badge map export names,
   list of deleted folders, salvage results. Orchestrator spot-checks 2–3 files.
2. L2–L7 reports: module class names + route paths (for L8), endpoint coverage per feature, and
   any spec gaps → collected into ROADMAP. Orchestrator spot-checks one file per lane.
3. L8: `ng build` (in `Admin/`) until green; verify every new route resolves to a real module;
   verify `menu.ts` has no dead links; write `docs/ROADMAP.md` (seeds + all collected gaps).
4. Final orchestrator pass: re-run `ng build`, grep for dangling references to deleted
   `pages/`/`cyptolanding` imports, confirm `docs/IMPLEMENTATION_PLAN.md`,
   `docs/ROADMAP.md`, and all feature folders exist.

---

## 11. ROADMAP seeds (foundation; L8 extends with collected gaps)

- Real JWT auth wiring (`/jwt-authentication` not documented in the OpenAPI spec — confirm shape
  with backend team before building).
- "Taxis online" and "rides today" counters (no single documented endpoint).
- SOS alert list / live feed / acknowledge action (only `POST /sosNotification/{id}` documented).
- Rating flag/low-rating workflow (no endpoint).
- Demand/Offer "reassign" semantics (only state-change + cancel documented).
- Push-notification config; driver earnings reports; zone-based pricing rules; audit log of
  manual admin actions.
- Backend confirmation of the port/base-path discrepancy (`:8577` vs `:8777/taxi-client`) and
  prod base URL.
- Prune unused npm dependencies (fullcalendar, ckeditor, firebase, leaflet, etc. if unused).