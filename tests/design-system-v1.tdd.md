# JSHS Design System V1：TDD 證據

來源需求：2026-08-30 使用者提供的 C 區塊視覺基準與 JSHS Design System V1 規格。

| 使用者旅程 | 保證 | 測試 | 結果 |
| --- | --- | --- | --- |
| 學生開啟網站 | 看到集中、可讀的教育工具介面，而非滿版或厚重卡片 | `tests/design-system-v1.test.mjs` | PASS |
| 學生使用導覽 | 可由六個清楚的一級入口與登入進入功能 | `tests/design-system-v1.test.mjs` | PASS |
| 學生從首頁開始 | 可立即辨識找學校、算成績、我的志願、升學指南四項功能 | `tests/design-system-v1.test.mjs` | PASS |

RED：`node --test tests/design-system-v1.test.mjs`，3 項皆因既有 iOS 式 token、下拉導覽與舊首頁結構失敗。

GREEN：`node --test tests/design-system-v1.test.mjs`，3/3 通過；`pnpm typecheck` 通過。
