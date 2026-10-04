# 本機持久化與 D1 對照

本次稽核後，產品程式（`app/`、`components/`、`lib/`、舊版公開工具）不再使用 `localStorage`、`sessionStorage` 或 IndexedDB。訪客輸入只存在目前頁面的 React／JavaScript 記憶體；重新整理即清除，不會寫入本機。

## 會員資料分流

| 功能 | 會員保存位置 | 現行入口 |
| --- | --- | --- |
| LINE 會員、身份、會員設定、收藏、通知偏好、官方重要日程 | Core D1 (`CORE_DB`) | `/api/member/*`、`/api/favorites`、`/api/notifications/preferences` |
| 成績試算歷史、模考紀錄、弱點、志願規劃／版本、AI 對話 | Learning D1 (`LEARNING_DB`) | `/api/admission/scores`、`/api/mock-exams`、`/api/planner/*`、`/api/member/weakness`、`/api/assistant/conversations` |
| 校務回報、學校評論、社群投票、媒體、內容草稿與管理稽核 | Community D1 (`COMMUNITY_DB`) | `/api/data-reports`、`/api/school-reviews`、`/api/community/votes`、`/api/admin/*` |

## 行為界線

- 需要保存的功能一律要求 LINE 會員；伺服器端 API 仍以簽署 session cookie 驗證，不信任前端 `isMember`。
- 就學區、篩選、導覽提示、AI 浮動按鈕位置與未送出的表單只屬暫時 UI 狀態，不建立本機副本。
- 舊版 `/public/it_hs` 與 `/public/jshs` 工具改用 URL 或頁面記憶體狀態；未登入不再宣稱可跨重新整理保存。
- 個人待辦與校園開放日目前只保留頁面記憶體；若要跨裝置保存，下一步應新增 Learning D1 的會員 API 與表，不得恢復本機 fallback。
