# JSHS 網站目前架構

> 工程師交接用的現況說明；以目前 repository、Cloudflare 設定與測試為準。
>
> 確認日期：2026-08-24
>
> Runtime 使用 `CORE_DB`、`LEARNING_DB`、`COMMUNITY_DB` 三個明確 D1 bindings，缺少任何 binding 都會 fail closed。此架構為 clean initialization，不讀取舊 D1，也不搬移 legacy rows。細節見 [D1 clean initialization](./architecture/storage-upgrade.md)。

## 1. 一句話總覽

JSHS 是部署在 Cloudflare Workers 的全端升學資訊網站：

- 新版使用 Next App Router / React，透過 `vinext` 編譯成 Worker。
- `worker/index.ts` 是最外層 request router，負責靜態資產、舊網址轉址、快取與 App Router 分流。
- 公開學校資料主要是 repository 內的 CSV/JSON 靜態 Assets；需要寫入或個人化的功能使用 Cloudflare D1。
- `/it_hs` 保留一套舊的獨立 HTML/CSS/JS 升學指南，與新版 `/schools`、`/tools`、`/planner` 並存。
- 管理後台使用 LINE Login + signed HttpOnly cookie，不使用一般帳號密碼。

## 2. 系統拓樸

```text
Browser
  │ HTTPS: jshs.cc/*
  ▼
Cloudflare Worker: worker/index.ts
  ├─ 特殊資產：/robots.txt、/sitemap.xml、/it_hs/district-metadata.json、/it_hs/guide.css
  ├─ 舊路徑：/jshs/* → /；/it_hs/it_hs(.html) → /it_hs/guide.htm
  ├─ 靜態檔：/it_hs/*、/it_5/*、/jshs/* → env.ASSETS
  └─ 其餘請求 → vinext App Router handler
       ├─ app/**/*.tsx          頁面與 server-rendered UI
       ├─ app/api/**/route.ts    API Route Handlers
       ├─ db/*-store.ts          D1 SQL / repository-like access
       ├─ lib/*.ts               領域規則與資料轉換
       ├─ env.CORE_DB            Cloudflare D1
       ├─ env.LEARNING_DB        Cloudflare D1
       └─ env.COMMUNITY_DB       Cloudflare D1

External services: LINE Login / Messaging API、OSM Nominatim / Overpass、官方就學區資料來源
```

## 3. 技術棧

| 層 | 技術 | 主要位置 |
|---|---|---|
| Language | TypeScript / TSX、JavaScript / MJS | `app/`, `components/`, `db/`, `lib/`, `scripts/` |
| UI | React 19、Next 16 App Router | `app/`, `components/` |
| Runtime | Cloudflare Workers、`vinext` | `worker/index.ts`, `vite.config.ts` |
| Build | Vite 8、Cloudflare Vite plugin、Tailwind 4 | `vite.config.ts`, `styles/`, `scripts/` |
| Database | Cloudflare D1（SQLite） | `wrangler.jsonc`, `db/` |
| ORM | Drizzle ORM / Drizzle Kit | `db/schema.ts`, `drizzle.config.ts` |
| Static storage | Cloudflare Assets | `wrangler.jsonc`, `public/` |
| Auth | LINE OAuth/OIDC + HMAC session cookie | `lib/line.ts`, `app/admin/auth.ts` |
| Maps | Leaflet、Nominatim、Overpass | `components/school-map-explorer.tsx`, `app/api/school-geocode/route.ts` |
| CI/CD | GitHub Actions → Wrangler deploy | `.github/workflows/cloudflare-deploy.yml` |

Node 要求 `>=22.13.0`；套件管理使用 pnpm。

## 4. Repository 導覽

| 路徑 | 責任 |
|---|---|
| `app/` | 新版 App Router 頁面、layout 與 API handlers |
| `components/` | 搜尋、試算、規劃器、地圖、Header 等 React UI |
| `db/` | D1 binding、schema 初始化、查詢與寫入 |
| `lib/` | 計分、資料 catalog、LINE、站點地圖、資料可信度 |
| `public/it_hs/` | 舊版指南、15 區 CSV、metadata、生成後全國目錄 |
| `public/it_5/`、`public/jshs/` | 其他歷史/獨立靜態入口與相容資產 |
| `content/` | 編輯內容，目前是 `news.json` |
| `scripts/` | 資料生成、內容驗證、build/deploy 輔助 |
| `drizzle/` | Drizzle migration metadata 與 SQL |
| `tests/` | Node tests、靜態契約、內容與 Cloudflare 部署契約 |
| `worker/` | Worker 最外層 request router |

## 5. 前端與路由

### 新版 App Router

- `/`：首頁與主要任務入口
- `/schools`：全國校科搜尋
- `/schools/[district]/[code]`：學校詳情、招生、歷年、分享、生活條件
- `/districts`：切換就學區與功能狀態
- `/tools`、`/eligibility`：升學工具與特殊資格
- `/planner`、`/planner/share`：志願規劃與分享
- `/schedule`、`/knowledge`、`/news`、`/search`、`/trust`：日程、知識、內容搜尋與資料信任
- `/admin`、`/admin/login`：管理後台與 LINE 登入

頁面多為 server component；互動功能集中在 `components/*.tsx`，以 `fetch('/api/...')` 呼叫 API。共用導覽與樣式主要在 `components/site-header.tsx`、`components/site-footer.tsx`、`app/globals.css`、`public/design-tokens.css`。

### 舊版 `/it_hs` 靜態指南

`public/it_hs/guide.htm` + `guide.js` 是仍在正式服務的獨立前端，直接讀取 district metadata、各區 CSV，以及 `/api/planner/state`、`/api/site-config/`。它不是 React wrapper；改新版 component 不會自動改變舊指南。

## 6. 請求生命週期

新版學校詳情頁：

```text
GET /schools/ct/xxxx
  → worker/index.ts
  → vinext app-router-entry
  → app/schools/[district]/[code]/page.tsx
  → lib/school-directory.ts
  → public/it_hs/school-directory.json
  → HTML + client components
  → client 再呼叫 /api/school-reviews 或 /api/planner
```

學長姐分享 POST：

```text
POST /api/school-reviews
  → route 驗證 same-origin、payload、學校代碼、consent
  → client fingerprint SHA-256 rate limit
  → db/school-review-store.ts
  → D1 school_reviews
  → JSON response
```

後台登入：

```text
/admin/login → /api/admin/line/start → LINE authorize
→ /api/admin/line/callback → exchange code + verify id_token
→ ADMIN_LINE_USER_IDS + D1 site_settings.admin_line_user_ids_extra
→ HMAC signed jshs_admin_session（8 小時）→ /admin
```

### Admin CMS 學校資料與圖片發布

- `/admin/editor?schoolCode=...` 以正式 `SchoolDetailClient` 呈現前台鏡像；不同 viewport 寬度共用同一份前台元件，不透過 iframe。
- 學校欄位的儲存／預覽只更新 COMMUNITY_DB `school_data_drafts`。預覽前會先保存草稿，再以 GitHub canonical CSV 最新版本檢查欄位衝突。
- 只有 Administrator／Owner 可確認發布。GitHub commit 建立後，後台依 commit SHA 查詢 GitHub Actions；只有部署成功才把草稿標記為 published。失敗或狀態無法讀取時保留草稿，且不能顯示為部署成功。
- 學校圖片先上傳 ImageKit，再把 metadata 存在 COMMUNITY_DB `school_media_drafts`；D1 不保存圖片 BLOB。Administrator／Owner 確認發布後才更新正式圖片 metadata，並在替換完成後清理舊 ImageKit 檔案。
- `/admin/media?mode=missing` 依正式圖片 metadata 顯示缺圖學校，並帶入學校 context；目前圖片管理與發布以單校為單位，資料 schema 每校仍只有一張管理員設定的正式圖片。
- Reviewer 可讀取前台鏡像與草稿，但編輯、草稿儲存與發布仍受 server-side role checks 保護。

## 7. 內容與資料流

### 學校資料：靜態 Assets 為主

1. `public/it_hs/*/schools*.csv` 是主要 source。
2. `scripts/generate-school-directory.mjs` 搭配 `lib/school-catalog.mjs` 將 CSV 轉成標準 record。
3. 產生 `public/it_hs/school-directory.json`；目前 metadata 顯示 15 區、604 筆學校。
4. `lib/school-directory.ts` 被新版頁面使用。
5. `scripts/generate-sitemap.mjs` 由各區 CSV 產生學校詳情 sitemap。

`GET /api/schools.csv?district=ct` 目前直接用 `env.ASSETS` 讀 CSV，不查 D1。

### Admission score 與內容

- `lib/admission-score.ts` 是計分規則；`POST /api/admission/calculate` 不查 DB。
- `content/news.json` 是新聞 source，目前 6 篇；build 時產生 sitemap 與文章 metadata/JSON-LD。

### Planner：Guest local-only、Member D1

Guest 的候選校科、狀態與版本留在 Browser localStorage；Guest API 不建立 planner row。登入會員使用 `jshs_member_session` 導出的內部 UUID 對應 D1 `member_planners`，再以 planner ID 管理候選校科、狀態與版本。登入後本機資料只在使用者明確按下匯入時上傳。

## 8. D1 資料庫

`wrangler.jsonc` 設定三個固定的 production bindings；`db/bindings.ts` 不含舊 `DB` fallback。各 binding 缺失時會明確丟出錯誤。三份初始 schema 位於 `db/migrations/{core,learning,community}/0001_*.sql`。

| Database | Ownership | Schema source |
|---|---|---|
| `jshs-core` / `CORE_DB` | `users`, `user_identities`, `line_friendships`, favorites, account/site settings, notification preferences | `db/migrations/core/` |
| `jshs-learning` / `LEARNING_DB` | Member score history, mock exams, planner records, weakness profiles, AI history | `db/migrations/learning/` |
| `jshs-community` / `COMMUNITY_DB` | Reviews, reports, votes, school media metadata, moderation, admin/content records | `db/migrations/community/` |

Schema migrations are applied to each newly created database without copying rows from an old database. The canonical member key is `users.id` (JSHS UUID), and `user_identities` maps LINE provider IDs to it. LINE webhook events alone do not create member identities. `line_friendships` is updated only from a live LINE friendship check.

`admin_files` stores non-image file blobs for existing CSV/code workflows. Image uploads use ImageKit only; D1 stores ImageKit `fileId`/URL metadata. The public school-media route redirects to the ImageKit URL and has no D1 BLOB fallback.

Guest personal records remain in browser storage; guest quota state is a signed HttpOnly cookie and does not write to D1. Member API routes derive `user_id` from the signed member session.

### 後台 CSV 的責任邊界

後台 `/api/admin/schools-csv` 會把上傳 CSV 寫入 D1 `admin_files.file_blob`，並寫入 `site_settings` 的 file id/name/time；但公開 `/api/schools.csv` 仍只讀 `env.ASSETS`，沒有讀 `schools_csv_file_id`。

```text
Git/public CSV → build → Cloudflare Assets → public school API/UI
Admin upload → D1 admin_files → 目前未接回 public school API
```

若產品要求「後台上傳後前台立即切換」，需要補 D1 override/fallback 與整合測試。

## 9. API 分類

| 類別 | Endpoint | 儲存/依賴 |
|---|---|---|
| Core | `/api/health` | D1 schema check；LINE 只回報 integration status |
| School | `/api/schools.csv` | Cloudflare Assets |
| School | `/api/school-geocode` | OSM Nominatim / Overpass + cache |
| Admission | `/api/admission/calculate` | `lib/admission-score.ts`，無 DB |
| Planner | `/api/planner`, `/api/planner/state` | D1 + anonymous cookie |
| Reviews | `/api/school-reviews` | D1 + same-origin + rate limit |
| Config | `/api/site-config` | D1 public settings + env fallback |
| Files | `/api/files/[id]` | ImageKit URL for images; D1 blob for non-image admin files |
| Admin | `/api/admin/*` | LINE session + D1 |
| LINE | `/api/line/webhook` | HMAC signature validation; does not create member records |
| Monitor | `/api/monitor/alert` | shared secret + LINE push |

SQL 使用 prepared statements / `.bind()`；各 route 依功能做長度、格式、same-origin、權限或 rate limit 驗證。

## 10. Authentication 與 secrets

- Public visitor 可匿名使用公開內容與試算；planner 只用 cookie 做 owner separation。
- LINE Login callback 使用 state cookie；ID token 由 LINE verify endpoint 驗證。
- Admin 必須命中 `ADMIN_LINE_USER_IDS` 或 D1 `admin_line_user_ids_extra`。
- `jshs_admin_session` 使用 HMAC-SHA256、HttpOnly、Secure、SameSite=Lax，有效 8 小時。
- `ADMIN_SESSION_SECRET` 優先；未設定時 fallback 到 `LINE_LOGIN_CHANNEL_SECRET`。

主要環境變數：

```text
LINE_LOGIN_CHANNEL_ID / LINE_LOGIN_CHANNEL_SECRET
LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN
ADMIN_LINE_USER_IDS / LINE_ALERT_USER_IDS
LINE_OFFICIAL_ACCOUNT_URL / ADMIN_SESSION_SECRET
MONITOR_ALERT_SECRET
```

Secrets 不可進 Git、CSV、前端 bundle 或 public D1 settings。

## 11. Build、測試與部署

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test
pnpm build
```

`pnpm test` 依序執行內容可信度驗證、TypeScript typecheck、production build 與 Node test runner。build 會更新 school directory、sitemap、guide CSS、source snapshot 與 `dist/`。

正式 release path：

```text
local change → verification → commit → push main to GitHub remote github
→ GitHub Actions: pnpm install --frozen-lockfile → pnpm test
→ wrangler deploy --keep-vars → Cloudflare route jshs.cc/*
```

正式 workflow 是 `.github/workflows/cloudflare-deploy.yml`。`scripts/cloudflare-deploy-direct.mjs` 僅應用於明確授權的 emergency direct deploy。

## 12. 目前風險與交接注意事項

1. `docs/backend-storage-map.md` 仍寫 R2 與舊網域；現行 `wrangler.jsonc` 是三個 D1 bindings + Assets，該舊文件不能當部署真相。
2. D1 initial schema 與部分 store 的 idempotent runtime `ensure*Schema()` 仍需保持一致。
3. 後台 CSV 上傳目前沒有接回公開學校 API。
4. 新版 React 與舊版 `/it_hs` 是兩套 runtime surface。
5. 招生資料目前是 115 學年度脈絡；修改名額、分數或時程要保留官方來源與更新日期。
6. Worker 對部分 public HTML 使用 `s-maxage=60` + `stale-while-revalidate=300`；trust-critical assets 使用 `no-store`。
7. `docs/security-risk-register.md` 記錄 `vinext` → `image-size@2.0.2` 的已知 advisory；不要把使用者上傳影像送進 build/metadata pipeline。

## 13. 新工程師查找表

| 要修改什麼 | 先看 |
|---|---|
| 新增公開頁面 | `app/<route>/page.tsx`、共用 `components/` |
| 新增 API | `app/api/<route>/route.ts`、對應 store 或 `lib/` |
| 修改學校資料 | `public/it_hs/*/schools*.csv`、`lib/school-catalog.mjs`、`scripts/generate-school-directory.mjs` |
| 修改就學區能力 | `public/it_hs/district-metadata.json`、`lib/district-context.ts` |
| 修改計分規則 | `lib/admission-score.ts`、`tests/admission-rules.test.mjs` |
| 修改舊指南 | `public/it_hs/guide.js`、`guide.htm`、`guide.css`、`worker/index.ts` |
| 修改 DB | `db/schema.ts`、store 的 `ensure*Schema()`、`drizzle/`、相關 tests |
| 修改管理員權限 | `app/admin/auth.ts`、`lib/line.ts`、`app/api/admin/line/*` |
| 修改部署 | `wrangler.jsonc`、`worker/index.ts`、`.github/workflows/cloudflare-deploy.yml` |
| 查資料可信度 | `lib/content-trust.mjs`、`scripts/validate-content-trust.mjs`、`tests/content-trust.test.mjs` |
