# 首頁「我的下一步」TDD 驗證紀錄

## 來源與範圍

本輪依據 `docs/升學平台競品分析與產品規劃報告.md` 與 `plans/升學平台一週迭代計畫.md` 的迭代 1，僅處理首頁核心路徑，不延伸到校科詳情、規劃器排序或全區試算。

## User journeys

- 作為第一次進站的學生，我要在首頁看懂四個任務，才能在 10 秒內選擇下一步。
- 作為學生或家長，我要選擇就學區並看見學年度、資料狀態與更新日，才能避免使用錯誤規則。
- 作為回訪使用者，我要在不登入的情況下看到瀏覽器暫存進度，才能繼續上次的查詢、試算與規劃。
- 作為資料使用者，我要看到近期官方情報的更新日期與來源，才能知道哪些內容需要回官方核對。

## RED / GREEN

先新增 `tests/homepage-core-path.test.mjs` 與相關導覽斷言；初次執行因首頁仍指向 legacy guide、沒有 `HomeProgress` 而失敗（RED）。完成首頁與進度元件後，目標測試通過（GREEN）：

```text
pnpm exec node --test tests/homepage-core-path.test.mjs tests/functional-navigation.test.mjs tests/information-architecture.test.mjs
15/15 passed
```

## 驗證結果

| 保證 | 測試／命令 | 結果 |
|---|---|---|
| 四個首頁任務使用 canonical route | `tests/homepage-core-path.test.mjs` | PASS |
| 首頁不再以 legacy guide 作為主要 CTA | `tests/functional-navigation.test.mjs` | PASS |
| 就學區選擇器寫入瀏覽器暫存與年度／狀態資訊 | `components/home-district-picker.tsx` + typecheck/build | PASS |
| 查校科、試算、加入規劃會更新首頁進度 | `tests/functional-navigation.test.mjs` | PASS |
| 近期情報最多 3 則並顯示日期與來源 | `app/page.tsx` | PASS |
| 完整回歸測試 | `pnpm test` | 59/59 PASS |
| 型別與程式品質 | `pnpm run typecheck`, `pnpm run lint` | PASS；0 errors、15 個既有 warnings |
| 正式路由 smoke test | `https://jshs.cc/`、`/news`、`/schools`、`/tools`、`/planner`、`/districts` | 全部 HTTP 200 |

## 已知邊界

進度目前以瀏覽器暫存為主，尚未與登入帳號跨裝置同步；這是報告規劃中的後續能力。本輪也保留 legacy guide 作為相容入口，但首頁與新選單不再把它當主要流程。
