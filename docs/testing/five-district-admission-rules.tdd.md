# 五區免試入學試算 TDD 證據

## User journeys

- 學生選擇基北、中投、臺南、高雄或桃連區後，看到該區的滿分骨架、欄位說明與比序提示。
- 學生輸入五科會考、作文、志願序及多元學習資料後，取得分項分數、總分與同分比序點。
- 學生輸入特殊身分或不完整資料時，分數仍受該區上限限制，且頁面保留待補資料提醒。

## RED / GREEN evidence

| Stage | Command | Result |
|---|---|---|
| RED | `node --test tests/admission-rules.test.mjs` before implementation | 4 tests failed because the existing engine treated every request as中投區 and had no five-district fields. |
| GREEN | `node --test tests/admission-rules.test.mjs` | 4/4 passed. |
| Full suite | `pnpm test` | 76/76 passed; content trust, typecheck, build and all Node tests passed. |

## Guarantees

| Guarantee | Test |
|---|---|
| Five district full-score cases stay within 100/108 point limits | `tests/admission-rules.test.mjs` |
| Exam grade, writing score and tie-break points use district-specific rules | `tests/admission-rules.test.mjs` |
| Consecutive same-school departments do not consume another preference sequence | `tests/admission-rules.test.mjs` |
| Invalid district input is rejected by the scoring engine; the API maps the same validation failure to HTTP 400 | `tests/admission-rules.test.mjs`, `app/api/admission/calculate/route.ts` |
| UI exposes rule categories, caps, explanations, missing-data status and tie-break order | `tests/decision-centers.test.mjs`, `components/admission-calculator.tsx` |

## Known boundary

The implementation is a 115 academic-year planning calculator based on the supplied district reports. Official committees retain authority over eligibility review, document recognition, quota, admission sequence and the final calculation; the UI states this at the rule and result surfaces.
