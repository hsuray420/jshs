# LINE 會員閘門與工具獨立路由 TDD 證據

本輪需求由使用者驗收條件直接推導，沒有外部 plan 檔案。

## 使用者旅程

- 作為 LINE 會員，我要在登入成功後被驗證是否加入官方 LINE 好友，才能使用會員功能。
- 作為升學規劃者，我要從獨立網址使用算成績的摘要、歷史、規則與落點功能，才能直接回到正確工作區。
- 作為升學規劃者，我要從獨立網址使用重要日程的倒數、總覽、今日行動、待辦、區域比較、開放日與匯出功能，才能分享或重返單一功能。

## TDD 執行證據

| 階段 | 指令 | 結果 |
|---|---|---|
| RED | `node --test tests/member-friend-gate-and-feature-routes.test.mjs` | 3 個測試失敗：好友檢查函式與獨立頁面尚不存在。 |
| GREEN | `node --test tests/member-friend-gate-and-feature-routes.test.mjs tests/admission-rules.test.mjs tests/line-notifications.test.mjs` | 12／12 通過。 |
| 全套單元／契約 | `pnpm run test:unit` | 104／104 通過。 |
| 型別 | `pnpm run typecheck` | 通過。 |

## 保證項目

| # | 保證 | 測試 |
|---|---|---|
| 1 | LINE OAuth callback 在建立會員 session 前呼叫 Messaging API profile endpoint；未加好友不建立 session，舊 session 也因缺少好友驗證時間而失效。 | `tests/member-friend-gate-and-feature-routes.test.mjs` | PASS |
| 2 | `/tools/rules`、`/tools/summary`、`/tools/history`、`/tools/placement` 是獨立頁面，試算完成後保存最新結果與最近 20 次本機紀錄。 | `tests/member-friend-gate-and-feature-routes.test.mjs` | PASS |
| 3 | `/schedule/countdown`、`/schedule/timeline`、`/schedule/now`、`/schedule/tasks`、`/schedule/compare`、`/schedule/open-days`、`/schedule/export` 是獨立頁面。 | `tests/member-friend-gate-and-feature-routes.test.mjs` | PASS |
| 4 | 校園開放日可新增、移除、保存至本機並與升學日期一起匯出 ICS。 | `tests/member-friend-gate-and-feature-routes.test.mjs` + typecheck | PASS |

## Coverage 與已知限制

本專案目前沒有 coverage instrumentation；因此本輪以既有 104 項單元／契約測試、型別檢查、lint、build 與正式 URL smoke test 作為驗證證據。LINE 好友實際狀態需由 Cloudflare 環境提供 `LINE_CHANNEL_ACCESS_TOKEN`，官方帳號加入網址需由 `LINE_OFFICIAL_ACCOUNT_URL` 或後台 `official_line_url` 提供。
