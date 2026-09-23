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
