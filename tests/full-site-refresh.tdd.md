# Full-site refresh verification

Date: 2026-08-14

## User journeys

1. A visitor enters the original admission workspace from one of four task hubs and sees the same JSHS shell used by the homepage.
2. A visitor can use the existing school search, admission calculator, district selector, and private planner without being sent to an explanatory placeholder.
3. A mobile visitor can open a viewport-height searchable drawer, select a quick task, and continue with the drawer both visually and programmatically closed.
4. A direct hash URL renders the requested workspace before remote planner and district state finishes loading.
5. Calculator controls expose accessible names.

## TDD evidence

| Guarantee | RED checkpoint | GREEN checkpoint | Automated evidence |
| --- | --- | --- | --- |
| Unified functional shell | `12bdde0` | `09aac54` | `tests/full-site-refresh.test.mjs` |
| Mobile menu state | `956bbd5` | `f521ac2` | `tests/full-site-refresh.test.mjs` |
| Direct deep-link startup | `e46c2f3` | `ef73712` | `tests/full-site-refresh.test.mjs` |
| Calculator labels | `57034b5` | `e23868a` | `tests/full-site-refresh.test.mjs` |
| Four scalable task hubs | `c5f7f43` | `fc3a792` | `tests/information-architecture.test.mjs`, `tests/full-site-refresh.test.mjs` |
| Hamburger opens without focus jump | `b8ec665` | `1fffa59` | `tests/full-site-refresh.test.mjs` |
| Static drawer covers the viewport | `f87df8a` | `b95818d` | `tests/full-site-refresh.test.mjs` |
| District context stays consistent | `3d14300` | `970ce72` | `tests/full-site-refresh.test.mjs` |

## Verification result

- `pnpm test`: passed content validation, TypeScript, production build, and 42/42 tests.
- `pnpm lint`: 0 errors; 15 pre-existing legacy warnings remain.
- Production browser: at 390 × 844 the drawer measured the full 844 px viewport, locked background scrolling, kept both district labels synchronized, filtered the directory for「積分」, and routed「查校科」back to the original school-search workspace. At 1440 × 900 both homepage and guide Mega Menus stayed within the viewport with no horizontal overflow.
- Production deployment: Cloudflare Worker version `b52e8a9a-9ae3-4cea-bacf-8589b9995f1e`.

Code coverage instrumentation is not configured in this repository, so this report does not claim a percentage. The test suite combines static contracts, route integration checks, production build verification, and live browser journeys.
