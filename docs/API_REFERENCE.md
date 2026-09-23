# SMS Taxi API — Reference

> Source: `/tmp/opencode/openapi-v3.json` (OpenAPI 3.0.1, title "SMS Taxi API", version 1.0.0).
> **Core taxi booking and fleet management API. Serves mobile apps, web frontend, and admin dashboard.**
> This reference is written for frontend engineers building API service calls (e.g. the "Dashboard_Select" Angular app). 126 operations over 121 paths, 51 component schemas.

---

## 1. Base URLs & Conventions

### Base URLs

| Label | URL | Notes |
|---|---|---|
| Spec server 1 ("Development") | `http://41.225.11.231:8777/taxi-client` | Declared in the spec's `servers` block. Note the trailing base path `/taxi-client`. |
| Spec server 2 ("Production") | `https://api.example.com` | Declared in the spec's `servers` block. Clearly a placeholder. |
| User-observed dev base | `http://41.225.11.231:8577` | Observed in practice while the spec was being served. **Discrepancy, unresolved:** the spec declares port `8777` with base path `/taxi-client`; the observed dev server runs on port `8577` with no base path. When in doubt, ask the backend team which is current. |

Note: all paths in this document are given as declared in the spec (e.g. `POST /api/add-taxi`). Some endpoints are declared under a `/taxi-client/api/...` prefix (see Ratings) — that prefix is part of the path, do not add it again if you use the spec's first server URL.

### Global conventions

**State enums.** The spec uses a single shared English status enum for Demande *and* Offre `etat`/`etatOffre` (identical set on both entities, in path params, query filters and DTOs):

```
TERMINATED, WAITING, IN_PROGRESS, STARTED, CANCELLED,
CANCELLED_BY_CLIENT, CANCELLED_BY_TAXI, EXPIRED
```

> ⚠️ The description of `GET /api/get-listDemandeParEtat/{etat}` literally says *"State (e.g. WAITING, EN_COURS)"* but the declared enum is `IN_PROGRESS` — the doc example uses a stale French value. Use the enum above.

Other enums defined in the spec:

| Enum | Values | Where |
|---|---|---|
| `type` (channel) | `GSM, SMART, WHATSAPP, WHATSAPP_AR` | Offre/Taxi/Client type fields, taxis' `type` |
| `taxiStatus` | `APPROVED, PENDING, REJECTED` | Taxi status (approval workflow) |
| `channelPreference` | `SMART_ONLY, GSM_ONLY, BOTH` | `Taxi.channelPreference` (entity schema only) |
| `surchargeType` | `PERCENTAGE, FIXED_AMOUNT` | Airport pricing config |
| Reservation `status` | `CREATED, CONFIRMED, WAITING_DRIVER, ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED` | Reservation admin endpoints |
| Assignment `status` | `PENDING, ACTIVE, REPLACED, CANCELLED, COMPLETED, EXPIRED` | `ReservationAssignmentResponse.status` |
| `assignmentType` | `AUTO, MANUAL` | Reservation assignment |
| Reservation `source` | `WHATSAPP, SMS, MOBILE_APP, DASHBOARD` | `ReservationRequest.source` |
| `language` | `FR, AR` | Reservation `language` |
| `direction` | `ASC, DESC` | History paging `direction` (default `DESC`) |

**Error shape — `ErrorResponseDto`** (used for 400/404/409/500 responses on Clients, Demands and Taxis):

```jsonc
{
  "success":      boolean,
  "code":         string,
  "timestamp":    "2026-01-20T10:30:00Z",   // date-time
  "status":       integer,                  // HTTP status
  "error":        string,
  "message":      string,
  "path":         string,
  "requestId":    string,
  "validationErrors": { fieldName: string } // per-field validation messages
}
```

**Message envelope — `MessageResponse`:** `{ "message": string }` (used by `/api/inject-sms`).

**Cancel envelope — `CancelBookingResponseDto`:**
`success, message, cancelledCount, timestamp, cancelledOffers(OffreDto[]), cancelledBy, previousStatus(enum), newStatus(enum)`.

**Cancel-demande envelope — `CancelDemandeResponseDto`:** `success, message, demandeId, timestamp, cancelledDemande(DemandeDto), cancelledBy, previousStatus, newStatus`.

**`ApiResponseDto` wrappers.** A few endpoints are wrapped in an envelope that **repeats the payload fields twice**: envelope fields (`success, code, message, timestamp, path, requestId`) *plus* `data` (the real payload). Declared variants:

- `ApiResponseDtoTaxiDto` — wraps `TaxiDto` (`data`) but also inlines the taxi fields at the top level. The spec actually declares this schema for 400/409/500 of `POST /api/add-taxis` and 200 returns plain `TaxiDto`.
- `ApiResponseDtoPageOffreAdminDto` / `ApiResponseDtoPageDemandeAdminDto` — wraps a Spring `Page` (flattened paging fields `content, totalElements, totalPages, number, size, sort, pageable, first, last, numberOfElements, empty` **and** `data: PageOffreAdminDto` / `PageDemandeAdminDto` which repeats the same paging fields). Declared for 400/500 of the two admin search endpoints; the 200 responses declare the bare page DTOs (see ambiguity notes under each endpoint).

**Pagination pattern.** Two distinct pagination styles are used — check each endpoint:

1. Spring Page style (0-based `page`, `size`, `sort`): `/api/get-all-taxis`, `/api/get-all-taxis-criteria`, `/api/get-demande`, `/api/get-allOffre`, `/api/get-all-offres`, admin reservations. Response = Spring `Page` shape (`content`, `totalElements`, `totalPages`, `number`, `size`, `sort`, `pageable`, `first`, `last`, `numberOfElements`, `empty`), possibly wrapped in an `ApiResponseDto*` envelope.
2. OffreHistory style (1-based `page` with `limit`, default page=`1`, limit=`20`): `/api/history-traffic-taxi/{phone}/page`, `/api/history-traffic-client/{phone}/page`. Response = `OffreHistoryPageDto` — `{ page (1-based), limit, total, items: OffreDto[] }`.

`Pageable` object schema: `{ page (int, 0-based), size (int ≥1), sort (string[]) }` — also referenced as a *query parameter* (spec quirk) on `/api/get-demande` and the admin reservation endpoints; in practice you send `page`, `size`, `sort` as flat query params.

**Auth / security.** The spec declares **no `securitySchemes` and no `security` requirements anywhere**. Do not invent a bearer/API-key scheme. If the deployed backend enforces auth, the spec does not document it.

---

## 2. Quick Reference

### Taxis (21)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/add-taxi` | Register a new taxi; returns created taxi with ID |
| POST | `/api/add-taxi-admin` | Admin endpoint to add a taxi |
| POST | `/api/add-taxigps` | Register taxi with location/destination (smartphone flow) |
| POST | `/api/add-taxis` | Add taxi (alt); 201 on success, 409 if phone exists |
| GET | `/api/get-taxi` | List all taxis |
| GET | `/api/get-taxi/{tel}` | List all taxis for a phone number |
| GET | `/api/get-taxinbyphone/{telephone}` | Alt path: list taxis by phone (alias of `get-taxi/{tel}`) |
| GET | `/api/taxi_byphone/{tel}` | Get *single* taxi by phone (differs: returns one, not a list) |
| GET | `/api/get-taxis/{id}` | Get taxi by ID |
| GET | `/api/existByPhone/{phone}` | `true` if a taxi exists for the phone |
| GET | `/api/checkTaxiStatus/{phone}` | `true` if taxi has `APPROVED` status for the phone |
| GET | `/api/nbr-taxi` | Total number of taxis (int32) |
| GET | `/api/taxis/{taxiId}/rating-summary` | Aggregate rating + history stats for a taxi |
| GET | `/api/taxis/by-phone/{phone}/rating-summary` | Rating summary looked up by phone |
| GET | `/api/get-all-taxis` | Paginated list of taxis (page/size/sort; 0-based), cached |
| GET | `/api/get-all-taxis-criteria` | Paginated list with criteria filters (phone, name) |
| PUT | `/api/update_taxi_byphone/{phone}` | Update taxi profile by phone number |
| PATCH | `/api/update-taxi/{id}` | Update taxi profile by ID |
| PATCH | `/api/update_gps/{taxiID}` | Update taxi location (lat, lng, bearing) by taxi ID |
| PATCH | `/api/updateTaxiStatus/status` | Update taxi status (`APPROVED/PENDING/REJECTED`) — path has no taxi identifier (see ambiguities) |
| DELETE | `/api/delete-taxi/{id}` | Delete taxi by ID |

### Clients (12)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/add-client` | Register a new client (sign-up) |
| POST | `/api/add-clientgps` | Create client with GPS data (app has initial coordinates) |
| POST | `/api/add_client_gps` | Alt path for the same "add client" use case |
| GET | `/api/get-client/{client-id}` | Get single client by ID |
| GET | `/api/get-Clientby-phone/{phone}` | Get single client by phone (login/session lookup) |
| GET | `/api/get-Clientnumero_telephone/{numero_telephone}` | All clients matching a telephone (may be multiple) |
| GET | `/api/get-clientbyphone/{telephone}` | Alt path, same as above (list by telephone) |
| GET | `/api/get-allClients` | All clients (admin/bulk) |
| GET | `/api/nbr-client` | Total number of clients (int32; admin stats) |
| PUT | `/api/update-client/{client_id}` | Update a client profile by ID |
| PATCH | `/api/update-client-by-phone/{phone}` | Update client location and/or destination by phone |
| DELETE | `/api/delete-client/{client_id}` | Delete a client by ID |

### Demands (20)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/add-demande` | Create a ride request (demande) |
| GET | `/api/get-demande` | Admin: paginated, filterable list of demands |
| GET | `/api/get-demande/{id}` | Get a demande by ID |
| GET | `/api/get-listDemandeParEtat/{etat}` | Demands filtered by state |
| GET | `/api/get-listDemandeParClient/{id}` | Demands for a client ID |
| GET | `/api/get-nombreDemandesParEtat/{etat}` | Count of demandes for a state |
| GET | `/api/get-indicationPositionEnAttente/{id}` | Boolean: is position indication waiting for this demande? |
| GET | `/api/get-findByEtat` | Demandes with `WAITING` state |
| GET | `/api/get-demandeParEtat` | One demande with `WAITING` state (or null) |
| GET | `/api/nbr-derniereDemandeEnCoursParClient/{client_id}` | Last in-progress demande for a client |
| GET | `/api/nbr-NbrDemandeEncours` | Count of demandes in progress |
| GET | `/api/nbr-DemandeEnattente` | Count of demandes in waiting state |
| PUT | `/api/update-demande` | Update an existing demande (full body) |
| PUT | `/api/update-EtatDemande/{etat}` | Update demande state (path value) |
| PUT | `/api/update-modifierEtatDemandeAffectee/{etat}` | Update demande state (affectee variant) |
| PATCH | `/api/update-state-demands/{phone}` | Update demande state for a client phone; body `{ "etat": "EXPIRED" }` |
| PUT | `/api/update-annulerDemandes60minutes` | Batch-cancel demandes older than 60 minutes |
| PUT | `/api/update-traiterDemandesParSMSMasquerNumero` | Process demandes for SMS "masquer numero"; DB side effect |
| DELETE | `/api/cancel-demande/{demandeId}` | Cancel a demande (cancelledByTaxi flag) |
| DELETE | `/api/delete-demande/{demande_id}` | Delete a demande by ID |

### Offers (40)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ajouterOffre` | Create a new offer |
| PUT | `/api/update-offre` | Update an existing offer (full Offre) |
| DELETE | `/api/delete-Offre/{id}` | Delete offer by ID |
| GET | `/api/get-allOffre` | Admin: paginated, filterable offers search (equivalent to get-all-offres) |
| GET | `/api/get-all-offres` | Admin: identical duplicate of get-allOffre |
| GET | `/api/get-offreParId/{id}` | Get offer by ID |
| GET | `/api/getOffresById/{id}` | Get offer(s) by ID (same purpose as above) |
| GET | `/api/get-listOffresParEtat/{etat}` | Offers filtered by state |
| GET | `/api/get-listOffreParTaxi/{id}` | Offers for taxi ID |
| GET | `/api/get-listOffreParTaxiphone/{tel}` | Offers for taxi phone |
| GET | `/api/findOffreByTaxiTelephone/{tel}` | Offer for taxi phone (single/related) |
| GET | `/api/offre_matching_taxi/{phone}` | Current matched offer for a taxi phone (204 if none) |
| GET | `/api/offre_matching_client/{phone}` | Current matched offer for a client phone (204 if none) |
| GET | `/api/offreEnCoursParClient/{id_client}` | Current offer for client ID (or null) |
| GET | `/api/nombreOffreParEtat/{etat}` | Count of offers for a state (int64) |
| GET | `/api/nbrOffreByTaxi` | Offer count per taxi (int64) |
| GET | `/api/nbr-taxi`→ *see Taxis* | — |
| GET | `/api/NbrOffreEncours` | Count of offers in progress |
| GET | `/api/NbrOffreEnattente` | Count of offers in waiting state |
| GET | `/api/Nbroffre_valider/{phone}` | Count of validated offers for a taxi phone |
| GET | `/api/listTaxiParNbrOffreNonValide` | Taxis with non-validated offer counts |
| GET | `/api/history-traffic-taxi/{phone}` | 🟡 DEPRECATED — taxi offer/traffic history → use `/page` variant |
| GET | `/api/history-traffic-taxi/{phone}/page` | Paginated taxi history + filters (q, from/to, month/year, status) |
| GET | `/api/history-traffic-client/{phone}` | 🟡 DEPRECATED — client offer/traffic history → use `/page` variant |
| GET | `/api/history-traffic-client/{phone}/page` | Paginated client history + filters |
| PATCH | `/api/offers/{offreId}/route-text/{clientPhone}` | Patch offer pickup/destination labels (TGPS flow, no geocoding) |
| PATCH | `/api/offers/{offreId}/ratings` | Submit/update rating for an offer |
| PATCH | `/api/location/update/{id}` | Update offer location by offer ID |
| PUT | `/api/update-EtatOffre` | Update offer state (state in body) |
| PUT | `/api/update-EtatOffre/{etat}` | Update offer state (state in path) |
| PUT | `/api/update-EtatOffreAffectee/{etat}` | Update offer state (affectee variant) |
| PATCH | `/api/update-state-offer/{id}/{offerStatusEnum}` | Update offer state by offer ID + enum |
| PATCH | `/api/update_state_offre/{phone}` | Update offer state for a client phone |
| PUT | `/api/update-annulerAffectationOffre/{phone}` | Cancel offer assignment for a taxi phone |
| PUT | `/api/update-annulerOffres60minutes` | Batch-cancel offers older than 60 minutes |
| DELETE | `/api/cancel-offre/{offreId}` | Cancel an offer by ID |
| DELETE | `/api/cancel-booking/{id}` | 🟡 DEPRECATED — legacy cancelBooking by ID |
| DELETE | `/api/cancel-booking/taxi/{phone}` | Cancel booking by taxi phone |
| DELETE | `/api/cancel-booking/taxi/id/{taxiId}` | Cancel all active bookings for taxi ID |
| DELETE | `/api/cancel-booking/client/{phone}` | Cancel all active bookings for client phone |
| DELETE | `/api/cancel-booking/client/id/{clientId}` | Cancel all active bookings for client ID |

### Ride Offers (6)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ride-offers/accept` | Taxi accepts broadcast offer — first-come-first-served via Redis |
| POST | `/api/ride-offers/reject` | Taxi rejects offer; stays active for other taxis |
| POST | `/api/ride-offers/gsm/accept` | GSM (Flutter) accept — same Redis logic as `/accept` |
| POST | `/api/ride-offers/gsm/reject` | GSM (Flutter) reject — same logic as `/reject` |
| POST | `/api/ride-offers/broadcast-gsm` | Broadcast GSM client demands via SMS only |
| GET | `/api/ride-offers/health` | Liveness check `{ status, service }` |

### Ratings (3)

| Method | Path | Purpose |
|---|---|---|
| POST | `/taxi-client/api/ratings` | Submit driver rating from client (call after ride completion) |
| GET | `/taxi-client/api/ratings/driver/{driverId}` | All ratings for a driver |
| GET | `/taxi-client/api/ratings/driver/{driverId}/average` | Average rating for a driver (double) |

### SMS In (9)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/add-sms` | Add incoming SMS, Kannel/receiver format (`SmsReceived`) |
| POST | `/api/ajouter-sms` | Add SMS, taxiMate format (`SmsIn`) |
| POST | `/api/rabbitMQSender` | Publish SMS (`SmsOut`) to RabbitMQ queue `sms-out` |
| GET | `/api/get-all` | List all SMS |
| GET | `/api/get-listSMSnonTraites` | SMS not yet processed |
| GET | `/api/get-listSMSnonTraitesParTelephone/{numero_telephone}` | Untreated SMS for one phone |
| GET | `/api/nbr-sms` | Total number of SMS (int32) |
| PUT | `/api/update-sms` | Update existing SMS (SmsIn with id) |
| DELETE | `/api/delete-sms/{smsin_id}` | Delete SMS by ID |

### Matching Config (2)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/matching-config` | Current base/max matching radius (meters), max capped 5000m |
| PUT | `/api/matching-config` | Update base/max radius; only provided fields updated |

### Airport Pricing Config (3)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/airport-pricing` | Current surcharge value/type, detection radius, airport list |
| PATCH | `/api/airport-pricing` | Update surcharge/radius; only provided fields updated |
| PUT | `/api/airport-pricing` | Alias of PATCH (declared "pour compatibilité Dashboard") |

### SOS (1)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/sosNotification/{id}` | Trigger SOS notification for taxi by ID; sends SMS |

### Ride Cancellation (1)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/rides/cancel` | Mobile-app ride cancellation; same backend logic as SMS cancellation |

### Injection (1)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/inject-sms` | Inject SMS into DB (testing / external SMS gateway) |

### reservation-admin-controller (7)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/reservations` | List reservations (status filter + paging) |
| GET | `/api/admin/reservations/{id}` | Reservation by ID |
| PUT | `/api/admin/reservations/{id}` | Update reservation fields |
| PUT | `/api/admin/reservations/{id}/assignment` | Assign a taxi to the reservation |
| DELETE | `/api/admin/reservations/{id}/assignment` | Unassign taxi (optional cancelledBy + reason) |
| POST | `/api/admin/reservations/with-assignment` | Create reservation with an initial assignment |
| GET | `/api/admin/reservations/by-taxi` | List reservations by taxi (taxiId or telephone) |

---

## 3. Taxis

*Fleet management: add, update, delete, list taxis. GPS updates, status checks.*

### `POST /api/add-taxi`

Create taxi. Body is `TaxiCreateDto`. Success returns plain `TaxiDto`.

**Request body — `TaxiCreateDto`** (telephone required):

| Field | Type | Req | Notes |
|---|---|---|---|
| telephone | string | ✅ | pattern `^[0-9+\-\s()]+$` |
| contenu | string | | maxLength 1000 |
| nom | string | | maxLength 100 |
| numeroMatricule | string | | maxLength 50 |
| numeroCin | string | | maxLength 20 |
| constructeur | string | | maxLength 50 |
| numeroTaxi | string | | maxLength 20 |
| email | string | | |
| type | string | | enum `GSM, SMART, WHATSAPP, WHATSAPP_AR` |
| destination | string | | maxLength 500 |
| location | string | | maxLength 500 |
| taxiStatus | string | | enum `APPROVED, PENDING, REJECTED` |

**Responses:** 200 → `TaxiDto` (created); 400 → `TaxiDto` (Bad request); 500 → `TaxiDto`. Note spec-declared response schemas are `TaxiDto` even on errors; there is no declared `ErrorResponseDto` here.

### `POST /api/add-taxi-admin`

Admin variant of add-taxi. **Body:** `TaxiCreateDto` (same as above). **Responses:** 200 → `TaxiDto`; 400 → `TaxiDto`; 500 → `TaxiDto`.

### `POST /api/add-taxigps`

Register taxi with location/destination (smartphone flow). **Body:** `TaxiCreateDto`. **Responses:** 200 → `TaxiDto`; 400 → `TaxiDto`; 500 → `TaxiDto`.

### `POST /api/add-taxis`

Alt add-taxi. "Returns 201 on success. Conflict if phone exists."

**Body:** `TaxiCreateDto`. **Responses:** 201 → `TaxiDto` (added); 400 → `ApiResponseDtoTaxiDto` (envelope: `success, code, message, timestamp, path, requestId` + flattened taxi fields + `data: TaxiDto`); 409 → `ApiResponseDtoTaxiDto` (taxi already exists); 500 → `ApiResponseDtoTaxiDto`.

### `GET /api/get-taxi`

List all taxis. **Responses:** 200 → `TaxiDto[]`; 500 → `TaxiDto[]`.

### `GET /api/get-taxi/{tel}`

All taxis for a phone number. **Path params:** `tel` (string, required — phone number, e.g. `0612345678`). **Responses:** 200 → `TaxiDto[]`; 500 → `TaxiDto[]`. *(Alias of `get-taxinbyphone/{telephone}`.)*

### `GET /api/get-taxinbyphone/{telephone}`

Alt path — "Same as get-taxi/{tel}: list taxis by phone." **Path params:** `telephone` (string, required). **Responses:** 200 → `TaxiDto[]`; 500 → `TaxiDto[]`. *(Alias of `get-taxi/{tel}`.)*

### `GET /api/taxi_byphone/{tel}`

Single taxi by phone. **Path params:** `tel` (string, required — "Phone number"). **Responses:** 200 → `TaxiDto`; 404 → `TaxiDto`; 500 → `TaxiDto`. Note: unlike the two endpoints above this one returns a **single** object, not an array — treat response types as distinct.

### `GET /api/get-taxis/{id}`

**Path params:** `id` (int32, required — taxi ID). **Responses:** 200 → `TaxiDto`; 404 → `TaxiDto`; 500 → `TaxiDto`.

### `GET /api/existByPhone/{phone}`

**Path params:** `phone` (string, required). **Responses:** 200 → boolean; 500 → boolean.

### `GET /api/checkTaxiStatus/{phone}`

**Path params:** `phone` (string, required). **Responses:** 200 → boolean (`true` = APPROVED); 500 → boolean.

### `GET /api/nbr-taxi`

**Responses:** 200 → integer (int32 count).

### `GET /api/taxis/{taxiId}/rating-summary`

"Best practice for taxi apps: returns current aggregate rating (Taxi.rating) plus rating history stats (count + average)." **Path params:** `taxiId` (int32, required). **Responses:** 200 → `TaxiRatingSummaryDto`; 404 → `TaxiRatingSummaryDto`; 500 → `TaxiRatingSummaryDto`.

`TaxiRatingSummaryDto`: `taxiId (int32), telephone, rating (double, aggregate on Taxi), average (double, from history table), count (int64)`.

### `GET /api/taxis/by-phone/{phone}/rating-summary`

Same summary, looked up by phone. **Path params:** `phone` (string, required; spec example `21692569444`). **Responses:** 200 → `TaxiRatingSummaryDto`; 404 → `TaxiRatingSummaryDto`; 500 → `TaxiRatingSummaryDto`.

### `GET /api/get-all-taxis`

Paginated list (0-based `page`, `size`, `sort`). "Search responses may be cached for performance; cache is automatically evicted on taxi create/update/delete."

**Query params:**

| Name | Type | Req | Notes |
|---|---|---|---|
| page | int32 | | default 0 |
| size | int32 | | default 10 |
| sort | string[] | | default `["id","asc"]`, example `id,asc` |

**Responses:** 200 → `PageGetAllTaxisDtoResponse` (Spring Page of `GetAllTaxisDtoResponse`: `content[], totalElements, totalPages, number, size, sort, pageable, first, last, numberOfElements, empty`); 400 → `ErrorResponseDto`; 500 → `PageGetAllTaxisDtoResponse`.

`GetAllTaxisDtoResponse`: `id, contenu, telephone, traitement, nom, numeroMatricule, numeroCin, constructeur, numeroTaxi, email, type, taxiStatus, rating`.

### `GET /api/get-all-taxis-criteria`

Paginated list with filters. **Query params:**

| Name | Type | Req | Notes |
|---|---|---|---|
| page | int32 | | default 0 |
| size | int32 | | default 10 |
| sort | string | | default `[{"field":"phone","direction":"desc"}]` (JSON string) |
| phone | string | | filter |
| name | string | | filter |

**Responses:** 200 → `PageGetAllTaxisDtoResponse`; 400 → `ErrorResponseDto`; 500 → `PageGetAllTaxisDtoResponse`.

### `PUT /api/update_taxi_byphone/{phone}`

Update taxi profile by phone number. **Path params:** `phone` (string, required, example `0612345678`). **Body:** `TaxiDto` (required). **Responses:** 200 → `TaxiDto`; 404 → `TaxiDto`; 500 → `TaxiDto`.

### `PATCH /api/update-taxi/{id}`

Update taxi profile by ID. **Path params:** `id` (int32, required). **Body:** `TaxiCreateDto` (required). **Responses:** 200 → `TaxiDto`; 404 → `TaxiDto`; 500 → `TaxiDto`.

### `PATCH /api/update_gps/{taxiID}`

Update taxi location (lat, lng, bearing). **Path params:** `taxiID` (int32, required). **Body — `LocationUpdateDto`** (required): `latitude` (double, required, −90…90), `longitude` (double, required, −180…180), `bearing` (double).

**Responses:** 200 → `LocationUpdateDto`; 400 → `LocationUpdateDto`; 404 → `LocationUpdateDto`; 500 → `LocationUpdateDto`. (Error responses declare `LocationUpdateDto` too — spec quirk.)

### `PATCH /api/updateTaxiStatus/status`

Update taxi status by phone — but **no phone/id parameter exists in the spec** (see Ambiguities). **Query params:** `taxiStatus` (string, required, enum `APPROVED, PENDING, REJECTED`). **Responses:** 200 → string; 404 → string; 500 → string.

### `DELETE /api/delete-taxi/{id}`

**Path params:** `id` (int32, required). **Responses:** 200 → object; 400 → object; 500 → object.

---

## 4. Clients

*Client registration, profile updates, and lookup. Used by mobile and web apps for ride requesters.*

### `POST /api/add-client`

Register a new client. **Body — `ClientCreateDto`** (required):

| Field | Type | Req | Notes |
|---|---|---|---|
| telephone | string | | |
| contenu | string | | |
| name | string | | |
| masquerNumero | boolean | | hide the number |
| email | string | | |
| type | string | | enum `GSM, SMART, WHATSAPP, WHATSAPP_AR` |

**Responses:** 200 → `ClientDto`; 400 → `ErrorResponseDto` (validation failed / invalid input); 409 → `ErrorResponseDto` (client already exists, e.g. phone conflict); 500 → `ErrorResponseDto`.

### `POST /api/add-clientgps`

"Register a client with location data (add-clientgps variant). Use when app has initial coordinates." **Body:** `ClientCreateDto` (same schema as add-client — note: no latitude/longitude fields in the schema, see Ambiguities). **Responses:** 200 → `ClientDto`; 400 → `ErrorResponseDto`; 500 → `ErrorResponseDto`.

### `POST /api/add_client_gps`

"Alternative endpoint to add a client with GPS data (add_client_gps). Same use case as add-clientgps." **Body:** `ClientCreateDto`. **Responses:** 200 → `ClientDto`; 400 → `ErrorResponseDto`; 500 → `ErrorResponseDto`. *(Alias of `add-clientgps`.)*

### `GET /api/get-client/{client-id}`

**Path params:** `client-id` (int32, required, example 42). **Responses:** 200 → `ClientDto`; 404 → `ErrorResponseDto`; 500 → `ErrorResponseDto`.

### `GET /api/get-Clientby-phone/{phone}`

Single client by phone. **Path params:** `phone` (string, required, example `0612345678`). **Responses:** 200 → `ClientDto`; 404 → `ErrorResponseDto`; 500 → `ErrorResponseDto`.

### `GET /api/get-Clientnumero_telephone/{numero_telephone}`

All clients matching a telephone. **Path params:** `numero_telephone` (string, required, example `0612345678`). **Responses:** 200 → `ClientDto[]` (possibly empty); 500 → `ErrorResponseDto`.

### `GET /api/get-clientbyphone/{telephone}`

Same as `get-Clientnumero_telephone` (declared "Same as get-Clientnumero_telephone"). **Path params:** `telephone` (string, required, example `0612345678`). **Responses:** 200 → `ClientDto[]`; 500 → `ErrorResponseDto`. *(Alias of the above.)*

### `GET /api/get-allClients`

**Responses:** 200 → `ClientDto[]`; 500 → `ErrorResponseDto`.

### `GET /api/nbr-client`

**Responses:** 200 → integer (int32 count); 500 → `ErrorResponseDto`.

### `PUT /api/update-client/{client_id}`

Update client by ID ("Use after user edits profile in app"). **Path params:** `client_id` (int32, required, example 42). **Body:** `ClientDto` (required). **Responses:** 200 → `ClientDto`; 400 → `ErrorResponseDto` (validation failed); 404 → `ErrorResponseDto`; 500 → `ErrorResponseDto`.

### `PATCH /api/update-client-by-phone/{phone}`

Update current location and/or destination by phone. **Path params:** `phone` (string, required, example `0612345678`). **Body — `UpdateClientLocations`** (required): `destination` (string), `location` (string). **Responses:** 200 → `ClientDto`; 400 → `ErrorResponseDto`; 404 → `ErrorResponseDto`; 500 → `ErrorResponseDto`.

### `DELETE /api/delete-client/{client_id}`

**Path params:** `client_id` (int32, required, example 42). **Responses:** 200 → `Client` (full entity returned); 400 → `ErrorResponseDto` (e.g. invalid ID); 500 → `ErrorResponseDto`.

---

## 5. Demands

*Ride requests (demandes). Create, cancel, update, list by state/client. Used when client requests a taxi.*

### `POST /api/add-demande`

Create a ride request. **Body — `DemandeDto`** (required): `id (int32), date_depot (date-time), etat (enum), masquerNumero (boolean), date_smsMasquerNumero (date-time), client (Client)`. **Responses:** 200 → `DemandeDto`; 400 → `ErrorResponseDto`; 500 → `ErrorResponseDto`.

### `GET /api/get-demande`

Admin search: paginated, filterable list of ride demands. **Query params:**

| Name | Type | Req | Notes |
|---|---|---|---|
| page | int | | 0-based, example 0 |
| size | int | | example 20 |
| sort | string | | e.g. `date_depot,desc` |
| id | int32 | | exact demand ID |
| dateDepotFrom | string | | `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` |
| dateDepotTo | string | | `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` |
| etat | string | | status enum (8 values) |
| clientPhone | string | | filter |
| clientNom | string | | contains, case-insensitive |
| location | string | | pickup contains (from linked offer) |
| destination | string | | destination contains (from linked offer) |
| minEstimatedPrice | double | | price ≥ (from linked offer) |
| maxEstimatedPrice | double | | price ≤ (from linked offer) |
| pageable | Pageable | ✅ | spec quirk — referenced as a query param; send flat `page, size, sort` |

**Responses:** 200 → `DemandeAdminDto` *(declared schema, but description says "Page of demandes"; the page wrapper `ApiResponseDtoPageDemandeAdminDto` is what's declared for 400/500 — see Ambiguities)*; 400 → `ApiResponseDtoPageDemandeAdminDto` (invalid query parameters); 500 → `ApiResponseDtoPageDemandeAdminDto`.

`DemandeAdminDto`: `id, etat, dateDepot, clientId, clientNom, clientPhone, location, destination, estimatedPrice, assignedTaxiId, assignedTaxiNom, assignedTaxiPhone, broadcastStatus`.

### `GET /api/get-demande/{id}`

**Path params:** `id` (int32, required). **Responses:** 200 → `Demande`; 404 → `Demande`; 500 → `Demande`.

### `GET /api/get-listDemandeParEtat/{etat}`

**Path params:** `etat` (string, required — enum: `TERMINATED, WAITING, IN_PROGRESS, STARTED, CANCELLED, CANCELLED_BY_CLIENT, CANCELLED_BY_TAXI, EXPIRED`). Note the description example "EN_COURS" conflicts with the enum. **Responses:** 200 → `Demande[]`; 500 → `Demande[]`.

### `GET /api/get-listDemandeParClient/{id}`

**Path params:** `id` (int32, required — client ID). **Responses:** 200 → `Demande[]`; 500 → `Demande[]`.

### `GET /api/get-nombreDemandesParEtat/{etat}`

**Path params:** `etat` (string, required, state enum). **Responses:** 200 → int64 count; 500 → int64.

### `GET /api/get-indicationPositionEnAttente/{id}`

**Path params:** `id` (int32, required — demand ID). **Responses:** 200 → boolean; 500 → boolean.

### `GET /api/get-findByEtat`

Demandes with `WAITING` state. **Responses:** 200 → `Demande[]`; 500 → `Demande[]`.

### `GET /api/get-demandeParEtat`

One demande with `WAITING` state (or null). **Responses:** 200 → `Demande`; 500 → `Demande`. *(Overlaps with `get-findByEtat` — one returns a list, this one returns a single object.)*

### `GET /api/nbr-derniereDemandeEnCoursParClient/{client_id}`

**Path params:** `client_id` (int32, required). **Responses:** 200 → `Demande` (or null); 500 → `Demande`.

### `GET /api/nbr-NbrDemandeEncours`

**Responses:** 200 → int32 (count of in-progress demandes). (Path has a doubled "Nbr" — as declared.)

### `GET /api/nbr-DemandeEnattente`

**Responses:** 200 → int32 (count of waiting demandes).

### `PUT /api/update-demande`

Update an existing demande — send the **full** `Demande` in the body. **Body:** `Demande` (required). `Demande` fields: `id, date_depot, etat (required), masquerNumero, date_smsMasquerNumero`. **Responses:** 200 → `Demande`; 400 → `Demande`; 500 → `Demande`.

### `PUT /api/update-EtatDemande/{etat}`

Update demande state. **Path params:** `etat` (string, required — state enum). **Body:** `Demande` with id (required). **Responses:** 200 (no body declared); 500.

### `PUT /api/update-modifierEtatDemandeAffectee/{etat}`

Update demande state (affectee variant). **Path params:** `etat` (string, required — state enum). **Body:** `Demande` with id. **Responses:** 200; 500.

### `PATCH /api/update-state-demands/{phone}`

Update demande state for a client phone. **Path params:** `phone` (string, required, example `0612345678`). **Body:** free-form object — description says `{ "etat": "EXPIRED" }` (or other StatusEnum), but the schema is declared as an untyped object (`additionalProperties: object`). **Responses:** 200 → `DemandeDto`; 400 → `DemandeDto` (missing or invalid etat); 404 → `DemandeDto` (no demandes for phone); 500 → `DemandeDto`.

### `PUT /api/update-annulerDemandes60minutes`

Batch job: cancel demandes older than 60 minutes ("Side effect: DB update"). **No params/body.** **Responses:** 200; 500.

### `PUT /api/update-traiterDemandesParSMSMasquerNumero`

Process demandes for SMS "masquer numero" flow ("Side effect: DB update"). **No params/body.** **Responses:** 200; 500.

### `DELETE /api/cancel-demande/{demandeId}`

**Path params:** `demandeId` (int32, required, example 1). **Query params:** `cancelledByTaxi` (boolean, optional, default `false` — true if taxi cancelled, false if client). "Updates only Demande table." **Responses:** 200 → `CancelDemandeResponseDto`; 404 → `CancelDemandeResponseDto`; 500 → `CancelDemandeResponseDto`.

### `DELETE /api/delete-demande/{demande_id}`

**Path params:** `demande_id` (int32, required). **Responses:** 200 → object; 400 → object; 500 → object.

---

## 6. Offers

*Taxi offers: matching, update, cancel, list by state/taxi/client. Ride lifecycle.*

### `POST /api/ajouterOffre`

Create a new offer. **Body — `OffreDto`** (required). `OffreDto` fields: `id, etat (enum), taxi (Taxi), client (Client), taxiId, clientId, date_depot, annulee_auto, latitude, longitude, duration, distance, total_price, info, type (enum), locationHistory, destinationHistory, rating, comments, realPrice, variance`. **Responses:** 200 → `OffreDto` (created); 400 → `OffreDto`; 500 → `OffreDto`.

### `PUT /api/update-offre`

Update existing offer — "Body: full Offre." **Body:** `OffreDto` (required). **Responses:** 200 → `OffreDto`; 400 → `OffreDto`; 500 → `OffreDto`.

### `DELETE /api/delete-Offre/{id}`

**Path params:** `id` (int32, required). **Responses:** 200 → `Offre`; 400 → `Offre`; 500 → `Offre`.

### `GET /api/get-allOffre`  *(alias: `GET /api/get-all-offres`)*

Admin search — paginated, filterable list of offers. "Supports filtering by status, taxi/client information, date range, fees option, rating and price range."

**Query params** (same for both alias endpoints):

| Name | Type | Req | Notes |
|---|---|---|---|
| page | int32 | | 0-based, default 0 |
| size | int32 | | default 20 |
| sort | string | | e.g. `date_depot,desc` |
| etat | string | | status enum |
| taxiPhone | string | | filter |
| clientPhone | string | | filter |
| taxiNom | string | | contains, case-insensitive |
| clientNom | string | | contains, case-insensitive |
| id | int32 | | exact offer ID |
| location | string | | pickup contains (from `location_history`) |
| destination | string | | destination contains (from `destination_history`) |
| dateDepotFrom / dateDepotTo | string | | `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` |
| rating | int32 | | exact rating filter |
| minTotalPrice / maxTotalPrice | double | | real price range |

**Responses:** 200 → `OffreAdminDto` *(declared schema; description says "Page of offers" — same wrapper quirk as `/api/get-demande`, see Ambiguities)*; 400 → `ApiResponseDtoPageOffreAdminDto` (invalid query parameters); 500 → `ApiResponseDtoPageOffreAdminDto`.

`OffreAdminDto`: `id, etat, dateDepot, totalPrice, rating, clientId, clientNom, clientPhone, taxiId, taxiNom, taxiPhone, location, destination`.

### `GET /api/get-offreParId/{id}`  *(alias: `GET /api/getOffresById/{id}`)*

**Path params:** `id` (int32, required). **Responses:** 200 → `OffreDto`; 404 → `OffreDto` (get-offreParId only); 500 → `OffreDto` / `Offre[]` (getOffresById declares `Offre[]` for 500). Both fetch offer(s) by ID; prefer `get-offreParId`.

### `GET /api/get-listOffresParEtat/{etat}`

**Path params:** `etat` (string, required — state enum). **Responses:** 200 → `OffreDto[]`; 500 → `Offre[]`.

### `GET /api/get-listOffreParTaxi/{id}`

**Path params:** `id` (int32, required — taxi ID). **Responses:** 200 → `OffreDto[]`; 500 → `Offre[]`.

### `GET /api/get-listOffreParTaxiphone/{tel}`

**Path params:** `tel` (string, required — taxi phone). **Responses:** 200 → `OffreDto[]`; 500 → `Offre[]`.

### `GET /api/findOffreByTaxiTelephone/{tel}`

Single offer for a taxi phone. **Path params:** `tel` (string, required). **Responses:** 200 → `OffreDto`; 500 → `Offre[]`. *(Overlaps with `get-listOffreParTaxiphone` — that one returns a list.)*

### `GET /api/offre_matching_taxi/{phone}`

**Path params:** `phone` (string, required — taxi phone). **Responses:** 200 → `OffreDto`; 204 → `OffreDto` ("No offer"); 400 → `OffreDto`; 500 → `OffreDto`.

### `GET /api/offre_matching_client/{phone}`

**Path params:** `phone` (string, required — client phone). **Responses:** 200 → `OffreDto`; 204 → `OffreDto` ("No offer"); 400 → `OffreDto`; 500 → `OffreDto`.

### `GET /api/offreEnCoursParClient/{id_client}`

**Path params:** `id_client` (int32, required). **Responses:** 200 → `OffreDto` ("Offer or null"); 500 → `Offre`.

### `GET /api/nombreOffreParEtat/{etat}`

**Path params:** `etat` (string, required — state enum). **Responses:** 200 → int64 count; 500 → int64.

### `GET /api/nbrOffreByTaxi`

**Responses:** 200 → int64 ("Count or list"); 500 → int64. (No identifier parameter — counts all offers per taxi; ambiguous usage, see Ambiguities.)

### `GET /api/NbrOffreEncours`

**Responses:** 200 → int32 (offers in progress).

### `GET /api/NbrOffreEnattente`

**Responses:** 200 → int32 (offers in waiting state).

### `GET /api/Nbroffre_valider/{phone}`

Count of validated offers for a taxi phone. **Path params:** `phone` (string, required). **Responses:** 200 → int32; 500 → int32.

### `GET /api/listTaxiParNbrOffreNonValide`

Taxis with non-validated offer counts. **Responses:** 200 → `Taxi[]`; 500 → `Taxi[]`.

### `GET /api/history-traffic-taxi/{phone}` 🟡 DEPRECATED

> **Deprecated by the spec (`deprecated: true`).** Use **`GET /api/history-traffic-taxi/{phone}/page`** instead, which adds pagination + filters. Non-paginated version.

**Path params:** `phone` (string, required). **Responses:** 200 → `OffreDto[]`; 500 → `OffreDto[]`.

### `GET /api/history-traffic-taxi/{phone}/page`

Paginated taxi history. **Path params:** `phone` (string, required). **Query params:**

| Name | Type | Req | Notes |
|---|---|---|---|
| page | int32 | | default 1 (1-based!) |
| limit | int32 | | default 20 |
| from | date-time | | filter |
| to | date-time | | filter |
| month | int32 | | filter |
| year | int32 | | filter |
| status | string | | status enum |
| q | string | | search |
| sort | string | | |
| direction | string | | `ASC`/`DESC`, default `DESC` |

**Responses:** 200 → `OffreHistoryPageDto` (`page` 1-based, `limit`, `total`, `items: OffreDto[]`); 500 → `OffreHistoryPageDto`.

### `GET /api/history-traffic-client/{phone}` 🟡 DEPRECATED

> **Deprecated by the spec.** Use **`GET /api/history-traffic-client/{phone}/page`** instead.

**Path params:** `phone` (string, required). **Responses:** 200 → `OffreDto[]`; 500 → `OffreDto[]`.

### `GET /api/history-traffic-client/{phone}/page`

Paginated client history, same query params as the taxi `/page` variant. **Responses:** 200 → `OffreHistoryPageDto`; 500 → `OffreHistoryPageDto`.

### `PATCH /api/offers/{offreId}/route-text/{clientPhone}`

"Client app updates offer.location_history and offer.destination_history as human-readable labels. Intended for TGPS flow." (No geocoding.)

**Path params:** `offreId` (int32, required), `clientPhone` (string, required). **Body — `OfferRouteTextPatchRequest`** (required): `location` (string, required), `destination` (string, required). **Responses:** 200 → `OffreDto`; 400 → `OffreDto`; 404 → `OffreDto`; 500 → `OffreDto`.

### `PATCH /api/offers/{offreId}/ratings`

Submit or update rating for an offer. **Path params:** `offreId` (int32, required). **Body — `RatingUpdateRequest`** (required): `rating (int32), comments (string), realPrice (double)`. **Responses:** 200 → `OffreDto`; 404 → `OffreDto`; 500 → `OffreDto`.

### `PATCH /api/location/update/{id}`

**Path params:** `id` (int32, required — offer ID). **Body — `GpsCordonnation`** (required): `latitude (double), longitude (double)`. **Responses:** 200 → `OffreDto`; 404 → `GpsCordonnation`; 500 → `GpsCordonnation`.

### `PUT /api/update-EtatOffre`

Update offer state with the state in the **body** ("Body: Offre with id and etat"). **Body:** `Offre` (required). **Responses:** 200 → `Offre`; 500 → `Offre`.

### `PUT /api/update-EtatOffre/{etat}`

Update offer state with the value in the **path**. **Path params:** `etat` (string, required — state enum). **Body:** `Offre` with id (required). **Responses:** 200 → `Offre`; 500 → `Offre`.

### `PUT /api/update-EtatOffreAffectee/{etat}`

Affectee variant — **Path params:** `etat` (state enum, required); **Body:** `Offre` with id. **Responses:** 200 → `Offre`; 500 → `Offre`.

### `PATCH /api/update-state-offer/{id}/{offerStatusEnum}`

**Path params:** `id` (int32, required — offer ID), `offerStatusEnum` (string, required — state enum). **No body.** **Responses:** 200 → object; 404 → object; 500 → object.

### `PATCH /api/update_state_offre/{phone}`

**Path params:** `phone` (string, required — client phone). **Body — `OffreDto`** (required; described as "state payload"). **Responses:** 200 → `OffreDto`; 400 → `OffreDto`; 500 → `OffreDto`.

### `PUT /api/update-annulerAffectationOffre/{phone}`

Cancel offer assignment for a taxi phone. **Path params:** `phone` (string, required). **Responses:** 200 → `Offre`; 500 → `Offre`.

### `PUT /api/update-annulerOffres60minutes`

Batch job: cancel offers older than 60 minutes ("Side effect: DB update"). **No params/body.** **Responses:** 200 → `Offre`; 500 → `Offre`.

### `DELETE /api/cancel-offre/{offreId}`

**Path params:** `offreId` (int32, required). **Query params:** `cancelledByTaxi` (boolean, default `false`). **Responses:** 200 → `CancelBookingResponseDto`; 404 → `CancelBookingResponseDto`; 500 → `CancelBookingResponseDto`.

### `DELETE /api/cancel-booking/{id}` 🟡 DEPRECATED

> **Deprecated by the spec (`deprecated: true`).** No summary, no description, and **no replacement is named in the spec** — flag only. Suggested non-deprecated equivalents that exist in the spec: `POST /api/rides/cancel` (client-side cancellation, "Triggers same backend logic as SMS cancellation"), `DELETE /api/cancel-offre/{offreId}`, or the `DELETE /api/cancel-booking/...` phone/ID variants.

**Path params:** `id` (int32, required). **Responses:** 200 → `CancelBookingResponseDto`.

### `DELETE /api/cancel-booking/taxi/{phone}`

(No summary/description in spec.) **Path params:** `phone` (string, required). **Responses:** 200 → `CancelBookingResponseDto`.

### `DELETE /api/cancel-booking/taxi/id/{taxiId}`

Cancel all active bookings for a taxi ID. **Path params:** `taxiId` (int32, required). **Responses:** 200 → `CancelBookingResponseDto`; 404 → `CancelBookingResponseDto`; 500 → `CancelBookingResponseDto`.

### `DELETE /api/cancel-booking/client/{phone}`

Cancel all active bookings for a client phone. **Path params:** `phone` (string, required). **Responses:** 200 → `CancelBookingResponseDto`; 404 → `CancelBookingResponseDto`; 500 → `CancelBookingResponseDto`.

### `DELETE /api/cancel-booking/client/id/{clientId}`

Cancel all active bookings for a client ID. **Path params:** `clientId` (int32, required). **Responses:** 200 → `CancelBookingResponseDto`; 404 → `CancelBookingResponseDto`; 500 → `CancelBookingResponseDto`.

---

## 7. Ride Offers

*Accept/reject broadcasted ride offers. First-come-first-served via Redis. Side effects: WebSocket notifications, DB match.*

### `POST /api/ride-offers/accept`

"Taxi accepts a broadcasted offer. **First-come-first-served; Redis atomic.** Side effects: DB match, WebSocket notify client. Returns `{ success, message, ... }`."

**Body — `OfferAcceptanceDTO`** (required): `offerToken (string), taxiId (int32), demandId (int32), acceptanceTimestamp (int64)`. **Responses:**

| Status | Meaning | Schema |
|---|---|---|
| 200 | Accepted | string (declared as string, described as "Map: success, message, offerToken, taxiId, demandeId, offreId, ...") |
| 404 | Offer not found or expired | object |
| 409 | Offer already accepted by another taxi | object |
| 410 | Offer cancelled | object |
| 500 | Internal server error | object |

### `POST /api/ride-offers/reject`

"Taxi rejects offer. Recorded in Redis; offer stays active for other taxis. WebSocket notify this taxi only. Returns `{ success, message, offerToken, ... }`."

**Body — `OfferRejectionDTO`** (required): `offerToken (string), taxiId (int32), demandId (int32), reason (string), rejectionTimestamp (int64)`. **Responses:** 200 → string map `{ success, message, offerToken, taxiId, note }`; 404 → object (not found or expired); 409 → object (already accepted); 410 → object (already cancelled); 500 → object.

### `POST /api/ride-offers/gsm/accept`

GSM taxi (via Flutter) accepts — "same Redis atomic logic and DB side effects as `/accept`." **Body:** `OfferAcceptanceDTO`. **Responses:** same set as `/accept` (200, 404, 409, 410, 500).

### `POST /api/ride-offers/gsm/reject`

GSM taxi (via Flutter) rejects — "same Redis and device-level exclusion logic as `/reject`." **Body:** `OfferRejectionDTO`. **Responses:** same set as `/reject`.

### `POST /api/ride-offers/broadcast-gsm`

"Broadcasts GSM client demands to nearby GSM-eligible taxis via SMS only. Does not affect SMART/WebSocket flows." **No body/params.** **Responses:** 200 → string map `{ success, message }`; 500 → object.

### `GET /api/ride-offers/health`

Liveness check. **Responses:** 200 → object `{ status, service }` (string map).

---

## 8. Ratings

*Driver ratings. Submit rating, get ratings by driver, average.*

> ⚠️ These endpoints use the `/taxi-client/api/...` path prefix (not `/api/...`).

### `POST /taxi-client/api/ratings`

Submit a driver rating. **Body — `RatingDto`** (required): `driverId (string ≤50, required), offreId (int64, required), rating (int32 1–5, required), comment (string ≤500), id, createdAt`. **Responses:** 201 → `Rating` (created); 500 → `Rating`.

### `GET /taxi-client/api/ratings/driver/{driverId}`

**Path params:** `driverId` (string, required). **Responses:** 200 → `Rating[]`; 500 → `Rating[]`.

### `GET /taxi-client/api/ratings/driver/{driverId}/average`

**Path params:** `driverId` (string, required). **Responses:** 200 → number (double, average); 500 → number.

`Rating`: `id (int64), offreId (int64), driverId (string), rating (int32), comment (string), createdAt (date-time)`.

---

## 9. SMS In

*Incoming SMS: add, update, delete, list. RabbitMQ send, migration.*

### `POST /api/add-sms`

Add incoming SMS (Kannel/receiver format). **Body — `SmsReceived`** (required): `id, message, received_at, sender, traitement`. **Responses:** 200 → `SmsReceived`; 400 → `SmsReceived`; 500 → `SmsReceived`.

### `POST /api/ajouter-sms`

Add SMS in taxiMate `SmsIn` format. **Body — `SmsIn`** (required): `id (int32), contenu (string), date_reception (date-time), telephone (string), traitement (boolean)`. **Responses:** 200 → `SmsIn`; 400 → `SmsIn`; 500 → `SmsIn`.

### `POST /api/rabbitMQSender`

Publish SMS to RabbitMQ queue `sms-out`. **Body — `SmsOut`** (required): `id, contenu, date_envoi, telephone`. **Responses:** 200 → string ("Message sent to RabbitMQ"); 500 → string.

### `GET /api/get-all`

All SMS. **Responses:** 200 → `SmsIn[]`; 500 → `SmsIn[]`.

### `GET /api/get-listSMSnonTraites`

**Responses:** 200 → `SmsIn[]` (untreated); 500 → `SmsIn[]`.

### `GET /api/get-listSMSnonTraitesParTelephone/{numero_telephone}`

**Path params:** `numero_telephone` (string, required). **Responses:** 200 → `SmsIn[]`; 500 → `SmsIn[]`.

### `GET /api/nbr-sms`

**Responses:** 200 → int32 count.

### `PUT /api/update-sms`

"Body: SmsIn with id." **Body:** `SmsIn` (required). **Responses:** 200 → `SmsIn`; 500 → `SmsIn`.

### `DELETE /api/delete-sms/{smsin_id}`

**Path params:** `smsin_id` (int32, required). **Responses:** 200 → object; 400 → object; 500 → object.

---

## 10. Matching Config

*Runtime configuration for ride matching/broadcast radius.*

### `GET /api/matching-config`

"Returns current base/max radius (meters). Max is capped to 5000m." **Responses:** 200 → object (untyped `additionalProperties: object`; keys like `baseRadius`/`maxRadius` are *not* specified in the schema — see Ambiguities).

### `PUT /api/matching-config`

"Update base/max radius (meters). Only provided fields are updated. Max is capped to 5000m, base is clamped to `[>0, max]`." **Body:** untyped object (required). **Responses:** 200 → object.

---

## 11. Airport Pricing Config

*Runtime configuration for airport surcharge value/type and detection radius (used by the Dashboard).*

### `GET /api/airport-pricing`

"Returns current surcharge value, surcharge type (PERCENTAGE/FIXED_AMOUNT), detection radius (meters), and airport list." **Responses:** 200 → `AirportPricingConfigResponse` — `surchargeValue (double), surchargeType (enum), airportRadiusMeters (double), airports (double[][])`.

### `PATCH /api/airport-pricing`

"Update surcharge value and/or surcharge type and/or detection radius. Only provided fields are updated." **Body — `AirportPricingConfigRequest`** (required): `surchargeValue (double), surchargeType (enum PERCENTAGE/FIXED_AMOUNT), airportRadiusMeters (double)`. **Responses:** 200 → `AirportPricingConfigResponse`.

### `PUT /api/airport-pricing`

Alias of PATCH — description literally: *"Alias de PATCH pour compatibilité Dashboard"* ("PATCH alias for Dashboard compatibility"). Same body/response as above.

---

## 12. SOS

*Emergency SOS notifications. Send alert for taxi by ID.*

### `POST /api/sosNotification/{id}`

"Trigger SOS notification for taxi by ID. Sends SMS." **Path params:** `id` (int32, required — taxi ID). **Responses:** 200 → string ("SMS sent successfully"); 404 → string ("Taxi not found"); 500 → string.

---

## 13. Ride Cancellation

*Unified client ride cancellation (SMS + Mobile).*

### `POST /api/rides/cancel`

"Mobile app cancellation endpoint. **Triggers same backend logic as SMS cancellation.**" **Body — `CancelRideRequestDto`** (required): `clientPhone (string)`. **Responses:** 200 → `CancelBookingResponseDto`; 400 → `CancelBookingResponseDto`; 500 → `CancelBookingResponseDto`.

---

## 14. Injection

*Inject SMS into DB. Used for testing or external SMS gateway integration.*

### `POST /api/inject-sms`

**Body — `SmsInDto`** (required): `contenu (string, required, ≤1000), telephone (string, required, pattern ^[0-9+\-\s()]+$), dateReception (date-time, optional), traitement (boolean), id`. **Responses:** 200 → `MessageResponse` ("SMS saved"); 400 → `MessageResponse` (invalid data — telephone or content null/empty); 500 → `MessageResponse`.

---

## 15. reservation-admin-controller

*Reserved-ride admin management (not in the spec's declared `tags` list — operations are tagged `reservation-admin-controller` in their `tags` arrays). No summaries/descriptions are provided for these operations in the spec.*

### `GET /api/admin/reservations`

**Query params:** `status` (string, optional — enum `CREATED, CONFIRMED, WAITING_DRIVER, ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED`), `pageable` (declared as required `Pageable` ref — flatten to `page`/`size`/`sort`). **Responses:** 200 → `PageReservationResponse` (Spring Page of `ReservationResponse`).

### `GET /api/admin/reservations/{id}`

**Path params:** `id` (int32, required). **Responses:** 200 → `ReservationResponse`.

### `PUT /api/admin/reservations/{id}`

**Path params:** `id` (int32, required). **Body — `UpdateReservationRequest`** (required): `telephone, pickup, destination, reservationDateTime (date-time), commentaire, finalPrice (double)`. **Responses:** 200 → `ReservationResponse`.

### `PUT /api/admin/reservations/{id}/assignment`

**Path params:** `id` (int32, required). **Body — `AssignTaxiRequest`** (required): `taxiId (int32, required), assignmentType (enum AUTO/MANUAL), assignedBy (string), comment (string)`. **Responses:** 200 → `ReservationResponse`.

### `DELETE /api/admin/reservations/{id}/assignment`

**Path params:** `id` (int32, required). **Query params:** `cancelledBy` (string, optional), `reason` (string, optional). **Responses:** 200 → `ReservationResponse`.

### `POST /api/admin/reservations/with-assignment`

**Body — `ReservationWithAssignmentRequest`** (required): `reservation (ReservationRequest, required)`, `assignment (AssignTaxiRequest)`. `ReservationRequest`: `telephone, pickup, destination, pickupLatitude, pickupLongitude, destinationLatitude, destinationLongitude, reservationDateTime, source (enum WHATSAPP/SMS/MOBILE_APP/DASHBOARD), language (enum FR/AR), commentaire`. **Responses:** 200 → `ReservationResponse`.

### `GET /api/admin/reservations/by-taxi`

**Query params:** `taxiId` (int32, optional), `telephone` (string, optional), `status` (optional enum), `pageable` (required `Pageable` ref). **Responses:** 200 → `PageReservationResponse`.

`ReservationResponse` (key fields): `id, clientId, telephone, pickup, destination, pickupLatitude, pickupLongitude, destinationLatitude, destinationLongitude, reservationDateTime, status (9-value enum), source, language, commentaire, estimatedPrice, finalPrice, estimatedDistance, estimatedDuration, reminderSent, convertedToDemande, createdAt, updatedAt, cancelledAt, completedAt, cancelledBy, assignment (ReservationAssignmentResponse)`. `ReservationAssignmentResponse`: `id, taxiId, taxiNumero, taxiNom, taxiMatricule, taxiTelephone, assignmentType, status (6-value enum), assignedBy, assignedAt, acceptedAt, cancelledAt, completedAt, comment`.

---

## Notes / Ambiguities

1. **`etat` enum vs. description text.** All `etat`/`etatOffre` enums in the spec are the 8 English values (`TERMINATED, WAITING, IN_PROGRESS, STARTED, CANCELLED, CANCELLED_BY_CLIENT, CANCELLED_BY_TAXI, EXPIRED`). But the description of `GET /api/get-listDemandeParEtat/{etat}` still says *"State (e.g. WAITING, EN_COURS)"*. There is no `EN_COURS`/`EN_ATTENTE`/`VALIDE`/`ANNULE` enum anywhere in the spec — that old French vocabulary survives only in descriptions and DTO names ("est. price", "en cours"/"en attente" count endpoints).

2. **`PATCH /api/updateTaxiStatus/status` has no taxi identifier.** Description says "Update taxi status (e.g. APPROVED) by phone" but the path is `/api/updateTaxiStatus/status` with only a `taxiStatus` query param — no `phone` or `id` parameter is declared. The spec cannot tell us which taxi is updated.

3. **`GET /api/get-demande` and `GET /api/get-allOffre`/`get-all-offres` response mismatch.** The 200 response *declares* a bare `DemandeAdminDto` / `OffreAdminDto` while the description says "Page of …" and the 400/500 responses declare the wrapped `ApiResponseDtoPage…AdminDto`. The real page response is almost certainly the wrapper (Spring Page + envelope); treat the documented 200 schema as suspect.

4. **`POST /api/add-clientgps` / `/api/add_client_gps` body has no GPS fields.** Both are described as "with GPS", but the shared `ClientCreateDto` contains no latitude/longitude. Either coordinates are taken from elsewhere, or the schema is incomplete. Do not assume you can send `latitude`/`longitude` in these bodies.

5. **`/api/matching-config` and `/api/ride-offers` responses are untyped.** Matching-config GET/PUT and the ride-offers 200/error responses are declared as raw objects / `additionalProperties: object` with only prose ("Map: success, message, offerToken, …"). Field names beyond those listed in the descriptions are not machine-specified.

6. **Duplicate/alias endpoints (documented above, kept in full):**
   - `POST /api/add-client`, `/api/add-clientgps`, `/api/add_client_gps` (same body, same use case).
   - `GET /api/get-allOffre` vs `/api/get-all-offres` (identical admin search).
   - `GET /api/get-Clientnumero_telephone/{numero_telephone}` vs `/api/get-clientbyphone/{telephone}` (identical list lookup).
   - `GET /api/get-Clientby-phone/{phone}` (single) vs the two list lookups above.
   - `GET /api/taxi_byphone/{tel}` (single), `/api/get-taxi/{tel}` (list), `/api/get-taxinbyphone/{telephone}` (list) — three phone lookups with **different** return shapes.
   - `GET /api/get-offreParId/{id}` vs `/api/getOffresById/{id}`; `GET /api/findOffreByTaxiTelephone/{tel}` vs `/api/get-listOffreParTaxiphone/{tel}`; `GET /api/get-findByEtat` vs `/api/get-demandeParEtat` (WAITING lookups, list vs single).
   - Five offer-state-update endpoints (`update-EtatOffre`, `update-EtatOffre/{etat}`, `update-EtatOffreAffectee/{etat}`, `update-state-offer/{id}/{offerStatusEnum}`, `update_state_offre/{phone}`) and three demande-state endpoints (`update-EtatDemande/{etat}`, `update-modifierEtatDemandeAffectee/{etat}`, `update-state-demands/{phone}`).

7. **`GET /api/nbrOffreByTaxi` has no parameter** — description "Return offer count per taxi" but nothing identifies the taxi; likely intended per-taxi but declared without inputs.

8. **`PATCH /api/update-state-demands/{phone}` body is untyped** (declared `additionalProperties: object`); description gives `{ "etat": "EXPIRED" }`. Send exactly that field.

9. **Path prefix inconsistencies:** most paths are `/api/...`, but the Ratings endpoints live under `/taxi-client/api/...`. The spec's first server already includes `/taxi-client` as a base path — if your HTTP client applies the base URL as-is, do **not** duplicate the prefix; confirm with the backend which combination actually serves (related to the port/base-path discrepancy noted in Base URLs).

10. **`GET /api/get-demandeParEtat` / `GET /api/get-findByEtat`** both target `WAITING` only — there is no declared param to choose another state despite the names.

11. **Missing response codes.** Many endpoints declare only 200/500 (or 200/400/500 with the success DTO repeated on all statuses — e.g. `/api/add-taxi`, `/api/delete-*`, `update_gps`). Spec does not define error bodies for those endpoints; treat response *contents* on non-2xx as undocumented except where `ErrorResponseDto` is declared.

12. **`DELETE /api/cancel-booking/{id}`** is deprecated with **no replacement declared in the spec**; the obvious non-deprecated alternatives are `POST /api/rides/cancel` (client), `DELETE /api/cancel-offre/{offreId}`, and the `cancel-booking/{taxi|client}…` variants.

13. **Fields with unclear purpose:** `Demande.masquerNumero` / `date_smsMasquerNumero` (SMS number-masking feature), `Offre.annulee_auto`, `Taxi.smsWinek` / `dateSmsWinek` ("Winek" is unexplained in the spec), `DemandeAdminDto.broadcastStatus` ("from Redis state", free-form string), `OffreDTO.variance` (price variance — no definition), and `Offre.total_price` being a string while `realPrice` is a double. No further explanation exists in the spec.