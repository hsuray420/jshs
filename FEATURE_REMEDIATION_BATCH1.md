# Feature Depth Remediation — Batch 1

Date: 2026-08-31

This batch changes only the seven approved surfaces. `PARTIAL` is retained wherever the required source data or validation is still absent.

| Surface | Before | After | Data / interaction | Misleading behavior removed | State coverage / remaining gap |
| --- | --- | --- | --- | --- | --- |
| `/tools/placement` | Community reference scores were turned into 挑戰／適中／穩定 lists. | Prediction is disabled; page states `目前資料不足，無法提供可信的落點判斷` and links to calculation/history. | Reads district/score context; links to real historical explorer. | No score-based admission grouping, likelihood or “your placement” result. | Static honest insufficient-data state. Still `PARTIAL`: needs the full input and model contracts, 15-district coverage, normalization, confidence and validation. |
| `/planner/recommend` | Same history-score comparison appeared as system recommendation. | Repositioned as **志願探索**. | Filters actual school-directory records by district, school type, ownership, group and commute city; user can add candidates to the shared list. Every result states why it appears. | Removed 挑戰／適中／穩定 and score-derived admission implications. | Success/empty/error for saved-plan operations; responsive filter controls. Still `PARTIAL`: discovery only, no admission-prediction model. |
| `/schools/commute` | Straight-line distance divided by a fixed speed could look like a route time. | Route result is labelled `osrm_route`, `geometric_estimate`, or `unavailable`. | OSRM road route displays distance/minutes plus OpenStreetMap/OSRM limitations; geometry fallback shows distance only. | No minute result when OSRM is unavailable. | Loading while route request is active; unavailable/error-like fallback distinguishes no route from zero results. Still `PARTIAL`: no public transit or real-time traffic source. |
| `/schools/history` | Community score cards without full filters or an official/community boundary. | Auditable historical explorer. | Search plus district, school, program and year filters; `HistoricalRecord` includes id, school/program/year, record type, score, source metadata, verification and notes. | Community records cannot visually masquerade as official history. | Loading, fetch error, official empty state and community empty state. Still `PARTIAL`: 44 current records are community references; no official history has been ingested. |
| `/schools/groups` | Static group cards. | Technical-group exploration backed by a named schema. | Search and group filter; each group links to the live school-directory query. | No AI-written course or progression claims. | Formal no-result empty state; no async source. Still `PARTIAL`: official program-level content is `PENDING` and shown as 待補資料. |
| `/admission-guides` + `/news` | Link collections; `/news` implied a latest-announcement feed. | Unified `OfficialInformationRecord` library. `/news` is now **官方資訊入口** and only lists announcement records. | Search; district, school year, type, issuer filters; cards expose issuer/date/year/type and original source. | An official portal is not rendered as an announcement; 115 is not renamed as 116. | Library has success/empty states; `/news` shows a formal no-announcements state. Still `PARTIAL`: announcement ingestion has not been built. |
| `/trust/sources`, `/trust/progress`, `/trust/methodology`, `/trust/versions` | Broad prose and uncheckable claims. | Source registry, 15-district capability matrix, method constraints and actual changelog. | Registry exposes dataset/district/year/issuer/URL/timestamps/status; matrix shows six capability cells per district. | Removed claim-like “all 15 open” presentation and invented version history. | Static registry views; responsive overflow tables. Still `PARTIAL`: rows disclose partial/unavailable coverage rather than claim completion. |

## Acceptance checks

| Scenario | Result |
| --- | --- |
| A. OSRM unavailable | `geometric_estimate` shows straight-line kilometres only; no minutes are calculated. |
| B. No admission history | Placement remains insufficient-data, never produces challenge/balanced/stable results. |
| C. Community-only history | Community reference records render in their own labelled section, separate from official empty state. |
| D. Group search misses | Formal “找不到符合條件的群別” empty state. |
| E. No official announcement records | `/news` renders no-announcements state; portals are not converted to announcements. |
| F. Rules but no history | Capability matrix shows distinct `VERIFIED` rule and `UNAVAILABLE`/`PARTIAL` history cells. |
| G. 116 pending | Official-information records retain actual school year; UI states that 115 is not rewritten as 116. |

## Verification

- `pnpm run typecheck`
- Targeted regression suite: `node --experimental-strip-types --test tests/feature-depth-batch1.test.mjs tests/school-history-and-sharing.test.mjs tests/planner-recommendation.test.mjs tests/navigation-menu.test.mjs tests/decision-centers.test.mjs`
- Full verification: `pnpm test` — 200/200 tests passed (includes content validation, typecheck and production build).

`pnpm run lint` also passed with 0 errors; its remaining warnings are pre-existing public legacy-script/image advisories.
