# 升學指南中心 TDD 驗證紀錄

## 來源與範圍

本輪依據 `docs/升學平台競品分析與產品規劃報告.md` 與 `plans/升學平台一週迭代計畫.md`，完成升學指南中心的六大分類與文章固定閱讀結構。功能集中在 `/news`、六個分類入口與 `/news/[slug]` 文章頁，不延伸到登入同步、完整搜尋或編輯後台。

## User journeys

- 作為學生或家長，我要先看到文章適用對象、學年度與就學區，才能判斷內容是否能套用到自己。
- 作為第一次理解制度的使用者，我要先讀到一句話結論、準備項目與三到五個重點，才能快速建立脈絡。
- 作為需要核對權益的使用者，我要看到常見誤解、官方來源與最後更新，才能知道哪些內容必須回官方確認。
- 作為讀完指南的使用者，我要有下一步工具入口，才能把理解轉成查校科、試算或規劃行動。

## RED / GREEN

先在 `tests/news-hub.test.mjs` 強化文章欄位與模板斷言；初次執行因文章資料沒有固定元資料、文章頁沒有固定段落標籤而失敗（RED）。完成資料模型、六大分類與文章模板後，目標測試通過（GREEN）：

```text
pnpm exec node --test tests/news-hub.test.mjs tests/information-architecture.test.mjs
13/13 passed
```

## 驗證結果

| 保證 | 測試／實作 | 結果 |
|---|---|---|
| 六大分類固定存在且有穩定入口 | `lib/news.ts`、`content/site-map.json`、`tests/news-hub.test.mjs` | PASS |
| 每篇文章都有適用對象／年度／就學區 | `content/news.json`、`app/news/[slug]/page.tsx` | PASS |
| 每篇文章都有一句話結論與準備清單 | `content/news.json`、文章模板 | PASS |
| 每篇文章都有三到五個重點與常見誤解 | `summary`、`misconceptions`、文章模板 | PASS |
| 官方來源、最後更新與下一步工具可見 | 文章模板與既有 `sources`／`cta` 欄位 | PASS |
| 校科探索與生涯選擇不因內容共用而出現空分類 | 首頁依 `site-map.json` 文章 slug 組合分類 | PASS |

## 已知邊界

目前文章內容仍由 JSON 靜態管理，官方資料更新與編輯流程尚未做成後台；文章中的適用年度與就學區是閱讀判斷提示，涉及報名資格、名額與截止日仍需回到各招生單位最新公告核對。
