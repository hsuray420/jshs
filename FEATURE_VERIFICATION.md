# JSHS.CC Production Smoke Test / Feature Verification

- Verification date: 2026-08-31
- Target: rebuilt local production Worker (`wrangler dev --local`), not the public deployment.
- Browser: headless Chromium via Playwright.
- Viewports: 320, 375, 390, 430, 768, 1024, 1280, and 1440 px.
- Evidence: 26 routes × 8 viewports = 208 first-load samples. Every sample returned HTTP 200, contained `header` and `main`, had no horizontal document overflow, and produced no browser console error. Raw machine output: `artifacts/feature-verification-browser.json`.

`auditStatus` is preserved from `FEATURE_AUDIT.md`. `verificationStatus` means `IMPLEMENTED` (source exists only), `SMOKE_TESTED` (browser happy-path evidence), `VERIFIED` (applicable happy/empty/error/mobile/persistence conditions exercised), or `FAILED` (a blocking browser failure).

| Route | auditStatus | verificationStatus | desktop | mobile | loading | empty | error | persistence | notes | blockingIssue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/schools` | COMPLETE | SMOKE_TESTED | Pass 1024–1440 | Pass 320–430 | Initial directory load observed | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Search/filter/API variants pending |
| `/schools/map` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial map load | Not exercised | Not exercised | N/A | 8/8 viewport entry passes | External OSM/provider simulation pending |
| `/schools/compare` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial directory load | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Add/remove and narrow comparison pending |
| `/schools/commute` | PARTIAL | SMOKE_TESTED | Pass | Pass 390 | Initial directory/geocode load | Unavailable route exercised | Mocked OSRM 500 | N/A | OSRM failure showed geometric distance and explicitly no minutes | Real external routing not verified |
| `/schools/history` | PARTIAL | SMOKE_TESTED | Pass 1280 | Pass 390 | Pass (delayed response) | Pass (official/community sections) | Pass: 500 and malformed payload are distinct | N/A | Community records remained outside official section; reload passed | No official history dataset exists |
| `/schools/groups` | PARTIAL | VERIFIED | Pass | Pass 390 | N/A (static schema) | Pass (unknown query) | N/A | N/A | Back navigation restored the explorer | Official program detail remains partial by audit |
| `/tools` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial rule load | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | 15-district calculation matrix pending |
| `/tools/rules` | COMPLETE | SMOKE_TESTED | Pass | Pass | N/A | Not exercised | N/A | N/A | 8/8 viewport entry passes | District expansion interaction pending |
| `/tools/placement` | PARTIAL | SMOKE_TESTED | Pass | Pass 390 | N/A | Pass: data-insufficient state | N/A | N/A | No “你的落點” or stability result rendered | Missing validated model/data remains intentional |
| `/tools/summary` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial local/account read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Account/local storage matrix pending |
| `/tools/history` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial local/account read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Account/local storage matrix pending |
| `/planner/custom` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial data read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Add/sort/save/reload pending |
| `/planner/recommend` | PARTIAL | SMOKE_TESTED | Pass | Pass 390 | N/A | Not exercised | N/A | Stored score loaded | Discovery reasons shown; no likelihood/stability labels | Candidate-save flow pending |
| `/planner/versions` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial version read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Restore/API variants pending |
| `/planner/export` | PARTIAL | SMOKE_TESTED | Pass | Pass | Initial planner read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Actual print/download artifact pending |
| `/schedule` | PARTIAL | SMOKE_TESTED | Pass | Pass | Initial schedule read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | API/date/progress branches pending |
| `/schedule/timeline` | PARTIAL | SMOKE_TESTED | Pass | Pass | Initial schedule read | Not exercised | Not exercised | N/A | 8/8 viewport entry passes | ICS/API variants pending |
| `/schedule/now` | COMPLETE | SMOKE_TESTED | Pass | Pass | Initial schedule read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Date/progress branches pending |
| `/schedule/tasks` | PARTIAL | SMOKE_TESTED | Pass | Pass | Initial task read | Not exercised | Not exercised | Not exercised | 8/8 viewport entry passes | Add/complete/reload pending |
| `/admission-guides` | PARTIAL | SMOKE_TESTED | Pass | Pass | N/A (local records) | Not exercised | N/A | N/A | 8/8 viewport entry passes | Filter and malformed-record coverage pending |
| `/news` | PARTIAL | SMOKE_TESTED | Pass | Pass 390 | N/A (local records) | Pass | N/A | N/A | Portal URLs did not render as announcements | Announcement ingestion absent by design |
| `/trust` | PARTIAL | SMOKE_TESTED | Pass | Pass | N/A | N/A | N/A | N/A | 8/8 viewport entry passes | Hub-link interaction pending |
| `/trust/sources` | PARTIAL | SMOKE_TESTED | Pass | Pass | N/A | N/A | N/A | N/A | 8/8 viewport entry passes | Registry filter coverage pending |
| `/trust/progress` | PARTIAL | VERIFIED | Pass 1280 | Pass 320–430 | N/A | N/A | N/A | N/A | Missing history capability was `PARTIAL`/`UNAVAILABLE`, never `VERIFIED` | Dataset coverage remains partial by audit |
| `/trust/methodology` | PARTIAL | SMOKE_TESTED | Pass | Pass | N/A | N/A | N/A | N/A | 8/8 viewport entry passes | Static disclosure page |
| `/trust/versions` | PARTIAL | SMOKE_TESTED | Pass | Pass | N/A | N/A | N/A | N/A | 8/8 viewport entry passes | Static real changelog page |

## Batch 1 guardrail scenarios

| Scenario | Browser result |
| --- | --- |
| OSRM route request returns 500 | Pass — no route minutes rendered; only geometric distance and the explicit unavailable-route message appeared. |
| Placement lacks verified admission history | Pass — showed data-insufficient state; no challenge/moderate/stable prediction output. |
| Recommendation lacks admission model | Pass — showed 志願探索 with explainable discovery reasons only; no rate/likelihood labels. |
| History contains community-only records | Pass — official section stayed empty; community reference remained separately labelled. |
| News has portal URL but no announcement record | Pass — formal empty state; portal was not rendered as a latest announcement. |
| District lacks historical data | Pass — trust matrix used `PARTIAL` or `UNAVAILABLE`, not `VERIFIED`. |

## Result summary

- VERIFIED: **2** routes
- SMOKE_TESTED: **24** routes
- IMPLEMENTED: **0** routes
- FAILED: **0** routes
- Mobile blocking issues: **0** detected in the 208 viewport-entry samples. This is not a substitute for the outstanding interaction cases listed above.
- Desktop blocking issues: **0** detected.
- API resilience issue fixed during verification: `/schools/history` now distinguishes a 500 service failure from a malformed response instead of treating both as generic no-data/failure.
- External dependencies not fully verified: live OpenStreetMap tiles, Overpass/Nominatim matching, OSRM availability/latency, account/LINE APIs, planner APIs, schedule APIs, and browser-native print/download behavior.

See `POST_VERIFICATION_BACKLOG.md` for intentionally unexecuted coverage and out-of-scope remediation.

## Batch 2 verification update — 2026-08-31

- `/schedule/tasks` and `/schools/open-days`: **VERIFIED** after mobile browser lifecycle, empty state, delete/edit and reload-persistence checks.
- `/planner/export`, `/schools/[district]/[code]`, `/schools/map`, `/account`, `/notifications/*`, `/ai`: **SMOKE_TESTED**. The relevant happy paths and available failure disclosures were exercised; their remaining external/API/device dependencies prevent an automatic VERIFIED upgrade.
- Batch 2 browser scenarios: 5 passed, 0 failed.

## Batch 3 data-contract verification — 2026-08-31

This batch changes ingestion/data contracts rather than adding a browser feature. Existing browser statuses are retained. Source-level validation passed: 15 hashed official guide snapshots, 36 registry sources, 44 community-only history records and 172 source-linked vocational mappings. Eight executable contract cases passed, including year masquerade, missing source, community/official separation, unknown school, source hash change and capability derivation.
