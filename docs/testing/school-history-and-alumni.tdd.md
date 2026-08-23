# 校科查詢、歷年成績與學長姐分享 TDD 紀錄

本輪依需求將「查學校」收斂成全國校科查詢與歷年錄取成績查詢，並在學校詳情加入官方歷年最低錄取資料與非官方學長姐分享。

## RED

先加入 `tests/school-history-and-sharing.test.mjs`，鎖定四件事：

- 選單新增「歷年錄取成績查詢」，移除學制篩選、獨立比較、地圖與費用入口。
- 全國校科查詢保留篩選，但不再顯示獨立比較工作區。
- 歷年查詢與校科查詢共用 `/it_hs/school-directory.json`，且分開顯示官方資料與非官方整理。
- 學校詳情顯示最低錄取資料、學長姐分享與投稿 API；不再產生 Google Maps 入口。

初次執行 targeted suite：4 個測試全部失敗，確認測試先於實作捕捉缺口。

## GREEN

- `components/admission-history-explorer.tsx` 使用同一份校科目錄，只篩選有歷年成績的資料，並以 `historicalSourceType` 分成官方與非官方兩組。
- `scripts/generate-school-directory.mjs` 將 CSV 的最低錄取成績、年度、來源備註與來源分類寫入共用目錄。
- `components/alumni-sharing.tsx` 在每所學校詳情顯示 CSV 最低錄取成績，並提供匿名／年度／當年成績／看法投稿。
- `app/api/school-reviews/route.ts` 與 `db/school-review-store.ts` 使用 D1 保存非官方分享，輸入有長度、學校存在、同意公開等驗證。
- 移除學校查詢的比較工作區、詳情頁比較按鈕與 Google Maps 按鈕；校科比較不再是獨立入口。

Targeted suite：15/15 通過；型別檢查與 lint 通過（僅保留既有 15 個 warning）。

## 邊界

官方歷年資料與學長姐分享永遠分開標示。沒有 CSV 成績時不自行推估；學長姐內容屬非官方經驗，正式錄取、名額與資格仍以當年度招生公告為準。
