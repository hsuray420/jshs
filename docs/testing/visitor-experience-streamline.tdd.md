# Visitor Experience Streamline TDD Evidence

## Source plan

Derived from the user-approved plan to upgrade JSHS for visitor experience and a minimal, faster visual direction before GitHub deployment.

## User journeys

- As a student or parent, I can land on the homepage and choose one of four tasks immediately.
- As a visitor, I can use school search, calculator, planner, and navigation without seeing implementation details in public copy.
- As a site maintainer, I can keep the existing routes, source trust contract, and legacy guide behavior intact while tightening the visual system.

## Task report

| # | What is guaranteed | Test file or command | Type | Result | Evidence |
|---|--------------------|----------------------|------|--------|----------|
| 1 | Homepage now exposes the compact four-task entry and canonical public route | `tests/rendered-html.test.mjs` | Unit/static | PASS | RED failed before implementation; GREEN passed in `pnpm run test:unit` |
| 2 | Public visitor task surfaces do not expose Cloudflare implementation wording | `tests/information-architecture.test.mjs` | Unit/static | PASS | RED failed on school/planner/tool copy; GREEN passed in `pnpm run test:unit` |
| 3 | Shared visual tokens use 8px cards and no forced section viewport height | `tests/rendered-html.test.mjs` | Unit/static | PASS | RED failed on 24px token; GREEN passed in `pnpm run test:unit` |
| 4 | District data trust and legacy guide contracts remain valid | `pnpm run validate:content`, `pnpm run test:unit` | Integration/static | PASS | 15 districts validated; 49 tests passed |
| 5 | Deployment build succeeds with generated sitemap, guide CSS, and source snapshot | `pnpm run build` | Build | PASS | Vinext build completed |

## Verification commands

- `pnpm run validate:content` -> PASS, 15 districts validated.
- `pnpm run typecheck` -> PASS.
- `pnpm run test:unit` -> PASS, 49/49 tests.
- `pnpm run build` -> PASS.
- `pnpm run lint` -> PASS with 0 errors and 15 pre-existing warnings in legacy static JS.
- `pnpm audit --prod --audit-level moderate` -> PASS, no known production vulnerabilities.
- `pnpm audit --audit-level moderate` -> FAIL on dev/build dependency path `. > vinext > image-size`; advisory requires `image-size >=2.0.3`, but npm registry reported no matching `2.0.3` release at verification time.

## Known gaps

- No browser screenshot or visual QA was run because this task did not request browser testing, and the Sites workflow avoids unsolicited browser inspection.
- Existing lint warnings in legacy static files remain unchanged.
- Full dependency audit still reports two high-severity `image-size` denial-of-service advisories in the Vinext build-time dependency chain. Production dependencies audit clean; track and update when `image-size@2.0.3` or a patched Vinext release is available.
