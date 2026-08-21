# Visitor Experience Streamline TDD Evidence

## Source plan

Derived from the user-approved plan to upgrade JSHS for visitor experience, then extended by the supplied Organic / Natural design system and the user's preference to update `jshs.cc` directly.

## User journeys

- As a student or parent, I can land on the homepage and choose one of four tasks immediately.
- As a visitor, I can use school search, calculator, planner, and navigation without seeing implementation details in public copy.
- As a visitor, I see one coherent organic visual system across the task-first homepage, navigation, school search, calculator, and planner.
- As a site maintainer, I can keep the existing routes, source trust contract, and legacy guide behavior intact while centralizing the new visual system.

## Task report

| # | What is guaranteed | Test file or command | Type | Result | Evidence |
|---|--------------------|----------------------|------|--------|----------|
| 1 | Homepage now exposes the compact four-task entry and canonical public route | `tests/rendered-html.test.mjs` | Unit/static | PASS | RED failed before implementation; GREEN passed in `pnpm run test:unit` |
| 2 | Public visitor task surfaces do not expose Cloudflare implementation wording | `tests/information-architecture.test.mjs` | Unit/static | PASS | RED failed on school/planner/tool copy; GREEN passed in `pnpm run test:unit` |
| 3 | Shared visual tokens expose the organic palette, paper texture, font stack, card, and pill primitives | `tests/rendered-html.test.mjs` | Unit/static | PASS | RED failed before tokens/classes existed; GREEN passed in `pnpm run test:unit` |
| 4 | Header and visitor task surfaces use shared organic primitives instead of one-off blue UI chrome | `tests/information-architecture.test.mjs` | Unit/static | PASS | RED failed before `jshs-floating-nav`, `jshs-organic-card`, and `jshs-pill-button`; GREEN passed in `pnpm run test:unit` |
| 5 | District data trust and legacy guide contracts remain valid | `pnpm run validate:content`, `pnpm run test:unit` | Integration/static | PASS | 15 districts validated; 50 tests passed |
| 6 | Deployment build succeeds with generated sitemap, guide CSS, and source snapshot | `pnpm run build` | Build | PASS | Vinext build completed |

## Verification commands

- `pnpm run test:unit` RED -> FAIL, 47/50 tests passed; missing organic tokens/classes caused the expected failures.
- `pnpm run test:unit` GREEN -> PASS, 50/50 tests.
- `pnpm run validate:content` -> PASS, 15 districts validated.
- `pnpm run typecheck` -> PASS.
- `pnpm run test:unit` -> PASS, 50/50 tests.
- `pnpm run build` -> PASS.
- `pnpm run lint` -> PASS with 0 errors and 15 pre-existing warnings in legacy static JS.
- `pnpm audit --prod --audit-level moderate` -> PASS, no known production vulnerabilities.
- `pnpm run cloudflare:deploy:direct` -> PASS, deployed to `jshs.cc/*` as Cloudflare Worker version `736c6a2b-8337-4b82-a94c-3bbdac691213`.
- Live smoke -> PASS for `/`, `/schools?district=ct`, `/tools?district=ct`, `/planner`, `/it_hs/guide.htm#calculator`, and `/design-tokens.css`.
- Browser QA -> PASS for desktop accessibility tree/network smoke and 390px mobile overflow check; only console issue observed was Cloudflare challenge script Shared Storage deprecation.
- Previous streamline verification: `pnpm run validate:content`, `pnpm run typecheck`, `pnpm run build`, `pnpm run lint`, and `pnpm audit --prod --audit-level moderate` all passed.
- `pnpm run lint` -> PASS with 0 errors and 15 pre-existing warnings in legacy static JS.
- `pnpm audit --prod --audit-level moderate` -> PASS, no known production vulnerabilities.
- `pnpm audit --audit-level moderate` -> FAIL on dev/build dependency path `. > vinext > image-size`; advisory requires `image-size >=2.0.3`, but npm registry reported no matching `2.0.3` release at verification time.

## Known gaps

- Browser QA is expected after the Cloudflare direct deployment to confirm the live `jshs.cc` surface renders the organic system correctly.
- Existing lint warnings in legacy static files remain unchanged.
- Full dependency audit still reports two high-severity `image-size` denial-of-service advisories in the Vinext build-time dependency chain. Production dependencies audit clean; track and update when `image-size@2.0.3` or a patched Vinext release is available.
