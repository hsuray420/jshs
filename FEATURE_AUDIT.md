# JSHS.CC Feature Depth Audit

- Audit date: 2026-08-31
- Scope: all Next.js `app/**/page.tsx` routes, Header primary/menu routes, Footer links, homepage CTAs, and the public API routes those pages depend on.
- Method: source-level inspection of route components, client components, data files and API handlers. This is not a production click-through test; a production smoke test is still required before changing a status to `COMPLETE`.
- Status vocabulary is deliberately limited to: `COMPLETE`, `PARTIAL`, `TEXT_ONLY`, `PLACEHOLDER`, `BROKEN`, `CONTENT_PAGE`.

## Decision rules

`COMPLETE` means the current implementation accepts a user input/selection, executes a real local or server operation, returns a visible result sourced and labelled appropriately, and has usable empty/loading/error handling where it loads data. It does **not** mean the result is an official admission decision.

`PARTIAL` means some operation is real, but a required input/result/data-source/coverage/state is missing or unreliable. `TEXT_ONLY` is a route with explanatory copy and links but no substantive operation. `CONTENT_PAGE` is intentional reading/reference content allowed by the brief. `PLACEHOLDER` and `BROKEN` are used only where a route is respectively a non-functional stand-in or does not resolve as advertised.

Column key: `Text` = only explanatory copy; `Fake` = inert/falsely represented action found; `Placeholder` = stand-in or unavailable content; `Mock` = hard-coded/sample data presented as operational data; `Result` = an actual user-visible outcome; `States` = empty/loading/error (E/L/X). `—` means not applicable to a content page.

## Executive result

| Priority | Meaning |
| --- | --- |
| P0 | A core decision feature can present an insufficiently credible output or substitute an estimate for the promised result. |
| P1 | Important route is primarily text, incomplete reference data, or lacks a required interaction/state. |
| P2 | Real feature with material coverage, provenance, mobile, or resilience gaps. |
| P3 | Content/reference pages or working secondary routes; no immediate feature-depth intervention. |

### P0 — do not describe these as complete today

1. `/tools/placement` **模擬考落點** — prediction is disabled: the page now states that comparable years, verified sources, full school/program data, normalization and model validation are absent. It remains `PARTIAL` until the required data/model contract exists.
2. `/planner/recommend` **志願探索** — history-based score ranking has been removed. The page now filters real school-directory records by district, type, ownership, group and commute-city preference, and explains each match. It remains `PARTIAL` because it is discovery, not admission prediction.
3. `/schools/commute` **通勤比較** — route results now disclose `osrm_route`, `geometric_estimate`, or `unavailable`; a geometry-only fallback shows distance only and never minutes. It remains `PARTIAL` without public-transit or real-time traffic data.

### P1 — important depth gaps

1. `/schools/history` now has school, program, district and year filters plus separate official/community sections, but has no ingested official history records.
2. `/schools/groups` now has a school-directory-backed group schema, search, filters and relevant-school links, but lacks officially sourced program-level detail.
3. `/admission-guides` and `/news` now use a unified searchable/filterable official-information record model; announcements remain empty until a verified ingestion pipeline exists.
4. `/trust/progress`, `/trust/methodology`, and `/trust/versions` now expose a 15-district matrix, disclosed constraints, and an actual change event; the underlying datasets remain partial.
5. `/notifications/[feature]` repeats explanatory copy above a settings workspace, making individual feature routes misleading when the setting is absent/unavailable.

## Navigation and entry-point coverage

The Header has eight first-level labels and its mobile drawer renders every `content/site-map.json` child. The Footer repeats core routes plus support, legal, status and trust routes. Homepage CTAs lead to `/tools/rules`, `/districts`, `/admission-guides`, `/schools`, `/tools`, `/planner`, and schedule surfaces via the quick-action components. All destinations are covered below; duplicated aliases are marked as redirects rather than counted as separate features.

## Public feature routes

| Route | Feature / type | Status / priority | Current user operation and result | Text | Fake | Placeholder / mock | Data source | States | Audit finding |
| --- | --- | --- | --- | ---:| ---:| --- | --- | --- | --- |
| `/` | Homepage / navigation hub | PARTIAL / P2 | Selects next steps and opens real tools; no task result itself. | No | No | Static district cards show only first 3 districts. | `district-metadata.json` | — | A legitimate hub, but the “15 區都能開始規劃” claim is not independently demonstrated here. |
| `/districts` | District selection | COMPLETE / P3 | Chooses and persists a district context, then routes to tools. | No | No | No | local storage + district metadata | E | Functional setup state; verify mobile persistence in production. |
| `/search` | Site search | PARTIAL / P2 | Submits query; returns school/article/term/date/source matches. | No | No | Search corpus is hard-coded/static and not a full official index. | school directory, news, metadata, in-code terms | E | Good empty result; no loading/error because server-rendered. Does not search all official documents or all page content. |
| `/schools` | 全國校科查詢 / FUNCTION_PAGE | COMPLETE / P3 | Search; filter district, program, ownership, city, quota/history; count; inspect detail; add to planner. | No | No | No | `/it_hs/school-directory.json` | E/L/X | Meets the stated minimum. Results are capped at 120 and “school／校科” depends on source granularity. |
| `/schools/[district]` | District school list | PARTIAL / P2 | Shows district-specific catalog/detail links. | No | No | Depends on local generated directory only. | school directory | E/L/X | Validate route-level empty/error behavior; no separate public API provenance screen. |
| `/schools/[district]/[code]` | School detail | PARTIAL / P2 | Reads a school record and links to official/planner surfaces. | No | No | Some fields can be “待確認”. | school directory/history | E | A detail page exists, but source/field provenance and explicit unavailable-data states need verification. |
| `/schools/history` | 歷年錄取 / FUNCTION_PAGE | PARTIAL / P1 | Search, district, school, program and year filters; separates official records from community references. | No | No | Current 44 records are `community`; official result section has a formal empty state. | `/it_hs/historical-records.json` | E/L/X | No ingested official history yet; record-level source URLs are absent for current community rows. |
| `/schools/map` | 學校地圖 / FUNCTION_PAGE | COMPLETE / P2 | Filters schools, loads coordinates, renders Leaflet/OpenStreetMap markers/popups, focuses marker, opens school detail. | No | No | Coordinates are matched from Overpass/Nominatim, with incomplete-match count. | school directory + OSM/Overpass/Nominatim | L/X | Real map and markers exist. Mark as complete only for map minimum; coordinate provenance/match quality and external-service failure resilience remain P2. |
| `/schools/compare` | 學校比較 / FUNCTION_PAGE | COMPLETE / P3 | Filters/selects 2–4 schools; creates parallel comparison; removal via checkbox; replacement supported. | No | No | No | school directory | E/L/X | Uses formal directory fields and has an explicit “select at least 2” empty state. Check narrow-screen horizontal comparison usability. |
| `/schools/commute` | 通勤比較 / FUNCTION_PAGE | PARTIAL / P1 | Selects district/schools, geocodes home, calls OSRM route, accepts actual minutes and calculates weekly total. | No | No | OSRM route, geometry-only distance and unavailable states are visibly distinct; no fallback minutes. | OSM/OSRM/Nominatim + user input | E/L/X | No public-transit/traffic source; geometry is not a commute-time result. |
| `/schools/cost` | 費用試算 / FUNCTION_PAGE | COMPLETE / P3 | Inputs semester/month costs and years; calculates total/per-year. | No | No | Defaults are zero, not fabricated fees. | user input + disclosed formula | — | Meets calculator minimum; it deliberately does not claim school-specific official pricing. |
| `/schools/alumni` | 學長姐分享 / FUNCTION_PAGE | COMPLETE / P3 | Filters real submitted reviews; selects school and submits anonymous review for moderation. | No | No | Empty state invites first real submission; no sample UGC. | `/api/school-reviews` + directory/history | E/L/X | Correct formal empty state; public-content moderation/abuse controls should be separately reviewed. |
| `/schools/open-days` | 校園開放日 / personal list | PARTIAL / P2 | Adds/removes user-entered event and persists locally. | No | No | Not an official-open-day feed despite menu wording. | user input/local storage | E | It is a personal tracker, not “依官方公告整理”; lacks edit, official source verification and cross-device save. |
| `/schools/groups` | 群科介紹 / content+discovery | PARTIAL / P1 | Searches and filters a technical-group schema; each group links to the real school directory query. | No | No | Uses existing school-directory group labels; program detail fields honestly show pending. | `technicalGroupDirectory` + school directory | E | Official program-level content, courses and progression data have not been ingested. |
| `/tools` | 成績積分試算 / FUNCTION_PAGE | COMPLETE / P3 | Selects district; renders rule-specific facts form; calls calculation; shows total/breakdown/rule year/tie-breakers/source; saves history. | No | No | Uses 115 rules while clearly labelling 116 as pending. | admission rule JSON + `/api/admission/calculate` | E/L/X | Core calculation engine is real and does not ask for final score. Production validation of all 15 rule implementations remains necessary. |
| `/tools/rules` | 積分規則 / FUNCTION_PAGE | COMPLETE / P3 | Selects any of 15 districts; expands category/field rules, caps, tie-breakers and official source. | No | No | No | admission rule JSON/research fields | — | Meets stated minimum; data freshness must be maintained once 116 rules publish. |
| `/tools/placement` | 模擬考落點 / FUNCTION_PAGE | PARTIAL / P1 | Shows the current district context and links to score calculation and historical-reference exploration. | No | No | No prediction is calculated or shown. | Official-rule context; no prediction dataset/model | — | Data/model contract is incomplete: comparable years, verified records, full program coverage, normalization, confidence and validation are missing. |
| `/tools/summary` | 個人積分摘要 / FUNCTION_PAGE | COMPLETE / P3 | Reads latest completed calculation from account API or device and displays breakdown. | No | No | No | `/api/admission/scores` or local storage | E | Correct empty state. It reads real prior calculations, not a fabricated summary. |
| `/tools/history` | 成績歷史 / FUNCTION_PAGE | COMPLETE / P3 | Reads saved snapshots and lets a device user clear local history. | No | No | No | account API or local storage | E | Persists actual calculation records; needs production check of member API failure feedback. |
| `/planner` | My planner hub | COMPLETE / P3 | Detects prior score and gates the two planner modes. | No | No | No | score API/local storage | E | A valid routing/gating hub. |
| `/planner/custom` | 自己排 / FUNCTION_PAGE | COMPLETE / P3 | Searches/filter schools, adds/removes, drag or button-sorts, saves notes and state, persists snapshots. | No | No | No | planner data + API/local storage | E/L/X | Meets minimum. Mobile drag alternative via up/down buttons exists; member/non-member persistence behavior is disclosed. |
| `/planner/recommend` | 志願探索 / FUNCTION_PAGE | PARTIAL / P1 | Filters real school-directory records by district, type, ownership, group and commute-city preference; users can add candidates. | No | No | Candidate reasons are displayed; score is context only and never a prediction input. | `getPlannerSchools()` / school directory | E | No admission-prediction model or validated historical dataset; discovery must not be read as a likelihood result. |
| `/planner/versions` | 版本紀錄 / FUNCTION_PAGE | COMPLETE / P3 | Loads snapshots, views version contents, compares counts, restores version. | No | No | No | planner API/local snapshots | E/L/X | Satisfies create-through-automatic-snapshot, view and restore. Explicit manual naming/copy is absent but restore makes a new snapshot. |
| `/planner/export` | 列印／下載 / FUNCTION_PAGE | PARTIAL / P2 | Reads planner; calls print; downloads text and generated PDF. | No | No | Generated PDF replaces non-ASCII Chinese text with `?`. | planner API/local storage | E/L/X | The buttons act, but the downloadable PDF is not a usable Chinese-language output. Fix font/encoding before calling it complete. |
| `/planner/official-platform` | Official platform links | PARTIAL / P1 | Shows supporting copy and external official platform links component. | Mostly | No | Availability/content depends on separate component/data. | official outbound links | E | Correctly avoids pretending to submit a choice, but must verify each district/year link and show formal unavailable state. |
| `/planner/check` | Planner health legacy route | COMPLETE / P3 | Redirects to custom planner health-check panel. | — | No | No | redirect | — | Compatibility route; no duplicate feature. |
| `/planner/share` | Planner share | PARTIAL / P2 | Opens a read-only share surface. | No | No | Need verify `PlannerShare` has authenticated token/state and expiry. | planner share state | E/L/X | Not linked in the main IA; audit security and actual share creation before promoting. |
| `/schedule` | 升學總覽 / FUNCTION_PAGE | PARTIAL / P2 | Displays timeline summary, countdown, next event, progress and system tasks. | No | No | Default/fallback tasks are static. | schedule API + rule schedule + local progress | E/X | Uses date/district/progress, but API load failure only emits a message and static fallback still appears; distinguish official data from default planning checklist. |
| `/schedule/timeline` | 重要時程 / FUNCTION_PAGE | PARTIAL / P2 | Shows dated/status-labelled timeline, official links, district comparison and ICS download. | No | No | Falls back to previous-year reference/static schedule. | schedule API + 115 schedule metadata | E/X | No visible per-item updated date for every event; status/source is good but partial when 116 data absent. |
| `/schedule/now` | 現在該做什麼 / FUNCTION_PAGE | COMPLETE / P3 | Computes next action from current district and locally recorded progress; takes user to next tool. | No | No | No | current date + district + progress local storage | E | Meets stated behavioral minimum; action tree is simple but not fixed copy. |
| `/schedule/tasks` | 我的待辦 / FUNCTION_PAGE | PARTIAL / P2 | Adds and completes custom tasks; system tasks auto-reflect progress. | No | No | Custom tasks have no delete action and are local-only. | local storage + progress | E | Fails requested minimum because user cannot delete a task; lacks cross-device saving. |
| `/schedule/countdown` | Countdown legacy route | COMPLETE / P3 | Redirects to schedule overview. | — | No | No | redirect | — | Compatibility route. |
| `/schedule/compare` | Schedule compare legacy route | COMPLETE / P3 | Redirects to timeline comparison. | — | No | No | redirect | — | Compatibility route. |
| `/schedule/export` | Schedule export legacy route | COMPLETE / P3 | Redirects to timeline ICS export. | — | No | No | redirect | — | Compatibility route. |
| `/schedule/open-days` | Open-days legacy route | COMPLETE / P3 | Redirects to school open-days manager. | — | No | No | redirect | — | Compatibility route. |
| `/admission-guides` | 官方簡章與規則 / information library | PARTIAL / P1 | Searches/filter official-information records by district, year, type and issuer; opens the original source. | No | No | Record cards distinguish `official_original` from `jshs_curated`. | `OfficialInformationRecord` from guide catalog/district metadata | E | Current records are guides/platforms; announcement ingestion and richer publish dates remain incomplete. |
| `/admission-guides/schedule` | Official schedule library | PARTIAL / P2 | Reads district schedule cards and opens official source. | No | No | 115 references while 116 pending, labelled. | schedule metadata/PDF references | E | Has true empty/pending state; lacks search/filter, unified update field and event countdown. |
| `/news` | 官方資訊入口 / official info | PARTIAL / P1 | Uses the same official-information filters but displays only verified announcement records. | No | No | With no announcement ingestion it renders a formal empty state; official portals are not shown as notices. | `OfficialInformationRecord` | E | No verified announcement records are currently ingested. |
| `/news/[slug]` | News article | CONTENT_PAGE / P3 | Reads a JSHS article. | — | No | Editorial static content. | `lib/news` | — | Allowed content; each article should keep source/update metadata. |
| `/news/{schools,exam,rules,career,parents,strategy}` | News category aliases | CONTENT_PAGE / P3 | Category reading routes. | — | No | Editorial/static. | `lib/news` | — | Content pages; no tool claim. |
| `/knowledge` | Guide index | CONTENT_PAGE / P3 | Opens permitted content/exploration pages. | — | No | No | in-code links | — | Intentional navigation page. |
| `/knowledge/admission-basics` | 升學入門 | CONTENT_PAGE / P3 | Interactive reading steps link to tools. | — | No | Static instructional steps. | in-code curated content | — | Explicitly allowed content-first page. |
| `/knowledge/rules` | 志願與積分 concept guide | CONTENT_PAGE / P3 | Opens concepts and links precise rules/planner. | — | No | Static instructional cards. | in-code curated content | — | Explicitly allowed content-first page. |
| `/knowledge/glossary` | 升學百科 | CONTENT_PAGE / P3 | Searches hard-coded glossary terms/expands explanations. | — | No | Small six-term corpus. | in-code curated content | E | Content page with a useful local search, but not an exhaustive encyclopedia. |
| `/knowledge/fit-quiz` | 生涯探索 | CONTENT_PAGE / P3 | Answers three prompts and receives a non-admission comparison direction. | — | No | Simple deterministic quiz, disclosed as non-decision. | in-code curated options | E | Allowed content/exploration; should not be described as a predictive recommendation. |
| `/knowledge/updates` | 升學動態 | CONTENT_PAGE / P3 | Reads JSHS-curated articles. | — | No | Static editorial feed. | `lib/news` | — | Allowed content page; distinguish from `/news` official information. |
| `/eligibility` | 特殊入學與資格 | PARTIAL / P2 | Multi-step facts questionnaire evaluates routes and gives reasons/sources/actions. | No | No | Rule coverage/individual qualification cannot be official adjudication. | admission path engine + guides | E/X | Real conservative checker with sources; needs documented coverage matrix and 116 rule data before `COMPLETE`. |
| `/eligibility/[topic]` | Special eligibility workspaces | PARTIAL / P2 | Selects a condition, gets a rule-based route signal and checks a local checklist. | No | No | Checklist says it saves locally but code shown does not persist `checked`. | admission path engine + guides | E | A real result, but persistence claim appears inaccurate and it is only a narrow/partial eligibility model. |
| `/trust` | Data & trust hub | PARTIAL / P2 | Navigates to source/status/progress/method/version/report pages. | No | No | Summary claims exceed evidence surfaced here. | trust constants/metadata | — | Valid hub, but its cards should not imply 15 fully verified functional districts. |
| `/trust/sources` | Data sources | PARTIAL / P1 | Displays registry rows for rules, school directory, history, schedule, coordinates, official links and recommendation inputs. | No | No | Every row includes issuer, district, year, URLs, timestamps and status. | `sourceRegistry` | — | Registry is honest about partial/unavailable datasets; it needs continued per-dataset source expansion. |
| `/trust/status` | Data status | PARTIAL / P2 | Shows service/source year and latest static update. | Mostly | No | Static four metrics. | metadata/constants | — | No per-dataset/per-district verification or actual runtime health. |
| `/trust/progress` | 15-district build status | PARTIAL / P1 | Shows each district's rules, school data, history, schedule, map and planner status with source year/last verified. | No | No | Matrix status is sourced from the capability registry. | `capabilityRows` | — | Several capabilities remain PARTIAL/UNAVAILABLE; matrix is status disclosure, not proof of universal completion. |
| `/trust/methodology` | Methodology | PARTIAL / P1 | Discloses calculation inputs/outputs, absent model version/data, social-history constraints and OSRM limitations. | No | No | It explicitly states data-not-used-for-prediction. | trust registry + current feature contracts | — | Needs a future model contract only if prediction is reintroduced. |
| `/trust/versions` | Data version history | PARTIAL / P1 | Displays actual dated change events with datasets, areas, reason and source. | No | No | Contains only the real Batch 1 event; no fabricated history. | `dataChangeLog` | — | More events will accumulate only as real data/function changes occur. |
| `/trust/report` | Error report | COMPLETE / P3 | Opens a real external Google error-report form. | No | No | No in-app status after external submission. | Google Form | — | Valid external report entry; keep version/page context instructions. |
| `/trust/credibility` | About / credibility / cookie info | CONTENT_PAGE / P3 | Reads platform boundaries and correction process. | — | No | Static prose. | in-code curated content | — | Allowed about/reference content, though cookie detail is not separate. |
| `/trust/privacy` | Privacy policy | CONTENT_PAGE / P3 | Reads legal document. | — | No | No | generated legal text | — | Allowed legal page. |
| `/trust/terms` | Terms | CONTENT_PAGE / P3 | Reads legal document. | — | No | No | generated legal text | — | Allowed legal page. |
| `/support` | Donation/support | COMPLETE / P3 | Loads donation configuration and opens external payment service. | No | No | Depends on configured URL, with non-ready handling. | `/api/site-config` + payment provider | L/X | Not an education tool; external-action boundary is correctly disclosed. |
| `/support/[status]` | Donation result | PARTIAL / P3 | Presents status callback/support copy. | Mostly | No | Provider callback verification must be audited. | support status route | E | Do not represent payment success unless verified by provider. |
| `/account` | Account/data management | PARTIAL / P2 | Sign-in/session/account actions. | No | No | External LINE setup may be unavailable. | member auth/API | E/L/X | Requires production auth-flow test and data-export verification. |
| `/account/[feature]` | Account feature pages | PARTIAL / P2 | Feature-specific support/settings surface. | Mixed | No | Some are explanatory wrappers. | member API/local state | E/L/X | Audit each generated feature after its settings component is inspected; do not label generic wrapper copy as functionality. |
| `/notifications` | Notification preferences | PARTIAL / P2 | Enables/disables member notification preferences. | No | No | Sending relies on configured LINE/back-end channels. | notification preference API | E/L/X | Preference management appears real; sending/delivery and email label need end-to-end evidence. |
| `/notifications/{push,line,email,calendar}` | Notification subfeatures | PARTIAL / P1 | Links to/manage settings through a feature workspace. | Mixed | No | `email` route is labelled “LINE 週報”; feature naming conflicts. | notification APIs / schedule | E/L/X | Need a real feature state/result per route, clearer delivery-channel naming and unavailable/permission errors. |
| `/ai` | AI assistant | PARTIAL / P2 | Sends question, streams answer, persists local/member conversation, retry/error states. | No | No | General AI output is not guaranteed sourced. | `/api/assistant`, local IndexedDB/member storage | E/L/X | Real interaction, but admission claims need citations/source-bound answers and robust unavailable-provider state. |

## Dynamic-route expansion

The table above audits the behavior shared by each dynamic route. These are listed explicitly so that every existing `page.tsx` route is accounted for.

| Existing route | Covered by audit row | Status |
| --- | --- | --- |
| `/knowledge/[topic]` | `/knowledge/admission-basics`, `/knowledge/rules`, `/knowledge/glossary`, `/knowledge/fit-quiz` | `CONTENT_PAGE` |
| `/news/career` | `/news/{schools,exam,rules,career,parents,strategy}` | `CONTENT_PAGE` |
| `/news/exam` | `/news/{schools,exam,rules,career,parents,strategy}` | `CONTENT_PAGE` |
| `/news/parents` | `/news/{schools,exam,rules,career,parents,strategy}` | `CONTENT_PAGE` |
| `/news/rules` | `/news/{schools,exam,rules,career,parents,strategy}` | `CONTENT_PAGE` |
| `/news/schools` | `/news/{schools,exam,rules,career,parents,strategy}` | `CONTENT_PAGE` |
| `/news/strategy` | `/news/{schools,exam,rules,career,parents,strategy}` | `CONTENT_PAGE` |
| `/planner/[feature]` | `/planner/versions`, `/planner/export`, `/planner/official-platform` | mixed; see individual rows |
| `/trust/[slug]` | `/trust/sources`, `/trust/status`, `/trust/progress`, `/trust/methodology`, `/trust/versions`, `/trust/report`, `/trust/credibility`, `/trust/privacy`, `/trust/terms` | mixed; see individual rows |

## Internal and administration routes

These are real routes but are not advertised as public education features. They should not be used to inflate public feature completion.

| Route | Type | Status | Finding |
| --- | --- | --- | --- |
| `/admin/login` | Admin authentication | PARTIAL | Real LINE login/error UI; requires production role/allow-list test. |
| `/admin` | Admin workbench | PARTIAL | Operational forms exist; out of public-feature scope and requires authorization/security audit. |
| `/admin/content` | Content editor | PARTIAL | Real CMS form; publication side effect must remain access-controlled and tested. |
| `/admin/code` | Code/admin surface | PARTIAL | Internal route; audit authorization and deployment side effects separately. |

## Supporting API route inventory

The following APIs support the above pages and were inspected for feature-depth implications: admission calculation/scores, planner/state/versions/finalize, schedule, school directory CSV, school geocode, commute, school reviews, notifications/preferences, assistant/conversations, site content/config, files, LINE auth, and admin routes.

Notable findings:

- `/api/admission/calculate` is the basis for the real score calculator; its inputs and resulting breakdown are surfaced in the UI.
- `/api/commute` calls public OSRM and returns an explicit error on failure, but both map and commute UI can derive a local heuristic fallback. This is the P0 transparency issue.
- `/api/school-geocode` dynamically matches OSM/Overpass schools to local directory data. It returns match counts but no per-marker confidence/source date.
- No API was found that provides a verified, normalized 15-district admission-history dataset or a validated placement/recommendation model.
- No API was found for persisted personal schedule tasks; current custom tasks are device-local.

## Required remediation order (no implementation performed in this audit)

### P0

1. Change placement and planner recommendation to an explicit no-result state wherever verified, comparable historical data and a documented model are absent. Build a data provenance/normalization/model-version contract before re-enabling recommendation output.
2. In commute/map results, label OSRM route output versus geometric estimate distinctly; preferably suppress time when route provider fails, retain only “distance unavailable/estimate unavailable,” and document source/time/traffic limitations.
3. Add regression tests that fail if these three routes show recommendation/route-looking results from static defaults or inadequate records.

### P1

1. Replace the history explorer data contract with `school + year + program + source URL + source type + verified-at`; add year selection and a true empty state.
2. Build group/subject directory data and routes before keeping “群科介紹” in a functional school-discovery menu.
3. Create an official-information record model with title, issuer, date, school year, district, type, source URL, update time and `official_original`/`jshs_curated` flag; then add search/filtering.
4. Replace trust prose/claims with live source registry, 15-district capability matrix, version events and report-status path.
5. Give notification subroutes a real setting/delivery outcome or collapse them into content pages until available.

### P2

1. Add delete and optional account persistence to custom tasks; add edit/source fields to open days.
2. Fix Chinese-capable PDF output and test print/download on mobile browsers.
3. Add field-level provenance, coordinate confidence and unavailable-result states to school details/maps.
4. Perform mobile browser tests for filter controls, school comparison table, drag/order fallback, map controls, calculators and downloads.
5. Run a production smoke test for every `COMPLETE` route and record the test date/result alongside this audit.

## Explicit non-findings

- No `Lorem ipsum`, no `console.log`-only button, and no obvious “功能開發中” toast was found in the inspected public feature components.
- The alumni page uses a true zero-content state rather than fabricated testimonial cards.
- The cost calculator uses user-entered values and a disclosed formula rather than invented school fees.
- Existing 115-source data is generally labelled as 115 while 116 official data is pending; this is preferable to relabelling old rules as current official rules.

## Browser verification status — 2026-08-31

The audit status above remains a source-level depth judgement. `verificationStatus` below is a separate browser-evidence layer from a rebuilt local production Worker, driven by headless Chromium at 320, 375, 390, 430, 768, 1024, 1280 and 1440 px. `VERIFIED` is intentionally reserved for routes whose applicable primary, empty/error and responsive behaviors were exercised; it does not change a `PARTIAL` audit status to `COMPLETE`.

| Route | auditStatus | verificationStatus | Evidence summary |
| --- | --- | --- | --- |
| `/schools` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Search/filter mutation and directory failure simulation remain outstanding. |
| `/schools/map` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Live map-tile/coordinate-provider degradation was not simulated. |
| `/schools/compare` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Narrow-screen add/remove comparison interaction remains outstanding. |
| `/schools/commute` | PARTIAL | SMOKE_TESTED | Eight viewport checks plus mocked OSRM 500: distance-only state shown; no fabricated minutes. |
| `/schools/history` | PARTIAL | SMOKE_TESTED | Desktop/mobile, loading, empty, 500, malformed payload, reload, and source separation passed. |
| `/schools/groups` | PARTIAL | VERIFIED | Desktop/mobile, search-empty state, and browser back navigation passed; static dataset has no async/persistence requirement. |
| `/tools` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. All 15 district calculation/error combinations remain outstanding. |
| `/tools/rules` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. District-selector interaction remains outstanding. |
| `/tools/placement` | PARTIAL | SMOKE_TESTED | Mobile/desktop and no-prediction state passed; it displays no prediction labels. |
| `/tools/summary` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Account/local-storage success/error persistence remains outstanding. |
| `/tools/history` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Account/local-storage history persistence remains outstanding. |
| `/planner/custom` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Add/sort/save/reload scenario remains outstanding. |
| `/planner/recommend` | PARTIAL | SMOKE_TESTED | Mobile scenario with stored score passed; discovery reasons appear and admission likelihood labels do not. |
| `/planner/versions` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Version restore and API failure remain outstanding. |
| `/planner/export` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. Print/download artifact verification remains outstanding. |
| `/schedule` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. Schedule API failure and date/progress branch coverage remain outstanding. |
| `/schedule/timeline` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. ICS download and API variants remain outstanding. |
| `/schedule/now` | COMPLETE | SMOKE_TESTED | Eight viewport first-load checks passed. Date/progress branch coverage remains outstanding. |
| `/schedule/tasks` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. Add/complete/persistence interaction remains outstanding. |
| `/admission-guides` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. Filter mutation and invalid record response remain outstanding. |
| `/news` | PARTIAL | SMOKE_TESTED | Mobile/desktop formal empty state passed; portal URLs were not rendered as announcements. |
| `/trust` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. |
| `/trust/sources` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. |
| `/trust/progress` | PARTIAL | VERIFIED | Eight viewport capability-matrix rendering passed; districts missing history did not show `VERIFIED`. |
| `/trust/methodology` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. |
| `/trust/versions` | PARTIAL | SMOKE_TESTED | Eight viewport first-load checks passed. |

## Batch 2 audit update — 2026-08-31

| Route | auditStatus | verificationStatus | Update |
| --- | --- | --- | --- |
| `/planner/export` | PARTIAL | SMOKE_TESTED | Chinese-safe multipage PDF replaces ASCII replacement; keep PARTIAL until reader/device matrix finishes. |
| `/schedule/tasks` | PARTIAL | VERIFIED | Custom task edit/delete/confirmation and local persistence now exist; cross-device persistence remains absent. |
| `/schools/open-days` | PARTIAL | VERIFIED | Explicit personal-record positioning, required record fields and lifecycle actions replace implied official-feed wording. |
| `/schools/[district]/[code]` | PARTIAL | SMOKE_TESTED | Field provenance schema/detail added; formal per-field official coverage remains partial. |
| `/schools/map` | PARTIAL | SMOKE_TESTED | Deterministic coordinate confidence and no-coordinate states added; external coverage remains partial. |
| `/account` | PARTIAL | SMOKE_TESTED | Error states now distinguish configuration, cancellation, timeout and expired session. |
| `/notifications/*` | PARTIAL | SMOKE_TESTED | Non-delivery channels no longer expose an enable switch. |
| `/ai` | PARTIAL | SMOKE_TESTED | Official-source-required intent is conservative when sources are missing. |

## Batch 3 data-foundation update — 2026-08-31

| Surface | auditStatus | verificationStatus | Update |
| --- | --- | --- | --- |
| `/schools/history` | PARTIAL | SMOKE_TESTED | History import now requires source IDs, keeps all 44 existing records as community references, and rejects unknown schools or unsupported official claims. |
| `/schools/groups` | PARTIAL | VERIFIED | Group/department schema is source-linked; 172 school-directory department names map to groups, while curriculum details remain pending. |
| `/admission-guides` | PARTIAL | SMOKE_TESTED | Official-information records now carry year status and registry source IDs; 115 cannot be presented as 116. |
| `/news` | PARTIAL | SMOKE_TESTED | Still no announcement records; official portals remain platforms, not news. |
| `/trust/sources` | PARTIAL | SMOKE_TESTED | Registry now exposes generated source IDs, retrieval/verification state and hashes for stored official PDFs. |
| `/trust/progress` | PARTIAL | VERIFIED | Capability status is derived per district/dataset; community history cannot produce `VERIFIED`. |
