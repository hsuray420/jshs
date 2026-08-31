# JSHS.CC Feature Depth Remediation — Batch 2

Date: 2026-08-31. Scope was limited to the existing P2 surfaces named in the Batch 2 brief.

| Feature | Before | After / interaction | Persistence & source | States / mobile | Verification status | Remaining limitation |
| --- | --- | --- | --- | --- | --- | --- |
| `/planner/export` | PDF converted Chinese to `?`. | Generates A4, multipage PDF using the standard `MSung-Light` Traditional-Chinese CID font, including rank, school, program, note, date and page number; print and UTF-8 text remain. | Planner API or device-local planner. | Empty list and read error retained; mobile download exercised. | SMOKE_TESTED | PDF byte/content contract was browser-tested; visual rendering on every PDF reader still needs device matrix coverage. |
| `/schedule/tasks` | Add/complete only. | Add, edit, complete/cancel, delete with confirmation; system and custom tasks separated. | Custom tasks remain `localStorage` and say so explicitly. | Empty state; reload persistence and mobile actions browser-tested. | VERIFIED | No account sync or custom-task backend by design. |
| `/schools/open-days` | Could be mistaken for official feed. | Renamed as personal campus-open-day record; school/title/date/time/location/source URL/notes, edit/delete/complete/expired states. | Device-local only; source link is optional and absent records say personal record. | Empty state and mobile add/edit/delete tested. | VERIFIED | No official event feed or cross-device sync. |
| `/schools/[district]/[code]` | Field provenance was prose-level. | Added reusable field provenance contract and expandable source detail UI. | Existing school directory source/year/status. | Pending values stay pending. | SMOKE_TESTED | Field-by-field official ingestion is still incomplete. |
| `/schools/map` | Coordinates had no matching disclosure; map derived fallback minutes. | Coordinate API returns code/source/matched name/method/confidence/verified timestamp; low confidence is warned and missing coordinates remain visible. Map no longer invents time if route fails. | Overpass-derived coordinates with deterministic matching. | Low/no-coordinate mobile scenario browser-tested. | SMOKE_TESTED | Live Overpass/tile reliability is external. |
| `/account` | Several LINE failures collapsed into generic failure. | Distinguishes not configured, temporary failure, cancellation, timeout/state loss and expired session; local tools remain available signed out. | Existing LINE/session stack only. | Browser tested cancellation state. | SMOKE_TESTED | Real OAuth callback and expiry require connected LINE staging credentials. |
| `/notifications/*` | Channel labels and actual delivery did not align. | LINE is the only toggleable delivery channel; email/push use formal unavailable states; calendar declares ICS-only. | Existing LINE preference API only. | Signed-out / unavailable browser states tested. | SMOKE_TESTED | No email/push backend exists. |
| `/ai` | Site education questions shared one broad mode. | Adds `GENERAL`, `JSHS_DATA`, `OFFICIAL_SOURCE_REQUIRED`; source-required questions without verifiable records return an explicit non-answer. | Structured site retrieval / official links only. | API policy covered by unit tests. | SMOKE_TESTED | Live Workers AI answer/source rendering needs configured production AI verification. |

## Test evidence

- RED: `node --test tests/feature-depth-batch2.test.mjs` — 7 intended failures before implementation.
- GREEN: same test — 7 passed.
- Browser: `node tests/feature-depth-batch2.browser.mjs` — 5 scenarios passed: task lifecycle/persistence, personal open-day lifecycle, Chinese PDF download contract, account/notification states, and map confidence/no-coordinate state.
- Regression suite: `pnpm test` — passed after the final compatibility copy adjustment.
