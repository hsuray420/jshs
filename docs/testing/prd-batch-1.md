# JSHS.CC Batch 1 修復報告

## 已完成

- 積分規則 UI 新增 display layer：內部公式與欄位 key 不再直接輸出，改成中文白話說明與同分比序標籤。
- 待辦頁將資料結構名稱改為「系統建議待辦」與「我的待辦」。
- 新聞文章依 slug 讀取並呈現對應文章；未知 slug 進入友善 404。
- 新增全站錯誤邊界，提供「重新載入」、「返回升學指南」與首頁入口，不顯示例外細節。
- 特殊資格檢測的初始化改為可終止的 skeleton 狀態；無紀錄會進入「開始資格檢測」，讀取失敗會顯示中文錯誤與重試。

## 驗證證據

| 保證 | 驗證 | 結果 |
|---|---|---|
| 內部公式與待辦 key 不進入正式 UI | `pnpm run test:unit`、rendered HTML smoke | PASS |
| 新聞 slug 對應自身文章內容 | `tests/news-hub.test.mjs`、`/news/116-junior-high-exam-roadmap` | PASS / HTTP 200 |
| 友善錯誤與 404 | `tests/prd-batch-1.test.mjs`、未知路徑 smoke | PASS / HTTP 404 |
| 型別與建置 | `pnpm run typecheck`、`pnpm run build` | PASS |
| production placeholder | `pnpm run validate:production` | PASS |
| lint | `pnpm run lint` | PASS；既有 legacy 靜態 JS 15 warnings |

## 未完成／限制

- 目前環境的 `vinext start` 會因既有 `cloudflare:` ESM loader 限制啟動失敗；`vinext build` 已成功。
- 已完成 Chrome 瀏覽器 route、可見文字、手機寬度與 overflow 驗收；375／390／430 在目前工具實際回報的 viewport 下均無橫向 overflow。開發模式仍會請求 vinext 的 virtual RSC 資源並回傳 404／Promise abort，屬工具鏈噪音，非產品 route。
- 尚未在 production URL 執行 Lighthouse／axe；需部署後再做正式環境的第三方資源與效能檢查。
- 未修改積分引擎、官方資料或資料庫 schema。
