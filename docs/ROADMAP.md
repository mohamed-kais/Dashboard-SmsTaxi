# SMS Taxi Ops Dashboard — ROADMAP

Consolidated follow-ups from every feature lane (L2–L7) plus the foundation seeds
(IMPLEMENTATION_PLAN §11). Everything here is a **documented gap**: it was either
not covered by the backend OpenAPI spec (`docs/API_REFERENCE.md`) or deliberately
implemented with a proxy/UI-only behavior. Nothing in this file blocks the current
build; the dashboard is fully functional against the documented endpoints.

---

## 1. Backend / API confirmations needed

These are cases where code was written against the closest documented
interpretation and the backend team should confirm the real contract.

- **Real JWT auth** — the spec declares no `securitySchemes` and no
  `/jwt-authentication` endpoint. FakeBackend + AccountModule are kept and working;
  wire the real login endpoint once provided.
- **Base URL / port discrepancy** — observed working base
  `http://41.225.11.231:8577` vs spec-declared servers
  `http://41.225.11.231:8777/taxi-client` and `https://api.example.com`.
  `environment.apiBaseUrl` is the single swap point (`src/environments/`).
  Confirm the prod base URL and set `environment.prod.ts`.
- **Reservations assignment** — assignment endpoints return `ReservationResponse`
  per the API spec; the frontend also models `ReservationAssignmentResponse`.
  Confirm which response the live backend actually returns for
  `PUT/DELETE /api/admin/reservations/{id}/assignment` and
  `POST /api/admin/reservations/with-assignment`.
- **Taxis status update** — `PATCH /api/updateTaxiStatus/status` carries **no taxi
  identifier** on path/query (spec gap). Approve/reject instead writes
  `taxiStatus` via `PATCH /api/update-taxi/{id}`. Confirm this is the intended path.
- **Taxis search** — `GET /api/get-all-taxis` has no search params; the search box
  uses `GET /api/get-all-taxis-criteria` instead. Confirm query parameter names.
- **Demands state change** — `PUT /api/update-EtatDemande/{etat}` body shape:
  currently sent `{ id, etat }`. Confirm the DTO the backend expects.
- **Demands affected-state endpoint name** — plan §5.4 listed
  `PUT /api/update-EtatDemandeAffectee/{etat}` which **does not exist**; the
  implemented endpoint is `PUT /api/update-modifierEtatDemandeAffectee/{etat}`
  (IMPLEMENTATION_PLAN §5.4 corrected in L8).
- **Offers state change** — `PATCH /api/update_state_offre/{phone}` currently sends
  a full `OffreDto` because the spec schema is the full DTO; the endpoint
  description suggests a minimal payload. Confirm what is actually required.
- **Demand detail client embedding** — `GET /api/get-demande/{id}`: the `Demande`
  entity has no `client` relation in the spec, so the detail page renders
  defensively. Confirm whether the backend embeds client info.
- **SMS update body** — `PUT /api/update-sms` is typed `SmsIn` (id required) while
  the spec DTO `SmsInDto` is all-optional. Confirm which body shape the backend
  accepts.
- **Config endpoints "compatibility" aliases** — `PUT` was chosen over the `PATCH`
  aliases for `matching-config` and `airport-pricing`. Confirm the canonical verb.
- **matching-config response** — endpoint response is untyped in the spec; the
  settings page uses a defensive index-signature type. **RESOLVED (runtime verify
  2026-09-22):** the live backend returns `baseDistanceMeters` / `maxDistanceMeters`
  / `hardMaxMeters` and accepts `PUT` with `baseDistanceMeters` /
  `maxDistanceMeters`; the frontend now maps those names (§1a).
- **processSmsMasquer semantics** — service-only method
  (`PUT /api/update-traiterDemandesParSMSMasquerNumero`); behavior unconfirmed,
  not exposed in UI.
- **SMS injection reply** — `POST /api/inject-sms` returns `MessageResponse`
  (confirmed); `POST /api/rabbitMQSender` is advanced wiring, service-only.

### 1a. Runtime-verified findings (live backend `41.225.11.231:8577`, 2026-09-22)

Confirmed against the running server during the runtime smoke test; frontend
already degrades gracefully for all of these:

- **`GET /api/get-demande` returns HTTP 500** —
  `{"success":false,"message":"Internal server error while searching demandes"}`
  for every parameter combination tested (none, `sort=date_depot,desc`,
  `sort=dateDepot,desc`). Demands list/feed pages show a graceful error state;
  no crash. Backend needs to fix the demands search query.
- **Ratings history vs summary disagree** — driver #20 (phone 92569444):
  `GET /api/taxis/{id}/rating-summary` and `/by-phone/{phone}/rating-summary`
  report `{rating: 3.34, average: 3.33, count: 12}`, but
  `GET /taxi-client/api/ratings/driver/20` returns `[]` and
  `.../driver/20/average` returns `0.0`. The ratings detail page renders the
  (empty) history truth; backend aggregation is inconsistent.
- **Taxis detail history route strings truncated** — ride-history rows for
  expired/cancelled fares show `… → ?` (offer route fields empty in first pages);
  data quality on the backend, rendering is defensive.
- **Envelope shapes confirmed** — bare Spring `Page`: `get-all-taxis`,
  `admin/reservations`; bare arrays: `get-allClients`, `get-all` (SMS); bare
  objects: `matching-config`, `airport-pricing`; wrapped `{success,message,data}`:
  `get-all-offres` / `get-allOffre` (frontend unwraps in `offre.service.ts`).

## 2. Missing endpoints to request

Features that could not be built because the spec has no endpoint for them.

- **"Taxis online" and "rides today"** — no documented single endpoint → both
  dashboard cards were omitted (dashboard shows the documented counters instead).
- **Per-day / historical activity** — no endpoint → no trend charts on the
  dashboard.
- **SOS list / acknowledge / history** — only `POST /api/sosNotification/{id}`
  exists; the SOS panel is trigger + reference only (no fake data).
- **Ratings: list all drivers** — no "list all drivers with ratings" endpoint →
  ratings page is lookup-based (enter phone/id).
- **Ratings: low-rating flag / report** — no flag/report endpoint → UI-only
  highlight + `console.info`, no API call.
- **Reservations server-side free-text search** — no query param; search is
  client-side over the currently loaded page only.
- **Taxis server-side `taxiStatus` filter** — list endpoints expose no status
  filter; dropdowns filter the loaded page only.
- **Client/Demand history without phone** — history endpoints
  (`/api/history-traffic-*`) are phone-keyed; clients/taxis without a phone have
  no history to show.
- **Per-state timestamps** — no per-state timestamp fields → status cards, not
  timelines.

## 3. Frontend follow-ups

- **npm dependency pruning** — demo-only deps remain in `package.json`
  (fullcalendar, ckeditor, firebase, leaflet, etc. if unused); Feather icon sheet
  unused. Remove after confirming nothing references them.
- **RTL theme** — not wired.
- **app-loader is global-only** — no per-page spinner inputs; feature pages use
  local spinners where needed.
- **Sort keys on demands/offers lists** — limited to documented fields
  (`date_depot`, `id`, `etat`).
- **ClientDto has no `name`** — `add-client` accepts a name but responses carry no
  name field; rendered defensively. Confirm with backend whether responses should
  include it.
- **`get-allClients` returns a bare array** — client-side paging implemented; if
  the backend later pages, switch to server-side.
- **Sidebar/`SharedModule` notes (L8)** — `SharedModule` previously had no
  `exports` array; it now re-exports `UIModule` + `WidgetModule`. `NgbdSortableHeader`
  is declared exactly once in `UIModule`; if any feature module is ever made eager,
  keep that single shared declaration.

## 4. Seeds (from plan §11)

Foundation seeds to design against the real backend later:

- **Push-notification configuration** — no endpoint in the spec.
- **Driver earnings reporting** — no earnings aggregation endpoint.
- **Zone-based pricing** — only a global matching radius + airport pricing exist.
- **Admin audit log** — no audit endpoint for manual admin actions (state changes,
  approve/reject, settings edits). Currently only client-side `console.info` traces
  exist.
- **Demand/Offer "reassign" semantics** — only documented state-change + cancel
  exist; a true reassign flow needs backend support (see §2 for related gaps).