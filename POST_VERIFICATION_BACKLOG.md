# Post-verification backlog

This list records browser verification gaps and observed scope boundaries. It is not a feature-development plan and no item was silently implemented during this verification stage.

## P0 — verification coverage

1. Exercise `/tools` across all 15 districts with valid input, invalid input, 500, timeout and malformed API response; verify score history survives reload for device users and fails safely for signed-out account access.
2. Exercise `/planner/custom`, `/planner/versions`, and `/planner/export`: add, remove, note, up/down mobile ordering, reload persistence, restore, API failure, print preview and actual downloaded file contents.
3. Exercise `/schedule`, `/schedule/timeline`, `/schedule/now`, and `/schedule/tasks` with empty, 500, timeout and malformed API responses. Verify task add/complete/reload and record the known audit limitation that custom task deletion is absent.

## P1 — external/service-dependent verification

1. Run controlled live/degraded tests for map tiles, Overpass/Nominatim geocoding and OSRM timeout. The mocked OSRM 500 guardrail passed, but it is not an availability SLA test for those services.
2. Test unsigned account API behavior for score summary/history, planner state/versions, schedule and saved preferences; then separately test authenticated persistence using a non-production test account.
3. Test `/schools` search/filter/result navigation, `/schools/compare` 2–4 school comparison/removal on 320 px, map controls, and header/mobile drawer close behavior.

## P2 — existing audit findings, not changed here

1. `/schools/map` still needs field-level coordinate provenance and degradation coverage; it was not altered because this stage prohibits new product work.
2. `/planner/export` still has the audit-recorded Chinese PDF encoding limitation; actual output artifact validation is required before its audit status can improve.
3. No verified 15-district official admission-history dataset or admission-prediction model exists. Do not re-enable placement or likelihood labels until their documented data/model contracts are met.
4. `/news` remains an official-information entrance until verified announcement ingestion exists; no portal URL may be represented as an announcement.

## Batch 2 follow-up

1. Validate generated Chinese PDFs visually on iOS Safari, Android Chrome, macOS Preview and a second PDF reader; include long notes spanning three or more pages.
2. Run connected LINE OAuth tests for cancellation, expiry and actual notification delivery. The browser suite verifies public states without real credentials.
3. Add official field-level school source ingestion before changing school-detail provenance from `PARTIAL` to `COMPLETE`.
4. Validate Workers AI live answers for each mode with a configured non-production model; do not treat source-policy tests as a claim that official records are complete.

## Batch 3 data foundation follow-up

1. Ingest only genuine 116 official documents after capture, source registration and year validation; do not transform 115 content into 116.
2. Add official announcement ingestion with captured source snapshots before changing `/news` from its current official-information entrance.
3. Add official historical admission outcomes with record-level URLs before any official history result is shown.
4. Replace pending vocational curriculum fields only after a validated official or school-authoritative source is registered.
5. Reconcile the out-of-scope AI assistant test expectation: `tests/ai-assistant.test.mjs` still expects `SITE_EDUCATION_DATA`, while the current policy uses `JSHS_DATA`. This caused the otherwise complete `pnpm test` run to report one failure.
