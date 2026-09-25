# STEP 1 — Dependency and Version Audit

- **Project:** `skote-angular-vertical` (Angular standalone application)
- **Audit date:** 2026-09-25
- **Git baseline inspected:** `0501399`
- **Scope:** `package.json`, `package-lock.json`, installed package metadata, `npm outdated`, and `npm audit`
- **Change boundary:** This STEP 1 task wrote only this document. It did not modify `package.json`, `package-lock.json`, or application/test source files.

Registry data is a point-in-time snapshot. `wanted` is npm's highest version that still satisfies the version range declared in `package.json`; `latest` is the current registry release. Non-zero exit status from `npm outdated` or `npm audit` is expected when findings exist.

## 1. Outdated dependency summary

`npm outdated` and `npm outdated --json` reported the same 16 packages. Every row is a direct dependency installed under `node_modules`; **type** distinguishes the declaration section in `package.json`.

| Package | Current | Wanted | Latest | Type | Where |
|---|---:|---:|---:|---|---|
| `@types/jasmine` | 4.3.1 | 4.6.6 | 6.0.0 | dev-direct | `node_modules/@types/jasmine` |
| `@types/jasminewd2` | 2.0.10 | 2.0.13 | 2.0.13 | dev-direct | `node_modules/@types/jasminewd2` |
| `@types/node` | 18.11.17 | 18.19.130 | 26.6.2 | dev-direct | `node_modules/@types/node` |
| `bootstrap` | 5.2.2 | 5.3.8 | 5.3.8 | runtime-direct | `node_modules/bootstrap` |
| `firebase` | 9.15.0 | 9.23.0 | 12.19.0 | runtime-direct | `node_modules/firebase` |
| `jasmine-core` | 4.5.0 | 4.6.1 | 7.0.2 | dev-direct | `node_modules/jasmine-core` |
| `karma` | 6.4.1 | 6.4.4 | 6.4.4 | dev-direct | `node_modules/karma` |
| `karma-chrome-launcher` | 3.1.1 | 3.2.0 | 3.2.0 | dev-direct | `node_modules/karma-chrome-launcher` |
| `karma-jasmine-html-reporter` | 2.0.0 | 2.3.0 | 2.3.0 | dev-direct | `node_modules/karma-jasmine-html-reporter` |
| `metismenujs` | 1.3.1 | 1.4.0 | 1.4.0 | runtime-direct | `node_modules/metismenujs` |
| `ng-otp-input` | 1.8.5 | 1.9.3 | 2.0.10 | runtime-direct | `node_modules/ng-otp-input` |
| `sass-loader` | 13.3.2 | 13.3.3 | 17.0.1 | runtime-declared build tool | `node_modules/sass-loader` |
| `sweetalert2` | 11.6.16 | 11.26.25 | 11.26.25 | runtime-direct | `node_modules/sweetalert2` |
| `ts-node` | 10.9.1 | 10.9.2 | 10.9.2 | dev-direct | `node_modules/ts-node` |
| `typescript` | 6.0.3 | 6.0.3 | 7.0.2 | dev-direct | `node_modules/typescript` |
| `zone.js` | 0.15.1 | 0.15.1 | 0.16.3 | runtime-direct | `node_modules/zone.js` |

### Angular package alignment verdict

**PASS — no Angular version misalignment found.** All requested Angular packages declare exactly `^22.2.0`, and `npm ls --depth=0` confirms that all are installed at exact version `22.2.0`.

| Angular package | Declared | Installed |
|---|---:|---:|
| `@angular/core` | `^22.2.0` | 22.2.0 |
| `@angular/common` | `^22.2.0` | 22.2.0 |
| `@angular/compiler` | `^22.2.0` | 22.2.0 |
| `@angular/compiler-cli` | `^22.2.0` | 22.2.0 |
| `@angular/forms` | `^22.2.0` | 22.2.0 |
| `@angular/router` | `^22.2.0` | 22.2.0 |
| `@angular/animations` | `^22.2.0` | 22.2.0 |
| `@angular/platform-browser` | `^22.2.0` | 22.2.0 |
| `@angular/platform-browser-dynamic` | `^22.2.0` | 22.2.0 |
| `@angular/localize` | `^22.2.0` | 22.2.0 |
| `@angular/language-service` | `^22.2.0` | 22.2.0 |
| `@angular/cli` | `^22.2.0` | 22.2.0 |
| `@angular-devkit/build-angular` | `^22.2.0` | 22.2.0 |

None of these Angular packages appeared in `npm outdated`, so npm reports no newer current/wanted/latest mismatch for the installed Angular 22.2.0 set.

### Angular companion-package coherence

| Package | Declared | Installed | Installed peer/compatibility signal | Verdict |
|---|---:|---:|---|---|
| `@ng-bootstrap/ng-bootstrap` | `^21.0.0` | 21.0.0 | Peers `@angular/common`, `core`, `forms`, and `localize` at `^22.0.0` | Coherent; the package major is not the Angular major |
| `ngx-owl-carousel-o` | `^22.0.0` | 22.0.0 | Peers Angular `^22.0.0-rc.0 || ^22.0.0` | Coherent |
| `ngx-cookie-service` | `^22.0.0` | 22.0.0 | Peers Angular `^22.0.0` | Coherent |
| `@ngx-translate/core` | `^18.0.0` | 18.0.0 | Peers Angular `>=18` and RxJS `>=7` | Coherent |
| `@ngx-translate/http-loader` | `^18.0.0` | 18.0.0 | Peers Angular `>=18` and translate core `>=18.0.0` | Coherent |
| `zone.js` | `^0.15.1` | 0.15.1 | Angular core peer is `~0.15.0 || ~0.16.0` | Coherent with the current minor; 0.16.3 still needs a deliberate runtime change |

**Companion-set verdict:** PASS. There is no declared Angular 22 companion-version mismatch. In particular, ng-bootstrap major 21 is valid here because its installed 21.0.0 package explicitly peers on Angular 22.

## 2. npm audit findings

### Summary

`npm audit --json` reported the following `metadata.vulnerabilities` object:

| Severity | Count |
|---|---:|
| Critical | 3 |
| High | 16 |
| Moderate | 3 |
| Low | 3 |
| Info | 0 |
| **Total** | **25** |

A second scoped query, `npm audit --omit=dev --json`, reported **10** package records: **2 critical, 6 high, 1 moderate, 1 low**. This confirms that the other 15 package records are dev-only findings. The audit report counts vulnerable package records, not unique GHSA identifiers; several records aggregate multiple advisories.

No record returned `fixAvailable: false`. A boolean `true` means npm reports a fix without identifying a semver-major bump. An object with `isSemVerMajor: true` is explicitly a breaking fix path. The table below is ordered critical, high, moderate, then low, with alphabetical ordering inside each severity.

### Critical

| Package | `isDirect` | Scope and representative dependency chain | Advisory IDs represented | `fixAvailable` | Breaking? | Classification and recommendation |
|---|---|---|---|---|---|---|
| `loader-utils` | `false` | **dev-only**; `@angular-devkit/build-angular > resolve-url-loader > adjust-sourcemap-loader > loader-utils@2.0.2` | `GHSA-76p3-8jx3-jpfq`, `GHSA-3rfm-jhwj-7488`, `GHSA-hhq3-ff78-jv3g` | `true` | No major indicated | Build-tool transitive finding. Despite the lower runtime priority of dev-only dependencies, the critical rating should be remediated through a reviewed lockfile/toolchain refresh; no application dependency major bump is required according to npm. |
| `protobufjs` | `false` | **runtime**; `firebase > @firebase/firestore > @grpc/proto-loader > protobufjs@6.11.3` (also reached through `@firebase/firestore-compat` and a nested 7.1.2 copy) | `GHSA-h755-8qp9-cq85`, `GHSA-xq3m-2v4x-88gg`, `GHSA-66ff-xgx4-vchm`, `GHSA-2pr8-phx7-x9h3`, `GHSA-fx83-v9x8-x52w`, `GHSA-75px-5xx7-5xc7`, `GHSA-jvwf-75h9-cwgg`, `GHSA-685m-2w69-288q`, `GHSA-q6x5-8v7m-xcrf`, `GHSA-jggg-4jg4-v7c6`, `GHSA-wcpc-wj8m-hjx6`, `GHSA-f38q-mgvj-vph7` | `firebase@12.19.0`, `isSemVerMajor: true` | **Yes — Firebase 9 to 12** | Firebase-family transitive finding. A safe automatic bump is not offered; migration planning and regression testing are required. If temporarily accepted, record and time-bound the justification rather than treating it as fixed. |
| `websocket-driver` | `false` | **runtime**; `sockjs-client > faye-websocket > websocket-driver@0.7.4`; also `firebase > @firebase/database > faye-websocket > websocket-driver` and the database-compat path | `GHSA-mp7j-qc5w-4988`, `GHSA-xv26-6w52-cph6` | `true` | No major indicated | Production-reachable through the direct `sockjs-client` dependency and Firebase. Recommend a reviewed transitive lock refresh/patch-level remediation and a STOMP/SockJS transport smoke test; npm does not identify this fix as breaking. |

### High

| Package | `isDirect` | Scope and representative dependency chain | Advisory IDs represented | `fixAvailable` | Breaking? | Classification and recommendation |
|---|---|---|---|---|---|---|
| `@firebase/firestore` | `false` | **runtime**; `firebase > @firebase/firestore@3.8.0`; also `firebase > @firebase/firestore-compat > @firebase/firestore` | Inherited from `@grpc/grpc-js` and `@grpc/proto-loader` | `firebase@12.19.0`, `isSemVerMajor: true` | **Yes** | Firebase-family transitive finding. Keep in the same coordinated Firebase 12 migration; an out-of-scope exception needs justification. |
| `@firebase/firestore-compat` | `false` | **runtime**; `firebase > @firebase/firestore-compat@0.3.0 > @firebase/firestore` | Inherited from `@firebase/firestore` | `firebase@12.19.0`, `isSemVerMajor: true` | **Yes** | Same Firebase 12 migration decision. |
| `@grpc/grpc-js` | `false` | **runtime**; `firebase > @firebase/firestore > @grpc/grpc-js@1.7.3`; also the firestore-compat path | `GHSA-7v5v-9h63-cj86`, `GHSA-5375-pq7m-f5r2`, `GHSA-99f4-grh7-6pcq` | `firebase@12.19.0`, `isSemVerMajor: true` | **Yes** | Same Firebase 12 migration decision. |
| `@grpc/proto-loader` | `false` | **runtime**; `firebase > @firebase/firestore > @grpc/proto-loader@0.6.13`; a second, non-vulnerable 0.7.4 copy is nested under `@grpc/grpc-js` | Inherited from `protobufjs` | `firebase@12.19.0`, `isSemVerMajor: true` | **Yes** | Same Firebase 12 migration decision. |
| `brace-expansion` | `false` | **dev-only**; `karma > minimatch > brace-expansion@1.1.11`; also `karma-coverage-istanbul-reporter > istanbul-lib-source-maps > rimraf > glob > minimatch > brace-expansion` | `GHSA-v6h2-p8h4-qcjw`, `GHSA-f886-m6hf-6m8v`, `GHSA-3jxr-9vmj-r5cp`, `GHSA-mh99-v99m-4gvg`, `GHSA-rgw5-rvv9-x895` | `true` | No major indicated | Lower-priority dev-only transitive finding. Prefer a reviewed Karma/Istanbul/rimraf lock refresh; acceptance is reasonable only with the build/test risk documented. |
| `engine.io` | `false` | **dev-only**; `karma > socket.io > engine.io@6.2.0` | `GHSA-r7qp-cfhv-p84w`, `GHSA-q9mw-68c2-j6m5`, `GHSA-r635-g3xr-vw7x`; also inherits `cookie` and `ws` | `true` | No major indicated | Lower-priority dev-only transitive finding. Remediate through the Karma/Socket.IO lock chain if build tooling remains healthy. |
| `firebase` | `true` | **runtime direct**; `firebase@9.15.0` | `GHSA-3wf4-68gx-mph8`; also propagates Firestore/gRPC/protobuf findings | `firebase@12.19.0`, `isSemVerMajor: true` | **Yes — 9 to 12** | This is the only high-severity direct application finding. There is no non-breaking security fix in the current 9.x line offered by npm; `9.23.0` is merely the wanted version and does not clear this audit. Plan Firebase 12 separately. |
| `flatted` | `false` | **dev-only**; `karma > log4js > flatted@3.2.7` | `GHSA-25h7-pfq9-p65f`, `GHSA-rf6f-7fwh-wjgh` | `true` | No major indicated | Lower-priority test-tool transitive finding; reviewed lock refresh is available. |
| `lodash` | `false` | **mixed, runtime-reachable**; `simplebar-angular > simplebar-core > lodash@4.17.21`; Karma also reaches the hoisted copy | `GHSA-r5fr-rjxr-66jc`, `GHSA-f23m-r3pf-42rh`, `GHSA-xxjr-mmjv-4gpg` | `true` | No major indicated | Production-reachable transitive high. Recommend refreshing the SimpleBar transitive graph or applying a reviewed, tested override/lock update if required. This is not a direct app-dependency finding. |
| `minimatch` | `false` | **dev-only**; `karma > minimatch@3.1.2`; also Istanbul/rimraf paths | `GHSA-3ppc-4f35-3m26`, `GHSA-7r86-cg39-jmmj`, `GHSA-23c5-xmqv-rm74` | `true` | No major indicated | Lower-priority dev/test transitive finding; refresh the available lock chain. |
| `picomatch` | `false` | **dev-only finding**; vulnerable `picomatch@2.3.1` via `karma > chokidar > anymatch > picomatch` and webpack-dev-server/micromatch paths. Other installed 4.x nodes are outside the reported vulnerable range. | `GHSA-3v7f-55p6-f55p`, `GHSA-c2c7-rcm5-vvqj` | `true` | No major indicated | The vulnerable nodes are dev-only; use a reviewed Karma/build-tool lock refresh. |
| `semver` | `false` | **dev-only finding**; vulnerable 5.7.1/6.3.x copies via `karma-coverage-istanbul-reporter > istanbul-lib-source-maps > make-dir > semver` and Babel/Istanbul paths. Other installed 7.8.5 nodes are outside the reported range. | `GHSA-c2qf-rxjj-qqgw` | `true` | No major indicated | Lower-priority dev/build transitive finding; refresh within available dependency ranges. |
| `socket.io-parser` | `false` | **dev-only**; `karma > socket.io > socket.io-parser@4.2.1` | `GHSA-cqmj-92xf-r6r9`, `GHSA-677m-j7p3-52f9`, `GHSA-2m8v-j782-fhvr` | `true` | No major indicated | Lower-priority Karma/Socket.IO transitive finding. |
| `tmp` | `false` | **dev-only**; `karma > tmp@0.2.1` | `GHSA-52f5-9888-hmc6`, `GHSA-ph9p-34f9-6g65` | `true` | No major indicated | Lower-priority test-tool transitive finding. |
| `ua-parser-js` | `false` | **dev-only**; `karma > ua-parser-js@0.7.31` | `GHSA-fhg7-m89q-25r3` | `true` | No major indicated | Lower-priority test-tool transitive finding. |
| `ws` | `false` | **dev-only finding**; vulnerable `ws@8.2.3` via `karma > socket.io > engine.io > ws`; a separate 8.21.3 build-server copy is outside the reported range | `GHSA-3h5v-q93c-6h6q`, `GHSA-58qx-3vcg-4xpx`, `GHSA-96hv-2xvq-fx4p` | `true` | No major indicated | Vulnerable nodes are dev-only; refresh the Karma/Socket.IO chain. |

### Moderate

| Package | `isDirect` | Scope and representative dependency chain | Advisory IDs represented | `fixAvailable` | Breaking? | Classification and recommendation |
|---|---|---|---|---|---|---|
| `@protobufjs/utf8` | `false` | **runtime**; `firebase > @firebase/firestore > @grpc/proto-loader > protobufjs > @protobufjs/utf8@1.1.0` | `GHSA-q6x5-8v7m-xcrf` | `true` | No major indicated | Production transitive finding with an npm-reported non-major fix path. Try a reviewed transitive/lock refresh independent of the broader Firebase major migration. |
| `follow-redirects` | `false` | **dev-only**; `karma > http-proxy > follow-redirects@1.15.2` | `GHSA-cxjh-pqwp-8mfp`, `GHSA-jchw-25xp-jwwc`, `GHSA-r4q5-vmmm-2653` | `true` | No major indicated | Lower-priority test-tool transitive finding. |
| `socket.io` | `false` | **dev-only**; `karma > socket.io@4.5.2` | `GHSA-25hc-qcg6-38wj`; also inherits `engine.io` | `true` | No major indicated | Lower-priority Karma/Socket.IO transitive finding. This is not the direct STOMP/SockJS client stack. |

### Low

| Package | `isDirect` | Scope and representative dependency chain | Advisory IDs represented | `fixAvailable` | Breaking? | Classification and recommendation |
|---|---|---|---|---|---|---|
| `cookie` | `false` | **dev-only**; `karma > socket.io > engine.io > cookie@0.4.2`; another 0.7.2 copy is under webpack-dev-server/Express and is outside the reported vulnerable range | `GHSA-pxg6-pf52-xh8x` | `true` | No major indicated | Lower-priority dev-only transitive finding. |
| `diff` | `false` | **dev-only**; `ts-node > diff@4.0.2` | `GHSA-73rr-hh4g-fpgx` | `true` | No major indicated | Lower-priority dev-only transitive finding. |
| `sweetalert2` | `true` | **runtime direct**; `sweetalert2@11.6.16` | `GHSA-mrr8-v49w-3333` | `true` | No major indicated | This is the direct app dependency with a non-breaking fix and should be bumped to the wanted/latest 11.26.25, then covered by the normal build/test pass. |

### Audit classification and priority

1. **Direct app dependency with a non-breaking fix:** `sweetalert2` (low). Recommend fixing now by moving to 11.26.25.
2. **Direct app dependency with only a breaking audit fix:** `firebase` (high), via `firebase@12.19.0` with `isSemVerMajor: true`. Do not auto-apply; schedule and test a Firebase 12 migration. A Firebase 9.23.0 within-range bump does not resolve the reported issue.
3. **Runtime transitive findings with non-major fixes reported by npm:** `websocket-driver` (critical), `lodash` (high), and `@protobufjs/utf8` (moderate). These should be remediated through reviewed lock/parent refreshes where practical, with SockJS/STOMP and SimpleBar smoke tests. They are not reasons by themselves to apply a Firebase 12 major.
4. **Remaining Firebase-family records:** transitive and only associated with npm's breaking Firebase 12 fix. If temporarily accepted, classify them as needs-care/accepted-with-justification and review periodically.
5. **Dev-only findings:** the other 15 package records. These include one critical `loader-utils` build-chain record. Dev-only status lowers runtime priority but does not make toolchain vulnerabilities harmless; a reviewed non-major lock refresh is still the first option.

## 3. Recently/deliberately added packages and pinning

| Purpose | Package | Installed | Declared range | Pinning status | Notes |
|---|---|---:|---:|---|---|
| Chat/STOMP | `@stomp/stompjs` | 7.3.0 | `^7.3.0` | **Caret; not pinned** | Resolves future compatible `<8.0.0` releases. |
| Chat/STOMP | `sockjs-client` | 1.6.1 | `^1.6.1` | **Caret; not pinned** | Current runtime dependency; reaches the critical `websocket-driver` finding through `faye-websocket`. |
| Chat/STOMP typings | `@types/sockjs-client` | 1.5.4 | `^1.5.4` | **Caret; not pinned** | Declared under runtime `dependencies`, although it is typings-only. |
| Chat/STORM state | `rxjs` | 7.8.2 | `^7.8.0` | **Caret; not pinned** | Common Angular peer dependency; allows compatible 7.x updates. |
| Translation | `@ngx-translate/core` | 18.0.0 | `^18.0.0` | **Caret; not pinned** | Allows compatible 18.x updates. |
| Translation | `@ngx-translate/http-loader` | 18.0.0 | `^18.0.0` | **Caret; not pinned** | Must remain compatible with core 18.x. |
| Refactor/UI | `simplebar-angular` | 3.3.2 | `3.3.2` | **Exact-pinned** | The only explicitly listed recent package that satisfies a strict direct-dependency pin policy. Its `simplebar-core` and Lodash transitives are not thereby exact-pinned. |
| Refactor/polyfill | `@juggle/resize-observer` | 3.4.0 | `^3.4.0` | **Caret; not pinned** | Declared in `devDependencies`. |
| Refactor/navigation | `metismenujs` | 1.3.1 | `^1.3.1` | **Caret; not pinned** | Wanted/latest is 1.4.0. |
| Refactor/build | `sass-loader` | 13.3.2 | `^13.2.0` | **Caret; not pinned** | Declared in runtime `dependencies` even though it is a build tool. Wanted is 13.3.3; latest 17.0.1 is a multi-major jump. |

**Pinning verdict: FAIL for a strict “pin everything” policy.** Of the ten listed recent/deliberately added packages, **one is exact-pinned (`simplebar-angular`) and nine use caret ranges**.

A range such as `^7.3.0` permits patch and minor updates within the same compatible major range when the manifest is resolved or refreshed. `npm ci` is deterministic while the lockfile remains unchanged, but the direct manifest itself is not immutable. If the team wants immutability, install future direct versions with `npm install --save-exact` (or `--save-dev --save-exact` for development tools) and commit the exact manifest plus lockfile together.

Additional checks:

- **STOMP typings:** `@types/stompjs` is not installed or declared. No separate STOMP typings package is needed because `@stomp/stompjs@7.3.0` ships its own `index.d.ts` and declares it through `typings`/conditional `exports`.
- **SockJS typings:** `sockjs-client` does not ship typings in the inspected package, so `@types/sockjs-client` is the expected companion.
- **Docker:** there are **no direct Docker SDK/client/orchestration npm dependencies** in `dependencies` or `devDependencies`; Docker remains infrastructure, not an application package. The lockfile does contain dev-only environment-detection transitives: `is-docker@3.0.0` and `is-inside-container@1.0.0`, reached through the Angular build chain (`@angular-devkit/build-angular > open > is-inside-container > is-docker`). These are not Docker deployment tooling.

## 4. Safe to bump now vs needs care

### Safe to bump now (wanted-version candidates)

These stay within the currently declared compatible ranges. They should still pass the normal build and test suite and be bumped in a reviewed dependency change:

- `@types/jasmine` 4.3.1 → 4.6.6
- `@types/jasminewd2` 2.0.10 → 2.0.13
- `@types/node` 18.11.17 → 18.19.130
- `bootstrap` 5.2.2 → 5.3.8
- `jasmine-core` 4.5.0 → 4.6.1
- `karma` 6.4.1 → 6.4.4
- `karma-chrome-launcher` 3.1.1 → 3.2.0
- `karma-jasmine-html-reporter` 2.0.0 → 2.3.0
- `metismenujs` 1.3.1 → 1.4.0
- `ng-otp-input` 1.8.5 → 1.9.3
- `sass-loader` 13.3.2 → 13.3.3
- `sweetalert2` 11.6.16 → 11.26.25 (**also resolves its direct low audit finding**)
- `ts-node` 10.9.1 → 10.9.2
- Non-major audit lock refresh candidates reported by npm: `websocket-driver`, `lodash`, `@protobufjs/utf8`, and the applicable dev-only transitive chains; these require targeted review rather than a blind broad lock refresh.

### Needs care / do not auto-apply

- **Firebase 9.15.0 → 12.19.0:** breaking direct dependency migration and the only npm-provided fix for the direct high finding and the major Firebase-family transitive findings. Test Auth, Firestore, database, and any compat-layer APIs. A 9.23.0 within-range bump is possible but does not remediate the audit.
- **Any Angular major bump:** **explicitly flagged as needs-care; never auto-apply.** Angular packages must move as one tested set, including framework, CLI, devkit, compiler CLI, language service, localize, and companion libraries. The current 22.2.0 set has no internal misalignment.
- **TypeScript 6.0.3 → 7.0.2:** major compiler/tooling change; confirm Angular compiler and test-runner compatibility first.
- **Zone.js 0.15.1 → 0.16.3:** a `0.x` minor change can be behaviorally breaking. Angular 22.2.0's peer range accepts both 0.15 and 0.16, but change detection, tests, and third-party Angular integrations still require review.
- **`ng-otp-input` 1.9.3 → 2.0.10:** latest is a major bump; stay on 1.9.3 unless the component API and behavior are intentionally migrated.
- **`sass-loader` 13.3.3 → 17.0.1:** latest crosses several majors and is a build-system migration. The 13.3.3 wanted update is the conservative option.
- **`@types/node` 18.19.130 → 26.6.2, `@types/jasmine` 4.6.6 → 6.0.0, and `jasmine-core` 4.6.1 → 7.0.2:** latest bumps are major and should be coordinated with TypeScript, Karma, and test typings.
- **Firebase-family transitive findings whose npm fix is Firebase 12:** do not force overrides without a compatibility test. If temporarily out of scope, accept with an explicit, time-bound justification.
- **Blind `npm audit fix`:** not recommended as an unattended action. It can refresh a broad set of lockfile nodes. Prefer targeted reviewed changes and then re-run the audit.
- **Strict pinning rollout:** pinning all recent dependencies is a manifest policy change and should be done deliberately, not as a side effect of this audit.

## 5. Exact commands to reproduce

Run from the project root:

```bash
cd /home/mkf/Projects/SmsTaxi_Dashboard/Skote_Angular_v4.1.0/Admin

# Human-readable and machine-readable outdated reports
npm outdated
npm outdated --json

# Full audit and dev-excluded classification
npm audit --json
npm audit --omit=dev --json

# Installed Angular/companion alignment
npm ls \
  @angular/core @angular/common @angular/compiler @angular/compiler-cli \
  @angular/forms @angular/router @angular/animations \
  @angular/platform-browser @angular/platform-browser-dynamic \
  @angular/localize @angular/language-service @angular/cli \
  @angular-devkit/build-angular @ng-bootstrap/ng-bootstrap \
  ngx-owl-carousel-o ngx-cookie-service \
  @ngx-translate/core @ngx-translate/http-loader zone.js \
  --depth=0

# Installed versions of recently added packages
npm ls \
  @stomp/stompjs sockjs-client @types/sockjs-client @types/stompjs rxjs \
  @ngx-translate/core @ngx-translate/http-loader simplebar-angular \
  @juggle/resize-observer metismenujs sass-loader \
  --depth=0

# Representative chain/evidence queries used for the audit table
npm explain loader-utils --json
npm explain firebase --json
npm explain websocket-driver --json
npm explain is-docker --json
```

For every remaining vulnerable package, the same form can be used, for example:

```bash
npm explain protobufjs --json
npm explain lodash --json
npm explain picomatch --json
```

No `npm install`, `npm update`, `npm audit fix`, build, or test command was run as part of this read-only audit.
