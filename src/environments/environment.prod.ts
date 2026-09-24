export const environment = {
  production: true,
  defaultauth: 'fackbackend',
  // Base URL for all API calls; consumed by ApiBaseUrlInterceptor
  // (core/interceptors/api-base-url.interceptor.ts).
  // PLACEHOLDER — set the real production URL before shipping.
  // Spec-declared servers (docs/API_REFERENCE.md "Base URLs"):
  //   - `http://41.225.11.231:8777/taxi-client`  (spec "Development" server: port 8777 + /taxi-client base path)
  //   - `https://api.example.com`                (spec "Production" server: obvious placeholder)
  // Dev uses `http://41.225.11.231:8577` (observed working) — see environment.ts.
  // Swapping dev/prod = one env change; confirm the real prod URL with the backend team.
  apiBaseUrl: '',
  // PLACEHOLDER — set the real notifications backend URL before shipping
  // (consumed by NotificationService/WhatsappService as absolute URLs).
  notificationsBaseUrl: '',
  // PLACEHOLDER — WhatsApp chat backend URLs for PRODUCTION.
  // Dev uses SAME-ORIGIN relative values (`/chat-api`, `/chat-ws`) routed by
  // the ng-serve proxy (proxy.conf.js) to the populated whatsapp service —
  // see environment.ts / proxy.conf.js for the verified 2026-09-24 findings
  // (public :8085 is an empty deployment; data lives behind the reference
  // host `:5000` which proxies to the internal 192.168.2.7:8085). For prod,
  // set the real gateway URLs (absolute, or same-origin if a reverse proxy
  // routes them server-side like dev does).
  whatsappApiUrl: '',
  whatsappWsUrl: '',
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  }
};
