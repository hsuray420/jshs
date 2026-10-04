# School Admin Publishing — TDD Evidence

## Source

Journeys and acceptance criteria were derived from the 2026-10-04 production Admin request. No executable instructions from the request were treated as trusted commands.

## User journeys

1. An editor can change human-readable school fields and save a D1 draft without changing GitHub or the public site.
2. A reviewer can preview an exact field diff against the latest canonical CSV.
3. An administrator or owner can publish a validated change by stable `school_code` and receive a Git commit SHA.
4. A stale edit rebases over unrelated GitHub changes but stops when the same field changed, showing loaded/latest/proposed values.
5. Operators can search immutable, field-level audit records and inspect data health and GitHub sync status.

## RED → GREEN report

| Guarantee | Test target | Type | RED evidence | GREEN evidence |
|---|---|---|---|---|
| Domain fields map centrally to canonical CSV columns | `tests/school-admin-workflow.test.mjs` | Unit | Missing `school-admin-fields.mjs` caused `ERR_MODULE_NOT_FOUND` | Focused suite 16/16 passed |
| One edit preserves untouched CSV row bytes and line endings | `tests/school-admin-workflow.test.mjs` | Unit | Existing writer regenerated the complete CSV | Target row test passed; untouched quoted row remains byte-identical |
| Field-level concurrency distinguishes rebase from conflict | `tests/school-admin-workflow.test.mjs` | Unit | Missing workflow module | Unrelated and same-field cases passed |
| Draft, preview, publish, audit, role and same-origin contracts exist | `tests/school-admin-production-contract.test.mjs` | Integration contract | 4/4 tests initially failed | 4/4 passed after implementation |
| School publish calls are rate limited per administrator/action | `tests/school-admin-production-contract.test.mjs` | Security contract | Route and D1 table were absent | Contract passed after D1 atomic counter was added |
| Canonical data remains valid | `pnpm run validate:data` | Data integration | Not applicable | PASS: 7 enabled regions, 495 source rows, 448 schools |

## Commands and results

- `node --test tests/school-admin-workflow.test.mjs tests/school-admin-production-contract.test.mjs tests/school-admin-management.test.mjs tests/admin-canonical-source.test.mjs tests/admin-architecture.test.mjs` — 16 passed, 0 failed.
- `pnpm run typecheck` — passed.
- `pnpm run lint` — 0 errors, 23 pre-existing warnings.
- `pnpm run build` — passed; `/admin/audit`, `/admin/data`, `/admin/schools`, and `/api/admin/schools/:schoolCode` included.
- `pnpm run release:gate` — passed.
- `pnpm run test:unit` — 316 passed, 0 assertion failures, 1 cancelled. `homepage-header-hero-regression.test.mjs` stalled while scanning user-owned untracked duplicate generated JSON files under `public/data/schools/by-code`; those files were preserved and excluded from this task.

## Coverage and known gaps

The repository has no configured coverage command or threshold reporter, so a numerical 80% coverage claim cannot be made. Pure workflow, CSV preservation, validation, and static integration contracts are covered. Authenticated browser E2E, a real GitHub write, Actions deployment, post-deploy front-end confirmation, and data-level rollback require production credentials/external mutation and were not performed in this local implementation run.

## Checkpoints

- RED: `8004add test: define production school admin workflow`
- GREEN: `c34ba31 feat: add safe school data admin publishing`
