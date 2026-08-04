# 正式網址與公開上線清單

## 網址原則

正式網址若不能出現個人名字，建議購買自有網域。免費平台網址通常會帶帳號、平台名或較長的子網域，不適合作為正式公開入口。

## 建議網域

優先順序：

1. `ctedu.tw`
2. `ctschool.tw`
3. `ctlearn.tw`
4. `jshs.tw`
5. `ctadmission.org`
6. `ctadmission.com`

`.tw` 對台灣家長辨識度較高，`.com` 最通用，`.org` 比較像公益資訊站。

## 上線前要做

- 購買網域。
- 將網域 DNS 指向目前部署平台。
- 在 Sites 加上 custom domain。
- 將網站權限從私人改成公開。
- 到 Google Search Console 驗證網域。
- 提交 `sitemap.xml`。
- 建立 Google Analytics 4 並填入測量 ID。
- 在 LINE Developers 設定 webhook URL。

## 正式後台

正式後台網址：

- `/admin`

正式後台不使用公開密碼，而是使用 ChatGPT/Google 登入身分與伺服器端管理員名單。這比把密碼寫在前端安全。
