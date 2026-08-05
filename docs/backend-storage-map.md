# 後端與備份位置

- 網站程式碼：本機 Git 專案 `/Users/ray/Desktop/hs/site`，部署到 Cloudflare Sites / Pages。
- 正式網址：`https://ct-jshs-edu.abrdns.com`。
- 資料庫：Cloudflare D1，binding 名稱 `DB`，保存後台檔案紀錄與網站設定。
- 檔案空間：Cloudflare R2，binding 名稱 `FILES`，保存後台上傳檔案與學校 CSV。
- 密鑰：Cloudflare 環境變數，後台不顯示明文。
- 目前備份：Git commit 與 Sites 部署版本。
- 待補強備份：D1 定期匯出、R2 定期複製、部署前自動留版。
