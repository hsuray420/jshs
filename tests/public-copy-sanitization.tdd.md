# 前台開發資訊清理：TDD 證據

來源需求：使用者於 2026-08-30 提供的「全站前台開發資訊清理」需求。

| 保證 | 測試 | 結果 |
| --- | --- | --- |
| 學校地圖不向使用者顯示地圖服務商、金鑰或付款選型 | `tests/public-copy-sanitization.test.mjs` | PASS |
| 通勤與會員頁以使用者可理解的定位與隱私語言呈現 | `tests/public-copy-sanitization.test.mjs` | PASS |
| 舊版指南不顯示開發標籤、資料檔路徑或原始載入錯誤 | `tests/public-copy-sanitization.test.mjs` | PASS |
| 公開服務回應不洩露環境變數名稱 | `tests/public-copy-sanitization.test.mjs` | PASS |
| 試算說明只呈現就學區規則，不呈現內部研究用語 | `tests/public-copy-sanitization.test.mjs` | PASS |
| 開放日、帳號、通知、學校詳情與舊版地區頁不向一般使用者呈現後台、匯入格式或技術詞 | `tests/public-copy-sanitization.test.mjs` | PASS |

RED：`node --test tests/public-copy-sanitization.test.mjs`，4 項皆因既有前台／公開回應中的技術文字失敗。

GREEN：`node --test tests/public-copy-sanitization.test.mjs`，7/7 通過；`pnpm typecheck` 與 `pnpm run validate:production` 通過。

範圍刻意保留：資料年度、官方來源、資料校核狀態、定位與資料保存的使用者影響，以及非官方試算限制。它們屬資料可信度與隱私告知，不是技術選型說明。
