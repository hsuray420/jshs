# JSHS Feature Visual System Redesign

## Theme tokens

`lib/feature-themes.ts` is the single feature-theme inventory. Every theme defines `primary`, `primaryHover`, `surface`, `surfaceStrong`, `border`, `text`, `icon`, and `illustrationAccent`.

| Feature family | Theme | Primary colour |
| --- | --- | --- |
| 找學校 | `schools` | Blue |
| 算成績 | `tools` | Green |
| 我的志願 | `planner` | Amber |
| 升學日程 | `schedule` | Purple |
| 官方資訊 | `official` | Blue |
| 升學指南 | `guide` | Purple |
| 資料與信任 | `trust` | Slate |

## FeatureHero rules

- `FeatureHero` is placed 24–32px below the site header and replaces a category-only full-width colour band.
- Desktop uses a 1200px container, 310px minimum height, text left and a feature-specific SVG composition right.
- Mobile stacks text then illustration, uses 20–24px padding, a 22px radius, and limits illustration height to 158px.
- Workspace follows without unintentional blank space. `/schools` deliberately overlaps its search card on desktop only.

## Illustration inventory

Reusable, local SVG components live in `components/feature-illustrations.tsx`:

| Illustration | Intended pages |
| --- | --- |
| `school-search` | `/schools` |
| `score-calculator` | `/tools` |
| `planner` | `/planner` and planner workspaces |
| `schedule` | `/schedule` |
| `guide` | `/knowledge` and guide pages |
| `trust` | `/trust` |

## Reference-page work completed

- Homepage quick entry is now a full-width, minimum-396px section with a balanced 2×2 action grid, short descriptions, arrows, and restrained blue/green/amber/purple background geometry.
- `/schools` now starts with a blue feature hero and distinct school/search illustration. The primary search input leads the workspace; four common filters form a grid and quota/history are collapsed under more conditions. Result count, active filters, clear, and planner action are grouped in one toolbar.
- `/tools` now starts with a green calculator feature hero and distinct calculator/check illustration. Existing calculator behavior, rule provenance, and API contracts are unchanged.

## Screenshot QA

Local Playwright checks completed for `/`, `/schools`, and `/tools` at 390px and 1440px: all pages returned 200 and had no horizontal overflow. The desktop and mobile screenshots were manually inspected for clipping, hero-to-workspace spacing, and illustration/text collision. The only browser-console entry was an existing 404 asset request; no page request failed.

Before release, repeat the same screenshot inspection at 320, 375, 430, 768, 1024, and 1280px, and include Phase C routes when they receive their Heroes.

## Remaining visual-system work

The reusable themes and illustrations are ready, but Phase C has not been applied to all remaining function pages. The next pass should give `/planner`, `/schedule`, `/admission-guides`, `/knowledge`, `/trust`, and their child workspaces feature-specific Heroes and compositions without changing Batch 1–3 data semantics.
# FULL SITE ROLLOUT

Phase C extends the existing FeatureHero, `featureThemes`, spacing tokens and illustration module—no second visual system was introduced. Full route inventory and the coverage gate are in [FEATURE_PAGE_AUDIT.md](FEATURE_PAGE_AUDIT.md).

| Route group | Parent theme | Hero | Illustration | Workspace | Desktop | Mobile | Status |
|---|---|---|---|---|---|---|---|
| Schools subpages | BLUE | FeatureHero | history/map/compare/commute/cost/alumni/open-day | purpose-specific tools | pending screenshot QA | pending screenshot QA | PARTIAL |
| Tools subpages | GREEN | FeatureHero | rules/placement/summary/history | rule, score and history workspaces | pending screenshot QA | pending screenshot QA | PARTIAL |
| Planner hub/custom/recommend | AMBER | FeatureHero | planner/recommendation | planner board | pending screenshot QA | pending screenshot QA | PARTIAL |
| Schedule views | PURPLE | FeatureHero | schedule/timeline/now/todo | schedule workspace | pending screenshot QA | pending screenshot QA | PARTIAL |
| Guide hub/topics | PURPLE | FeatureHero / CompactFeatureHero | guide/topic compositions | guide reading navigation | pending screenshot QA | pending screenshot QA | PARTIAL |
| Official guides | BLUE | FeatureHero | official-document | guide library | pending screenshot QA | pending screenshot QA | PARTIAL |

Still incomplete: school detail pages, planner versions/export/official platform, official news/article pages, trust pages, eligibility detail pages and the remaining utility surfaces. These are recorded as `PARTIAL`/`MISSING` rather than counted as covered.
