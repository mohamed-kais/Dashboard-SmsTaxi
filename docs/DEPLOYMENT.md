# DEPLOYMENT.md — Production serving at `http://41.225.11.231:5005`

This document describes how the dashboard is served in production **and why**
each routing decision exists. It supersedes the old assumption of running on a
local dev server (`localhost:4200`) — the app is now served as a **static
build through nginx at host port 5005**, mirroring the reference NBA dashboard
(`aziziala/dashboard`, branch `NBA`) which serves on port 5000.

---

## 1. Architecture (one picture)

```
Browser  ──►  http://41.225.11.231:5005
                    │
                    ▼
              nginx (in Docker, port 5005 -> 80)
                    │
     ┌──────────────┼──────────────────┬──────────────────┐
     ▼              ▼                  ▼                  ▼
 SPA static   main API          notifications      whatsapp chat
 dist/skote   41.225.11.231:8577 41.225.11.231:8444  41.225.11.231:5000
 (try_files /index.html)   (pass-through)     (pass-through)  (rewrite /chat-api->/api,
                                                              /chat-ws->/ws-chat)
```

**Key property:** the browser only ever talks to `:5005` (same-origin). nginx
proxies every backend server-side. Therefore **no CORS headers are needed**
and none are added; the app makes relative same-origin calls only.

---

## 2. Decisions (recorded)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Main API target stays `41.225.11.231:8577` (NOT rerouted to the notifications host `192.168.2.7:8444`) | User decision; the main API box is the same host that serves `:5005`; the notifications backend is a separate service. |
| D2 | Serve a static `dist/` build via nginx (`ng build --configuration production`), NOT `ng serve` | Matches the reference dashboard's serving model; production-grade static hosting; no Node runtime needed in the final image. |
| D3 | Prod env values are **same-origin relative** paths; nginx does the proxying | Mirrors the app's own dev pattern (chat already uses `/chat-api` + `/chat-ws` relative URLs via the dev proxy); keeps the browser single-origin → no CORS. |
| D4 | WhatsApp chat upstream = `http://41.225.11.231:5000` | VERIFIED 2026-09-24: the reference dashboard host serves the **populated** whatsapp data under `/api/chat` + `/ws-chat` (proxying internally to `192.168.2.7:8085`). The public `:8085` deployment returns an empty instance (`[]`), so it is NOT used. |
| D5 | `/taxi-client/` prefix is **split** between two backends using nginx longest-prefix matching | `ratings*` → 8577 (main API — calls it under `/taxi-client/api/ratings*`), `notifications*` + both criteria endpoints → 8444. A naive `location /taxi-client/` → 8444 would break driver ratings. |
| D6 | Unknown `/taxi-client/api/*` paths → `404` (never SPA `index.html`) | Prevents API mistakes from being masked by an HTML 200 response. |

---

## 3. URL inventory → nginx location blocks

Complete inventory audited 2026-09-25 (all service files under
`src/app/core/services/*.service.ts`).

| nginx location | Prefixes served | Upstream | Notes |
|---|---|---|---|
| `location /` | SPA static: `index.html`, assets, JS chunks | local `dist/skote/` | `try_files $uri $uri/ /index.html` |
| `location /api/` | ALL main-API endpoints: `login`, `admin/reservations*`, `get-demande*`, `add-demande`, `update-demande`, `update-EtatDemande/*`, `cancel-demande/*`, `delete-demande/*`, `get-listDemandeParEtat/*`, `get-nombreDemandesParEtat/*`, `update-annulerDemandes60minutes`, `update-traiterDemandesParSMSMasquerNumero`, `update-modifierEtatDemandeAffectee/*`, `update-state-demands/*`, `offre_matching_client/`, `ajouterOffre`, `get-all-offres`, `get-offreParId/*`, `get-listOffresParEtat/*`, `NbrOffreEnattente`, `NbrOffreEncours`, `nombreOffreParEtat/*`, `update-offre`, `update-EtatOffre/*`, `cancel-offre/*`, `delete-Offre/*`, `update-annulerOffres60minutes`, `update-state-offer/*`, `offers/*/route-text/`, `offreEnCoursParClient/*`, `offre_matching_taxi/`, `add-taxi`, `get-all-taxis`, `get-taxis/*`, `existByPhone/*`, `checkTaxiStatus/*`, `update-taxi/*`, `delete-taxi/*`, `taxi_byphone/`, `update_gps/*`, `update_state_offre/`, `history-traffic-taxi/*/page`, `nbr-taxi`, `get-all-taxis-criteria`, `add-client`, `get-allClients`, `get-client/*`, `get-clientbyphone/`, `get-Clientby-phone/`, `update-client/*`, `update-client-by-phone/`, `delete-client/*`, `nbr-client`, `history-traffic-client/*/page`, `add-sms`, `ajouter-sms`, `get-listSMSnonTraites`, `get-listSMSnonTraitesParTelephone/*`, `update-sms`, `delete-sms/*`, `inject-sms`, `nbr-sms`, `sosNotification/*`, `matching-config`, `airport-pricing`, `rabbitMQSender`, `get-all`, `taxis/*/rating-summary`, `taxis/by-phone/*/rating-summary` | `http://41.225.11.231:8577` | Pass-through, no rewrite (D1). |
| `location /taxi-client/api/ratings` | `ratings` (POST), `ratings/driver/{id}`, `ratings/driver/{id}/average` | `http://41.225.11.231:8577` | **Main API, NOT 8444** (D5; longest prefix wins over `/taxi-client/api/` fallback). |
| `location /taxi-client/api/notifications` | `notifications/all`, `notifications/all/filter`, `notifications/client/{id}`, `notifications/taxi/{id}`, `notifications/target-notif/{t}`, `notifications/target/{t}`, `notifications/send`, `notifications/send-any-one` | `http://41.225.11.231:8444` | Pass-through, not rewritten (D3/D5). |
| `location = /taxi-client/api/get-all-taxis-criteria` | `get-all-taxis-criteria` (notifications side) | `http://41.225.11.231:8444` | Exact match beats any prefix. |
| `location = /taxi-client/api/get-all-clients-criteria` | `get-all-clients-criteria` (notifications side) | `http://41.225.11.231:8444` | Exact match beats any prefix. |
| `location /taxi-client/api/` (fallback) | anything else under `/taxi-client/api/` | — | `return 404` (D6). |
| `location /chat-api/` | `chat/conversations`, `chat/conversations/{id}/messages`, `chat/send`, `chat/send-template`, `chat/conversations/{id}/read`, `chat/media/{id}/url` | `http://41.225.11.231:5000` | `rewrite ^/chat-api /api break;` — mirrors dev `proxy.conf.js` (D4). |
| `location /chat-ws` | SockJS/STOMP websocket: `/chat-ws/info` (HTTP probe) + `/chat-ws/{server}/{session}/websocket` (WS) | `http://41.225.11.231:5000` | `rewrite ^/chat-ws /ws-chat break;` + `Upgrade`/`Connection` headers (D4). |

### Path collision notes (why the table looks the way it does)

1. `/taxi-client/api/ratings*` belongs to the **main API (8577)** while
   `/taxi-client/api/notifications*` and both `get-all-*-criteria` belong to
   the **notifications backend (8444)**. Both share the `/taxi-client/`
   prefix. Nginx **longest-prefix** matching splits them — the `ratings`
   block (longer) wins over the generic `/taxi-client/api/` fallback.
2. `get-all-taxis-criteria` exists on BOTH backends:
   - `taxi.service.ts` → `/api/get-all-taxis-criteria` → row `/api/` → **8577**
   - `notification.service.ts` → `/taxi-client/api/get-all-taxis-criteria` → exact row → **8444**
   They are distinguished only by the `/taxi-client` prefix — hence the exact-match locations.
3. WhatsApp chat deliberately uses `/chat-api`/`/chat-ws` (NOT `/api/`) so the
   ApiBaseUrlInterceptor passes those paths through unchanged and nginx can
   route them independently of the main API (same design as `proxy.conf.js`,
   which documents that calling `/api/chat` on the main API would be wrong).

---

## 4. Environment configuration

| Env var (file) | Dev (`environment.ts`) | Prod (`environment.prod.ts`) |
|---|---|---|
| `apiBaseUrl` | `http://41.225.11.231:8577` (absolute) | `''` (relative — nginx `location /api/` → 8577) |
| `notificationsBaseUrl` | `http://41.225.11.231:8444/taxi-client` | `/taxi-client` (relative — nginx splits to 8444) |
| `whatsappApiUrl` | `/chat-api` | `/chat-api` (unchanged, same-origin) |
| `whatsappWsUrl` | `/chat-ws` | `/chat-ws` (unchanged, same-origin) |
| `defaultauth` | `fackbackend` | `fackbackend` (unchanged) |

Prod is **identical in shape to dev**: relative same-origin URLs everywhere,
with the serving layer (dev: `proxy.conf.js`; prod: `nginx.conf`) doing the
actual forwarding. This is why the migration is low-risk.

---

## 5. Files

| File | Purpose |
|---|---|
| `nginx.conf` | SPA serving + all API reverse-proxy locations (the mapping table above). |
| `Dockerfile` | Multi-stage: `node:22-alpine` build (`ng build --configuration production`) → `nginx:alpine` serve. |
| `docker-compose.yml` | `5005:80` port map, `restart: unless-stopped`, healthcheck on `/`. |
| `src/environments/environment.prod.ts` | Real prod values (section 4). |

---

## 6. Deploy

Requires Docker + Docker Compose on the server. Note: `192.168.2.7` is where
the code is pulled/built before running; `41.225.11.231` is the host where it
becomes reachable — the two are DIFFERENT hosts in the architecture (build
box vs public-facing host), so rebuild/redeploy on the serving host.

```bash
# on the serving host (41.225.11.231 or wherever :5005 is exposed):
git pull            # get the refact branch
git checkout refact
docker compose up -d --build
docker compose ps   # status: healthy (or starting)
```

Verify:

```bash
curl -I http://41.225.11.231:5005/                    # 200, text/html
curl -s http://41.225.11.231:5005/api/get-all-taxis   # JSON from 8577
curl -s http://41.225.11.231:5005/chat-api/chat/conversations  # JSON from whatsapp via :5000
curl -s -o /dev/null -w '%{http_code}' http://41.225.11.231:5005/taxi-client/api/nonexistent   # 404
```

Login credentials (fake backend, unchanged): `admin@themesbrand.com` / `123456`.

---

## 7. CORS conclusion (explicit)

No CORS configuration is added at nginx, and no backend CORS changes are
required. Reason: the browser only ever makes **same-origin** requests to
`:5005`; nginx proxies to the backends server-side (server-to-server HTTP is
not subject to CORS). This was confirmed against the request flow of every
service in Section 3.

---

## 8. Open items / caveats

- The whatsapp `:5000` upstream is the reference dashboard host. If that host
  is decommissioned, the whatsapp chat/REST will break until
  `nginx.conf` is repointed at the internal `192.168.2.7:8085` (currently not
  routable from this network; evidence conflict `192.168.2.2` vs `192.168.2.7`
  in reference config).
- `environment.ts` still contains a TODO about the 8577-vs-8777 base-URL
  discrepancy — out of scope for this deployment pass (observed-working 8577
  kept).
- The prod build output goes directly to `dist/skote/` (classic `browser`
  builder). If the builder is ever upgraded to the Angular `application`
  builder, the Dockerfile `COPY` source becomes `dist/skote/browser/`.