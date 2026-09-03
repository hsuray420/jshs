# JSHS.CC Admin Architecture Audit

## Scope scanned

本次檢查涵蓋 `app/admin`、`app/api/admin`、`components`、`db`、`lib`、`worker`、`data`、`config`、`public` 與管理後台相關測試，並檢查 Cloudflare Worker、D1 store、通知／內容／學校／檔案／部署 API 的既有入口。

## New information architecture

| Route | Responsibility |
| --- | --- |
| `/admin` | Dashboard：網站狀態、內容／資料數量、通知狀態、待處理項目、快捷入口、最近活動 |
| `/admin/data` | 學校與資料模組總覽 |
| `/admin/content` | 內容中心與發布 |
| `/admin/notifications` | 通知事件、模板、重要日期與 LINE 通知設定 |
| `/admin/media` | 媒體與一般檔案的模組入口 |
| `/admin/payments` | 綠界、捐款連結與付款設定 |
| `/admin/deployments` | 程式包、版本、部署與高風險操作入口 |
| `/admin/system` | Worker、D1、備份、管理員與安全狀態入口 |
| `/admin/settings` | 網站基本資料與功能設定 |

所有上述 route 共用 `app/admin/layout.tsx` 與 `components/admin-shell.tsx`，桌面使用固定 Sidebar，窄螢幕改為 Drawer，內容工作區限制寬度並使用 responsive grid。

## Old feature → new route mapping

| Old feature | New route |
| --- | --- |
| 混合式後台總頁 | `/admin` Dashboard |
| 學校 CSV | `/admin/data/csv` |
| 學校查詢／招生／生活交通資料 | `/admin/data` |
| 學校審核 | `/admin/data/reviews` |
| 升學指南／新聞／FAQ／站內內容 | `/admin/content` |
| 通知事件與模板 | `/admin/notifications` |
| LINE 設定與測試 | `/admin/notifications` |
| Podcast／影片／一般檔案 | `/admin/media` |
| 程式包上傳 | `/admin/deployments` → 高風險操作 |
| 綠界與小額捐款設定 | `/admin/payments` |
| 網站基本資料／聯絡資訊 | `/admin/settings` |
| Worker／D1／備份／管理員 | `/admin/system` |
| 程式碼檢視 | `/admin/code`，由系統模組連入 |

## Security changes

- 新付款頁只顯示 HashKey／HashIV「已設定／未設定」，不讀取或輸出 secret 值。
- 管理頁維持既有 `requireAdmin()`；所有既有 API 入口未刪除。
- 程式包上傳與正式部署移到部署模組的 Danger Zone，不與一般媒體／CSV 上傳並列。
- developer event ID 與變數移到通知頁的「進階設定」區塊。
- Client shell 只接收導覽與頁面名稱，不接收 D1、LINE 或付款 secrets。

## Compatibility workspace and follow-up

既有整合式操作頁保留於 `/admin/data/operations`，作為功能相容性工作區，避免此次 IA 調整遺失原本的 LINE、舊資料操作與 API 入口。新的主導覽與各模組入口不再把它當成後台首頁；CSV 與學校審核已經有獨立 route，媒體與程式包也已移至各自模組。

相容頁仍保留少量舊版 LINE／資料操作表單；目前 deployment history 已有 D1 event ledger，Rollback 會建立需人工／GitHub Actions 執行的請求，不會未經確認直接改 production。

## Verification checklist

完成程式修改後執行 typecheck、lint、unit tests 與 production build。桌面／tablet／mobile 的靜態檢查重點為固定 Sidebar、mobile Drawer、grid collapse、`min-width: 0` 與表格容器 overflow。
