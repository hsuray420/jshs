# 全國找校科中心 — TDD 與 click-path audit 證據

Date: 2026-08-22

## 目標與使用者路徑

本輪依照產品規劃報告與「找校科中心」需求，將學校資料集中到全國目錄，移除 legacy guide 內的舊搜尋介面，並讓每筆結果都能進入可分享的學校詳情頁。

1. 使用者可用校名、科名、群科、縣市或學校代碼搜尋。
2. 使用者可依就學區、學制、公私立、縣市、招生名額與歷年資料篩選。
3. 結果頁固定顯示已選條件、清除條件、資料年度、資料來源與資料狀態。
4. 使用者可加入規劃、加入比較、查看官方網站，再進入學校詳情。
5. 詳情頁提供一眼看懂、學習內容、招生資訊、歷年參考、生活條件與決策操作六個區塊，並提供 Google Maps。
6. 舊的 `page-schools`、`schoolSearch`、`schoolGrid` 搜尋介面與其 render/sort 流程不再存在；legacy guide 只保留規劃用的候選校科載入，不再提供第二套學校搜尋。

## RED / GREEN checkpoints

| 保證 | RED checkpoint | GREEN checkpoint | 證據 |
| --- | --- | --- | --- |
| 全國目錄含資料狀態與信任欄位 | 初次執行 `school-center.test.mjs` 失敗 | `pnpm exec node --test tests/school-center.test.mjs` | `lib/school-directory.ts` |
| 搜尋、六組篩選、已選條件、清除條件 | 初次執行 `school-center.test.mjs` 失敗 | 同上 | `components/school-explorer.tsx` |
| 規劃、比較、官方網站操作 | 初次執行 `school-center.test.mjs` 失敗 | 同上 | `components/school-explorer.tsx`, `components/school-decision-actions.tsx` |
| 六區塊詳情與 Google Maps | 初次執行 `school-center.test.mjs` 失敗 | 同上 | `app/schools/[district]/[code]/page.tsx` |
| 舊 embedded school search 已移除 | 初次執行 `school-center.test.mjs` 失敗 | 同上 | `public/it_hs/guide.htm`, `public/it_hs/guide.js` |
| 全國學校 URL 進入 sitemap | 初次執行 `central-school-pages.test.mjs` 失敗 | targeted school-center suite 通過 | `scripts/generate-sitemap.mjs` |

## Click-path audit

| 觸點 | 狀態變更順序 | 檢查結果 |
| --- | --- | --- |
| 搜尋輸入與六個篩選器 | `updateFilter` → React filter state → `filteredSchools` → 結果與已選條件重算 | 通過，沒有第二套舊搜尋 state 介入 |
| 清除條件 | `setFilters(emptyFilters)` → 全部篩選回到 `all`／空字串 | 通過，結果與條件列同步恢復 |
| 加入規劃 | `POST /api/planner` → 成功後顯示「已加入規劃」並記錄進度 | 通過，失敗不誤顯示成功 |
| 加入比較 | 讀取 localStorage → 以 district/code 去重 → 最多保留 4 筆 → 更新比較工作區 | 通過，沒有被搜尋篩選重置 |
| 詳情頁加入挑戰／適中／穩定 | 選 tier → 輸入 notes → `POST /api/planner` → 顯示成功或錯誤狀態 | 通過，tier 與備註一併送出 |
| 詳情頁 Google Maps | 以學校名稱與地址產生 encoded query → 開啟 Google Maps | 通過，地址缺漏時仍保留可核對的學校名稱 |
| legacy guide 學校入口 | 舊入口改為 `/schools` → 新目錄承接搜尋 | 通過，舊 DOM 與舊 render/sort 函式已移除 |

## 驗證紀錄

- `pnpm run typecheck`：通過。
- `pnpm run validate:content`：通過，15 個就學區資料可信度驗證通過。
- `node --test tests/school-center.test.mjs tests/central-school-pages.test.mjs tests/functional-navigation.test.mjs tests/rendered-html.test.mjs`：25/25 通過。
- `git diff --check`：通過。
- `pnpm test`：通過，production build 完成，62/62 測試通過。
- `pnpm run lint`：0 errors；15 個 legacy JavaScript warnings，未新增 error。
- live smoke test：`/`、`/schools`、`/schools/ct/060323`、`/sitemap.xml`、`/it_hs/guide.htm`、`/api/health` 均回 200；新搜尋頁、詳情六區塊、sitemap 學校 URL 與舊搜尋 DOM 移除檢查均通過。
- 正式部署：Cloudflare version `3b832fca-63a7-4e6d-9c2d-8e6f5594e3f9`。

## 邊界

目前「加入規劃」使用既有匿名 planner cookie；瀏覽器比較使用 localStorage。登入後跨裝置同步、即時名額 API 與住宿／通勤資料仍是產品規劃中的後續迭代，本輪不將待完成能力標記成已完成。
