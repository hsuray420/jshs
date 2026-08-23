# jshs.cc site map final refresh — TDD evidence

## Source plan

User-provided source: `jshs-site-map-final.md`.

The implementation follows the uploaded sitemap as the product source of truth:
seven primary groups, shared district context for school / score / wish flows,
and non-blocking schedule / eligibility / knowledge flows.

## User journeys

1. As a student, I want to choose my admission district once so school search,
   score calculation, and wish planning use the same context.
2. As a student or parent, I want to manage deadlines, tasks, district
   comparisons, and calendar export from one schedule center.
3. As a student, I want a self-check that narrows special-qualification rules
   without pretending to make the official eligibility decision.
4. As a student or parent, I want to search plain-language admission terms and
   explore school-system directions before using a calculator.
5. As a visitor, I want the seven sitemap categories, notifications, account,
   search, and current-district controls available on desktop and mobile.

## RED / GREEN evidence

| Behaviour | Test target | RED evidence | GREEN evidence |
|---|---|---|---|
| Seven final menu groups and required labels | `tests/site-map-final.test.mjs`, `tests/navigation-menu.test.mjs` | Old catalog exposed four task groups and failed the final group assertion | Final seven-group catalog passed |
| District-gated hub routes and shared storage contract | `tests/site-map-final.test.mjs`, `tests/district-context-final.test.mjs` | `/schedule`, `/eligibility`, `/knowledge`, and `DistrictGate` were missing | All three gated routes use `DistrictGate`; storage/event contract passed |
| Schedule, eligibility, and knowledge routes are real surfaces | `tests/site-map-final.test.mjs` | Route file access failed for the three new hubs | Route access and component assertions passed |
| Fixed navigation context controls | `tests/site-map-final.test.mjs` | Header did not contain final labels or fixed context controls | Header labels, notification/account/search controls, and shared store passed |

## Verification commands

- `pnpm lint` — PASS (0 errors; existing legacy static assets still report warnings).
- `pnpm typecheck` — PASS.
- `pnpm test` — PASS: content validation, typecheck, build, and 70 Node tests.
- `pnpm build` — PASS: Vinext built all new routes including `/schedule`,
  `/eligibility`, `/knowledge`, `/account`, and `/notifications`.

## Intentional boundaries

- Official admission rules, dates, quotas, special qualifications, and formal
  submission remain source-trust boundaries; the UI labels reference / pending
  data and links back to official sources.
- Account login, LINE, push, and email integrations expose honest local-device
  settings and clear not-yet-connected states until credentials and external
  authorization are explicitly configured.
- Legacy static URLs remain routable for compatibility, while the primary
  public navigation and new task hubs use the uploaded final sitemap.
