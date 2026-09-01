# Feature Page Audit

Last refreshed: 2026-09-01

This file is now backed by `content/route-metadata.json` and `scripts/audit-route-metadata.mjs`. The route registry is the shared source for sitemap inclusion, noindex decisions, canonical paths, search categories, and route QA.

## Automated Gate

Run:

```bash
pnpm run generate:sitemap
pnpm run audit:routes
pnpm run audit:search
pnpm run audit:leakage
```

Current gate coverage:

| Check | Source |
| --- | --- |
| Route exists | `content/route-metadata.json` + `app/**/page.tsx` |
| Metadata registry exists | `content/route-metadata.json` |
| Sitemap excludes noindex routes | `scripts/audit-route-metadata.mjs` |
| FeatureHero requirement | `scripts/audit-route-metadata.mjs` |
| Mobile QA markers | `app/globals.css` checked by audit |
| Presentation leakage markers | `scripts/audit-presentation-leakage.mjs` |

## Current Status

| Route group | Status | Notes |
| --- | --- | --- |
| `/schools`, school tools | COMPLETE | FeatureHero and canonical pages present. School detail life-data changes are deferred to 604/604. |
| `/tools`, score tools | COMPLETE | Public calculator and rule pages are indexable; personal history/summary/placement are noindex and excluded from sitemap. |
| `/planner` and planner tools | COMPLETE / PRIVATE | Functional routes exist; all planner routes are noindex and excluded from sitemap because they handle personal planning state. |
| `/schedule`, `/schedule/timeline` | COMPLETE | Public schedule routes remain in sitemap. |
| `/schedule/now`, `/schedule/tasks` | PRIVATE | Personalized/task routes are noindex and excluded from sitemap. |
| `/admission-guides`, `/news`, `/knowledge`, `/eligibility` | COMPLETE | Public information routes are searchable and sitemap-controlled by the registry. |
| `/trust`, `/trust/*` | COMPLETE | Trust, privacy, terms, source, status, and methodology pages are registered and indexable where public. |
| `/search`, `/ai`, `/account`, `/notifications` | PRIVATE / UTILITY | Discoverable inside site search, but noindex and excluded from sitemap. |
| `/it_5/it_5.html` | LEGACY | Static compatibility page still exists; canonical discoverability points to `/knowledge/fit-quiz`, and it is not in sitemap. |

## Deferred Until 604/604

- School detail `就學生活` presentation and integrations.
- School comparison lodging/transport data.
- School-life filter, provenance UI, ingestion, audit, schema, and records.
- Any school component changes likely to conflict with the 604-school research batch.

## Presentation Scan Rules

- Do not expose calculation identifiers, function names, schema keys, raw enums, JSON, `undefined`, `null`, `NaN`, or `[object Object]` in customer UI.
- Use display-only wording for calculation explanations; it must never affect score semantics.
- Preserve intentional user-facing trust statuses such as official, verified, partial, community reference, and previous-year reference.
