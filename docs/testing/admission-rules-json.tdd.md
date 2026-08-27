# 115 admission rules JSON TDD evidence

The journeys were derived from the supplied development specification.

| Guarantee | Test | Result |
|---|---|---|
| CT and Changhua metadata and field definitions come from the supplied research JSON | `tests/admission-rules.test.mjs` — research metadata test | PASS |
| Required research fields missing means `incomplete` and `totalScore: null` | `tests/admission-rules.test.mjs` — missing fields test | PASS |
| Existing score regressions and district preference/exam boundaries remain green | `tests/admission-rules.test.mjs` | PASS (7/7) |

RED was observed before the JSON loader and incomplete result path (`sourceId` and `status` were undefined). GREEN was confirmed with `node --test --experimental-strip-types tests/admission-rules.test.mjs`.

Coverage is not configured in this repository. The remaining 13 districts intentionally remain reference-only because no verified 115 rule JSON was supplied; the implementation does not invent their formulas.
