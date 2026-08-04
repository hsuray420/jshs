# 中投區國中升學資訊網：後端、LINE、Google 升級藍圖

## 目標架構

- 前台：正式網站、家長入口、學生入口、高中職專區、五專專區、學校查詢、積分試算、落點參考。
- 後台：登入後管理學校、科系、名額、歷年分數、FAQ、公告與資料來源。
- 後端：提供 API、LINE webhook、資料查詢、後台權限、日誌與分析事件。
- 資料庫：Supabase Postgres，先用免費方案起步。
- 搜尋與分析：Google Search Console、Google Analytics 4、sitemap、robots、結構化資料。

## 建議部署

第一階段使用免費 Sites 網址或 Vercel 免費網址做測試版。正式公開給家長與學生前，再購買 `.tw`、`.com` 或 `.org` 網域。

## LINE 官方帳號串接

預留後端端點：

- `POST /api/line/webhook`

正式上線前需要在 LINE Developers 後台設定：

- Channel secret
- Channel access token
- Webhook URL

第一版功能建議：

- 關鍵字回覆：會考、五專、高中職、志願序、重要時程。
- 學校查詢：輸入學校名稱或地區，回覆前台查詢連結。
- 試算導流：輸入「試算」回傳積分試算頁。

第二版功能建議：

- LINE 使用者綁定網站帳號。
- 收藏志願同步。
- 重要時程提醒。

## Google 搜尋與分析

正式公開後要完成：

- Google Search Console 網站驗證。
- 提交 `sitemap.xml`。
- 設定 Google Analytics 4。
- 每個重要頁面設定獨立 title、description、canonical。
- 學校資料升級成獨立網址，例如 `/schools/193302`。

## 權限與安全

目前 `jshs_dev` 是前端示範後台，只能當本機或內部測試工具。正式後台必須改成伺服器登入：

- Supabase Auth 管理帳號。
- 管理者角色分級。
- 修改資料要有紀錄。
- 發布流程分成草稿、待審、已發布。

## 資料庫第一版資料表

- `schools`
- `programs`
- `admission_scores`
- `admission_rules`
- `articles`
- `line_users`
- `favorites`
- `admin_audit_logs`
