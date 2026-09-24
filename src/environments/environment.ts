// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  defaultauth: 'fackbackend',
  // Base URL for all API calls; consumed by ApiBaseUrlInterceptor
  // (core/interceptors/api-base-url.interceptor.ts).
  // NOTE — base-URL discrepancy (see docs/API_REFERENCE.md "Base URLs"):
  // the OpenAPI spec declares `http://41.225.11.231:8777/taxi-client` (port 8777 +
  // `/taxi-client` base path) as its dev server, but the dev backend has been
  // observed serving on `http://41.225.11.231:8577` (port 8577, no base path).
  // Using the observed-working value below; swapping = one config change.
  // TODO: confirm with the backend team which port/base-path is current.
  apiBaseUrl: 'http://41.225.11.231:8577',
  // Base URL for the notifications/WhatsApp backend (swagger declared dev
  // server: port 8444 + `/taxi-client` base path). Consumed by
  // NotificationService / WhatsappService as ABSOLUTE URLs — unlike
  // `apiBaseUrl`, it is NOT applied by the ApiBaseUrlInterceptor (absolute
  // URLs pass through unchanged).
  notificationsBaseUrl: 'http://41.225.11.231:8444/taxi-client',
  // WhatsApp chat backend. Consumed by ChatService / ChatWebSocketService.
  // VERIFIED 2026-09-24: the public `http://41.225.11.231:8085` whatsapp
  // deployment returns an EMPTY conversation list (`[]` — a different/empty
  // instance; not a permissions issue), so direct absolute URLs are dropped.
  // Data lives behind the reference dashboard's host (`:5000`, which proxies
  // `/api/chat` + `/ws-chat` to the populated internal 192.168.2.7:8085).
  // Mirroring that app's architecture: SAME-ORIGIN relative URLs
  // (`/chat-api` + `/chat-ws`) routed by the dev-server proxy
  // `proxy.conf.js` (paths intentionally NOT under `/api/` so the
  // ApiBaseUrlInterceptor passes them through unchanged).
  whatsappApiUrl: '/chat-api',
  whatsappWsUrl: '/chat-ws',
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



/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
