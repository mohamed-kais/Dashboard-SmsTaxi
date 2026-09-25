export const environment = {
  production: true,
  defaultauth: 'fackbackend',
  // All API traffic is SAME-ORIGIN RELATIVE in production: the browser only
  // talks to this dashboard's origin (http://41.225.11.231:5005) and nginx
  // (nginx.conf) proxies server-side to the real backends — no CORS needed.
  //
  // `''` keeps `/api/*` and `/taxi-client/api/*` URLs relative; the
  // ApiBaseUrlInterceptor (core/interceptors/api-base-url.interceptor.ts)
  // prepends this value to those paths. Decision 1 is preserved at the nginx
  // layer: `location /api/` proxies to `http://41.225.11.231:8577` (the main
  // API — NOT rerouted to the notifications host). See docs/DEPLOYMENT.md
  // for the full mapping table.
  //
  // Dev (environment.ts) uses the absolute URL `http://41.225.11.231:8577`
  // directly; prod reaches the same backend through nginx as origin-relative.
  apiBaseUrl: '',
  // Notifications/WhatsApp backend. Dev uses the absolute URL
  // `http://41.225.11.231:8444/taxi-client`; in prod the same value is
  // origin-relative (`/taxi-client`) so NotificationService builds
  // same-origin URLs that nginx routes to `http://41.225.11.231:8444`
  // (full pass-through, unchanged path). Nginx splits the shared
  // `/taxi-client/api/` prefix: `/taxi-client/api/notifications*` +
  // `/taxi-client/api/get-all-*-criteria` -> 8444, `/taxi-client/api/ratings*`
  // -> 8577 (Routes 3-6 in docs/DEPLOYMENT.md).
  notificationsBaseUrl: '/taxi-client',
  // WhatsApp chat backend — SAME-ORIGIN RELATIVE (identical values to dev):
  // chat.service calls `/chat-api/chat/...`, chat-websocket.service opens
  // SockJS at `/chat-ws`. Nginx rewrites `/chat-api` -> `/api` and
  // `/chat-ws` -> `/ws-chat`, then proxies to `http://41.225.11.231:5000`
  // (the populated whatsapp host VERIFIED 2026-09-24 — see proxy.conf.js and
  // docs/DEPLOYMENT.md; the public :8085 deployment is an empty instance).
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