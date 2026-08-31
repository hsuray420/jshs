# Batch 3 TDD evidence

User journeys were derived from the Official Data Foundation request.

| Guarantee | Command | Evidence |
| --- | --- | --- |
| A 115 source cannot become 116 without reference status | `node --test tests/data-foundation-batch3.test.mjs` | `YEAR_MASQUERADE` case passed. |
| Unregistered/invalid official and history records fail | same | missing source, unknown school and official-metric cases passed. |
| Community records stay non-official | same | community-history case passed. |
| Source content changes are detectable | same | deterministic hash/change-warning case passed. |
| Registry data is safe to build with | `pnpm run validate:data-foundation` | 36 sources, 44 history records and 172 mappings passed. |

RED evidence: the first command failed with `ERR_MODULE_NOT_FOUND` for `scripts/data-foundation.mjs`. GREEN evidence: all eight tests passed after implementing that module. Full build passed; full `pnpm test` has one unrelated assistant-policy expectation failure recorded in `POST_VERIFICATION_BACKLOG.md`.
