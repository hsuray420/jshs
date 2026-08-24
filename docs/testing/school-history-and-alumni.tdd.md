# 校科查詢、歷年成績與學長姐分享 TDD 紀錄

本輪依需求將「查學校」整理成全國校科查詢、歷年錄取成績、學長姐分享、學校地圖、費用試算與通勤比較六個清楚入口；歷年資料與校科目錄拆成獨立 CSV，學長姐分享由 API 寫入 D1 待審核表。

## RED

先加入 `tests/school-history-and-sharing.test.mjs`，鎖定四件事：

- 選單新增「歷年錄取成績查詢」，保留全國查詢必要篩選，並將學長姐分享、學校地圖、費用試算與通勤比較各自獨立成頁。
- 全國校科查詢保留篩選，但不再顯示獨立比較工作區。
- 學校地圖改用免付款的 OpenStreetMap／Leaflet，支援就學區、學校搜尋、住家定位、多校勾選與通勤時間估算；估算會清楚標示不是即時導航。
- 歷年查詢使用獨立 `/it_hs/admission-history.json`，全部標示為非官方整理；校科查詢只使用 `/it_hs/school-directory.json`。
- 學長姐分享是獨立工具頁；投稿經 Worker API 驗證後進 D1 pending，管理員審核後才公開。

初次執行 targeted suite：4 個測試全部失敗，確認測試先於實作捕捉缺口。

## GREEN

- `scripts/split-admission-history.mjs` 與 `scripts/generate-admission-history.mjs` 產生各就學區獨立歷年 CSV 與 JSON。
- `components/admission-history-explorer.tsx` 只讀獨立歷年資產，並固定標示非官方整理。
- `components/alumni-sharing.tsx` 提供匿名會考成績、最低錄取與錄取結果投稿；`app/api/school-reviews/route.ts` 與 `db/school-review-store.ts` 使用 D1 保存 pending 分享。
- `app/api/admin/school-reviews/route.ts` 與管理後台提供審核公開／退回，前台 GET 只會回傳 published。
- 移除學校查詢的比較工作區、詳情頁比較按鈕與 Google Maps 按鈕；校科比較不再是獨立入口。

Targeted suite：15/15 通過；型別檢查與 lint 通過（僅保留既有 15 個 warning）。

## 邊界

官方歷年資料與學長姐分享永遠分開標示。沒有 CSV 成績時不自行推估；學長姐內容屬非官方經驗，正式錄取、名額與資格仍以當年度招生公告為準。
