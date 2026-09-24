/**
 * Dev-server proxy ONLY (never shipped to the browser). Mirrors the reference
 * dashboard's architecture (aziziala/dashboard NBA branch, proxy.conf.js):
 * the app calls SAME-ORIGIN relative paths, and this server forwards them to
 * the backend that actually holds the data.
 *
 * VERIFIED 2026-09-24 — why the target is :5000 and NOT the public :8085:
 *   - `http://41.225.11.231:5000/api/chat/conversations`  -> 200 with real
 *     conversations (Oussama Ghannay, Mohamed Kais). Port 5000 is the
 *     reference dashboard's own host, which proxies `/api/chat` + `/ws-chat`
 *     to the POPULATED internal whatsapp service (192.168.2.7:8085).
 *   - `http://41.225.11.231:8085/api/chat/conversations`  -> 200 `[]` — the
 *     public :8085 deployment is EMPTY (empty even with no auth and with
 *     Host-header spoofing; it is a different/empty instance, not a
 *     permissions issue). The internal 192.168.2.7:8085 is not routable from
 *     this network, so there is no direct URL to it.
 *   - Direct cross-origin calls to :5000 also fail in browsers (duplicate
 *     `Access-Control-Allow-Origin` headers), hence same-origin proxying.
 *
 * The visible prefixes `/chat-api` and `/chat-ws` are deliberately NOT under
 * `/api/` so the ApiBaseUrlInterceptor passes them through unchanged.
 */
const common = { secure: false, changeOrigin: true };

module.exports = {
  '/chat-api': {
    ...common,
    // The reference host itself serves the whatsapp REST under `/api/chat`.
    target: 'http://41.225.11.231:5000',
    pathRewrite: { '^/chat-api': '/api' }
  },
  '/chat-ws': {
    ...common,
    target: 'http://41.225.11.231:5000',
    ws: true,
    pathRewrite: { '^/chat-ws': '/ws-chat' }
  }
};