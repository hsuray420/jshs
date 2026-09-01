# JSHS Feature Visual System Redesign

Last refreshed: 2026-09-01

## Source Of Truth

`lib/feature-themes.ts` remains the visual theme inventory. `content/route-metadata.json` now provides the route-level product metadata used by sitemap, search, and route QA.

## FeatureHero Status

The automated route audit checks the current FeatureHero requirement for the main feature routes:

- Schools: `/schools`, history, map, compare, commute, cost, alumni, open-days.
- Tools: `/tools`, rules, placement, summary, history.
- Planner: `/planner`, custom, recommend.
- Schedule: `/schedule`, timeline, now, tasks.
- Official/guide/trust: `/admission-guides`, `/knowledge`, `/eligibility`, `/trust`.

Routes that are intentionally utility/private (`/search`, `/ai`, `/account`, `/notifications`) are not treated as public marketing-style feature pages. They are still searchable internally, noindex, and excluded from sitemap.

## Mobile QA State

Current CSS includes:

- Safe-area offsets for the floating AI button and AI panel.
- Bottom-navigation clearance on mobile.
- `SiteIntroModal` viewport-constrained height and scroll behavior for 320px, 375px, and 390px.
- Reduced-motion handling through `prefers-reduced-motion`.

## Remaining Visual Work

Do not resolve school-life or school-detail presentation issues in this batch. After the 604/604 school-life research completes, re-audit school detail pages and school comparison in a clean branch.

## Verification

Use:

```bash
pnpm run audit:routes
pnpm run audit:search
pnpm run audit:leakage
```

For release QA, run the requested viewport overflow checks against `/`, `/search`, `/ai`, `/trust`, `/account`, `/notifications`, `/guide` or current knowledge entry, `/schedule`, and `/admission-guides`.
