# JSHS revised school-search foundation — TDD evidence

Source journeys were derived from the requested JSHS revamp.

| Guarantee | Test | Result |
| --- | --- | --- |
| Search cards are search-first and place trust metadata in detail views | `tests/jshs-revamp.tdd.test.mjs` | PASS |
| A visitor explicitly requests native location; map navigation contains no Google Maps link | `tests/jshs-revamp.tdd.test.mjs` | PASS |
| Historic records route only to school details | `tests/jshs-revamp.tdd.test.mjs` | PASS |
| Donation entry, payment result language, and user-provided open-day labelling are present | `tests/jshs-revamp.tdd.test.mjs` | PASS |

RED: all four new tests failed before implementation (`node --test tests/jshs-revamp.tdd.test.mjs`).

GREEN: the same command passed after implementation. `pnpm typecheck`, `pnpm test:unit`, and `pnpm build` also passed. Lint passed with 17 pre-existing warnings; no new lint errors were introduced.

Known follow-up: ECPay test credentials, signed order generation, callback verification, and D1 transaction persistence need deployment-specific environment variables and a migration before payment collection can be enabled. No payment success is accepted from the browser.
