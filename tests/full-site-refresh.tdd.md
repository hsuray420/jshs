# Full-site refresh verification

Date: 2026-08-14

## User journeys

1. A visitor enters the original admission workspace from any of the five public navigation items and sees the same JSHS shell used by the homepage.
2. A visitor can use the existing school search, admission calculator, district selector, and private planner without being sent to an explanatory placeholder.
3. A mobile visitor can open the menu, select a workspace destination, and continue with the menu both visually and programmatically closed.
4. A direct hash URL renders the requested workspace before remote planner and district state finishes loading.
5. Calculator controls expose accessible names.

## TDD evidence

| Guarantee | RED checkpoint | GREEN checkpoint | Automated evidence |
| --- | --- | --- | --- |
| Unified functional shell | `12bdde0` | `09aac54` | `tests/full-site-refresh.test.mjs` |
| Mobile menu state | `956bbd5` | `f521ac2` | `tests/full-site-refresh.test.mjs` |
| Direct deep-link startup | `e46c2f3` | `ef73712` | `tests/full-site-refresh.test.mjs` |
| Calculator labels | `57034b5` | `e23868a` | `tests/full-site-refresh.test.mjs` |

## Verification result

- `pnpm test`: passed content validation, TypeScript, production build, and 41/41 tests.
- `pnpm lint`: 0 errors; 15 pre-existing legacy warnings remain.
- Production browser: school search reduced 96 records to one matching record, the calculator produced a 111-point result and 76 total points, planner and mobile navigation opened correctly, and no console errors or warnings were emitted.
- Production deployment: Cloudflare Worker version `11a42109-544a-4fa6-969c-201b200e966b`.

Code coverage instrumentation is not configured in this repository, so this report does not claim a percentage. The test suite combines static contracts, route integration checks, production build verification, and live browser journeys.
