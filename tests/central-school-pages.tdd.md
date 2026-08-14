# Central district school page pilot — TDD evidence

Date: 2026-08-14

## Source and user journeys

Journeys were derived from the user's request to test the new feature in the central district and replace the visible homepage JSHS abbreviation with the full Chinese name.

1. A student can search a central-district school and open a stable, shareable school detail URL.
2. A student can verify school, department, quota, location, academic-year, and official-source data before using planning tools.
3. A student can continue from a school page to Cloudflare planner, central-district calculation, or wish planning.
4. Search engines can discover all 96 central-district school URLs with canonical metadata and structured data.
5. The homepage brand reads「全國國中升學資訊網」at desktop and mobile breakpoints.

## RED / GREEN checkpoints

| Guarantee | RED checkpoint | GREEN checkpoint | Evidence |
| --- | --- | --- | --- |
| CSV parser produces 96 unique schools | `cdf2ef3` | `498efe7` | `tests/central-school-pages.test.mjs` |
| Stable school detail route and decision content | `cdf2ef3` | `498efe7` | `app/schools/ct/[code]/page.tsx` |
| Search-to-detail link and direct query | `cdf2ef3` | `498efe7` | `components/school-explorer.tsx` |
| 96 school URLs in sitemap | `cdf2ef3` | `498efe7` | `scripts/generate-sitemap.mjs` |
| Full Chinese homepage brand | `cdf2ef3` | `498efe7` | `components/site-header.tsx`, `components/site-footer.tsx` |

## Verification

- RED: `node --test tests/central-school-pages.test.mjs` — 0 passed, 5 failed for the intended missing routes, parser, links, sitemap entries, and full-name brand.
- GREEN: `node --test tests/central-school-pages.test.mjs` — 5 passed, 0 failed.
- Full suite: `pnpm test` — production build completed; 47 passed, 0 failed.
- Lint: `pnpm lint` — 0 errors; 15 pre-existing legacy warnings.
- Production smoke test: homepage, school search, sample school page, sitemap, and health endpoint returned 200; an unknown school code returned 404.
- Production browser: sample code `060323` filtered to one result and linked to `/schools/ct/060323`; 390, 768, and 1440 px layouts had no horizontal overflow and no console errors.
- Production sitemap: 96 `/schools/ct/` locations.

Coverage instrumentation is not configured in this repository. The parser has direct unit coverage; the route, integration, SEO, and brand guarantees are covered by static contracts, a full production build, and read-only live browser QA. No production planner record was created during QA.
