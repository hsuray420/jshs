# LINE 後台登入與告警設定

正式網址：`https://jshs.cc`

## 需要建立的 LINE channel

1. LINE Login channel
   - 管理後台 Callback URL: `https://jshs.cc/api/admin/line/callback`
   - 會員登入 Callback URL（若同一個 LINE Login channel 也提供會員登入）：`https://jshs.cc/api/line/login/callback`
   - Callback URL 必須完全一致，使用 `https`，不可在結尾加 `/`
   - Scope: `profile openid`
   - 需要填到 Sites 環境變數：
     - `LINE_LOGIN_CHANNEL_ID`
     - `LINE_LOGIN_CHANNEL_SECRET`

2. Messaging API channel / LINE 官方帳號
   - Webhook URL: `https://jshs.cc/api/line/webhook`
   - 需要填到 Sites 環境變數：
     - `LINE_CHANNEL_SECRET`
     - `LINE_CHANNEL_ACCESS_TOKEN`
     - `LINE_ALERT_USER_IDS`

## 管理員允許名單

第一次用 LINE 登入時，如果尚未設定 `ADMIN_LINE_USER_IDS`，登入頁會顯示你的 LINE userId。

把該 userId 填進 Sites 環境變數：

```text
ADMIN_LINE_USER_IDS=Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

如果有多位管理員，用逗號分隔。

## 登入通知

登入成功後，系統會用 LINE 官方帳號推播：

```text
後台登入通知
帳號：LINE 顯示名稱
時間：台灣時間
網址：https://jshs.cc/admin
```

提醒：要收到 push message，接收者通常需要先加入該 LINE 官方帳號為好友。

## 伺服器異常通知

健康檢查網址：

```text
https://jshs.cc/api/health
```

告警 API：

```text
POST https://jshs.cc/api/monitor/alert
Header: x-monitor-secret: <MONITOR_ALERT_SECRET>
Body: {"level":"critical","message":"網站無法連線","url":"https://jshs.cc"}
```

如果整台服務無法連線，網站本身無法自己送 LINE，所以需要外部監控服務呼叫健康檢查並在異常時打告警 API，或使用外部服務自己的通知功能。
