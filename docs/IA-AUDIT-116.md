# JSHS.CC 116 學年度 IA Audit／Gap Analysis 基線

> 盤點日期：2026-08-28
>
> 產品規格唯一來源：JSHS.CC 116 學年度全站重構 PRD。
>
> 本文件先於本次程式修改建立，記錄目前公開入口、相容路由與合併決策。

## 1. Audit 範圍與證據

已盤點：

- `app/**/page.tsx` 的 route、metadata、redirect 與頁面組裝。
- `components/site-header.tsx` 的桌機 Mega Menu、搜尋、手機 Drawer、Bottom Navigation。
- `components/site-footer.tsx` 的頁尾入口。
- `app/page.tsx` 首頁卡片、CTA、近期內容與時程入口。
- `app/search/page.tsx` 全站搜尋結果與快捷入口。
- `content/site-map.json`、`lib/site-map-116.ts`、`lib/site-map.ts` 的 IA 資料來源。
- 學校、試算、志願、日程、官方資料、知識、資格與信任相關 components 的操作入口。
- `localStorage`／會員 API 使用的進度、志願、版本、待辦、規則導引與校園開放日狀態。

### 目前確認的主要 Gap

1. `lib/site-map-116.ts` 已有新七大分類，但 `content/site-map.json` 仍保留「查學校／時間日程／特殊資格／升學知識／更多」舊分類，存在兩份相互衝突的 IA。
2. `/planner/check`、`/schedule/countdown`、`/schedule/compare`、`/schedule/export`、`/schedule/open-days` 仍以舊獨立頁面呈現，沒有收斂成 PRD 指定的頁內能力。
3. `/schedule` 目前一次渲染倒數、比較、開放日與匯出，導致總覽與重要時程職責重複。
4. `/tools/rules` 同時渲染舊規則工作區與新的互動規則表，形成重複入口與重複說明。
5. `/knowledge` 首頁仍直接列出迷思、過來人、影音與 Podcast 等舊入口；這些應成為五個指南分類內的內容，或改為相容 redirect。
6. `/news` 是 JSHS 編輯內容頁，卻被新 IA 命名成「官方最新公告」入口；首頁與搜尋也把這些內容當成官方資訊導流。
7. 學校群科選單指向 `/knowledge/groups`，但目前沒有對應 route，且群科應歸屬「找學校」。
8. Footer 有 `group.label === "更多"` 的舊分類判斷，代表舊 IA 尚未完全移除。
9. 帳號、管理後台與部分內容元件仍顯示「時間日程／知識中心」等舊分類用語。
10. 部分 legacy route 的 metadata、breadcrumb 或 active navigation 仍使用舊名稱，即使它們應只作 URL 相容用途。

## 2. Canonical IA（完成後唯一公開導航）

桌機主導航只能有以下七組；右側固定為搜尋、AI、通知、帳號：

| 順序 | 主選單 | 子選單（僅此清單） | Canonical 入口 |
| --- | --- | --- | --- |
| 1 | 找學校 | 全國校科查詢、歷年錄取、學校地圖、學校比較、通勤比較、費用試算、學長姐分享、校園開放日、群科介紹 | `/schools` |
| 2 | 算成績 | 成績積分試算、積分規則、模擬考落點、個人積分摘要、成績歷史 | `/tools` |
| 3 | 我的志願 | 自己排、系統推薦、版本紀錄、列印／下載、官方選填平台 | `/planner` |
| 4 | 升學日程 | 升學總覽、重要時程、現在該做什麼、我的待辦 | `/schedule` |
| 5 | 官方資訊 | 官方最新公告、官方簡章與規則、官方招生時程、官方招生平台 | `/admission-guides` |
| 6 | 升學指南 | 升學入門、志願與積分、特殊入學與資格、升學百科、生涯探索 | `/knowledge` |
| 7 | 資料與信任 | 資料來源、資料更新狀態、15 區建置進度、試算與分析方法、資料版本紀錄、錯誤回報、平台可信度說明 | `/trust` |

「更多」、特殊資格、升學知識、時間中心、信任中心、工具中心都不是 canonical 主分類。

## 3. 現有 route／功能 mapping

處理方式的意義：

- **保留**：作為 canonical route 或 canonical route 的內容 view。
- **合併**：能力保留，但不再作為獨立導航入口。
- **redirect**：保留舊 URL 相容性，轉到唯一 canonical 位置。
- **保留但不導覽**：帳號、通知、AI、搜尋、分享、管理後台等非主 IA 工具。
- **隱藏內容入口**：沒有 PRD 對應或無法證明已完成的功能，不出現在導航、Footer、首頁與搜尋快捷入口。

### 找學校

| 現有功能 | 現有 URL | PRD 對應位置 | 處理方式 |
| --- | --- | --- | --- |
| 全國校科查詢 | `/schools` | 找學校 → 全國校科查詢 | 保留；就學區、縣市、學制、群科、科別與其他可靠條件集中於此 |
| 就學區找學校 | `/districts` | 查詢流程中的就學區選擇 | 保留 URL 作 context compatibility；移除導航、Footer、首頁與指南的獨立入口 |
| 學校工具舊 wrapper | `/schools/[district]` | 找學校內頁功能 | 保留 URL compatibility，實際導回對應 `/schools?view=...`；不列入導航 |
| 學校詳細資料 | `/schools/[district]/[code]` | 全國校科查詢結果內容頁 | 保留；只能由搜尋結果、比較或相關校科內容進入，不列入導航 |
| 歷年錄取成績查詢 | `/schools/history`、`/schools?view=history` | 找學校 → 歷年錄取 | 改名為「歷年錄取參考」；保留能力與年度／來源標示 |
| 學校地圖 | `/schools/map`、`/schools?view=map` | 找學校 → 學校地圖 | 保留；先選就學區再載入該區 marker |
| 學校比較 | `/schools/compare`、`/schools?view=compare` | 找學校 → 學校比較 | 保留 view；舊 path redirect 到 view |
| 通勤比較 | `/schools/commute`、`/schools?view=commute` | 找學校 → 通勤比較 | 保留 view；結果標示 JSHS 計算／估算 |
| 費用試算 | `/schools/cost`、`/schools?view=cost` | 找學校 → 費用試算 | 保留 view；區分官方金額、JSHS 估算、自行輸入 |
| 學長姐分享 | `/schools/alumni`、`/schools?view=alumni` | 找學校 → 學長姐分享 | 保留 view；固定社群資料標示 |
| 校園開放日 | `/schedule/open-days`、`/schools/open-days` | 找學校 → 校園開放日 | canonical 為 `/schools/open-days`；schedule 舊 URL redirect |
| 群科介紹 | `/knowledge/groups`（目前 dead／錯置） | 找學校 → 群科介紹 | 建立可用的 `/schools/groups` canonical；舊路徑 redirect；不再放升學指南導航 |

### 算成績

| 現有功能 | 現有 URL | PRD 對應位置 | 處理方式 |
| --- | --- | --- | --- |
| 成績積分試算 | `/tools` | 算成績 → 成績積分試算 | 保留；只開放 8 / 15 區，未建模區顯示不可用狀態 |
| 積分／序位換算說明 | `/tools/rules` | 算成績 → 積分規則 | 保留 canonical；移除舊純文字／重複 rules workspace，只保留互動規則表 |
| 同分比序 | 現有規則／結果內文 | 試算結果、積分規則 | 不建立獨立導航；由共同規則資料驅動 |
| 模擬考先估落點 | `/tools/placement` | 算成績 → 模擬考落點 | 保留；固定 `jshs_estimated` 與非官方限制語言 |
| 個人積分摘要 | `/tools/summary` | 算成績 → 個人積分摘要 | 保留；顯示同分比序資料與來源年度 |
| 成績歷史紀錄 | `/tools/history` | 算成績 → 成績歷史 | 保留；與會員／裝置狀態相容 |

### 我的志願

| 現有功能 | 現有 URL | PRD 對應位置 | 處理方式 |
| --- | --- | --- | --- |
| 志願中心／候選清單 | `/planner` | 我的志願 hub | 保留為兩種平行方式的入口，不再命名為候選清單 |
| 自選排序 | `/planner/custom` | 我的志願 → 自己排 | 保留；加入、刪除、拖曳／排序、備註、健檢與弱點分析集中於此 |
| 排序與健檢 | `/planner/check` | 自己排內的健檢 panel | 移除獨立頁；redirect `/planner/custom?panel=health-check` |
| 系統推薦 | `/planner/recommend` | 我的志願 → 系統推薦 | 保留；與自己排共用同一份清單，顯示挑戰／適中／穩定與推薦理由 |
| 版本紀錄 | `/planner/versions` | 我的志願 → 版本紀錄 | 保留；使用真正 snapshot／恢復能力 |
| 列印／下載 | `/planner/export` | 我的志願 → 列印／下載 | 保留；提供列印、PDF／摘要能力，不以說明文字代替功能 |
| 正式選填連結 | `/planner/official-platform` | 我的志願／官方資訊 → 官方招生平台 | 保留為官方入口；不宣稱取代官方選填 |
| 規劃分享 | `/planner/share` | 非主 IA 的只讀分享 | 保留 URL 但不列導航；robots noindex |
| 舊完整 PlannerWorkspace | `components/planner-workspace.tsx` | 自己排的歷史實作素材 | 不由任何 canonical route 掛載；能力以新自己排工作區為準 |

### 升學日程

| 現有功能 | 現有 URL | PRD 對應位置 | 處理方式 |
| --- | --- | --- | --- |
| 時間日程中心 | `/schedule` | 升學日程 → 升學總覽 | 改名與職責；總覽只呈現年度、倒數、階段、下一日期、待辦與進度 |
| 全年倒數計時 | `/schedule/countdown` | 升學總覽內的倒數 | redirect `/schedule`；倒數能力保留在總覽 |
| 重要時程 | `/schedule/timeline` | 升學日程 → 重要時程 | 保留；Timeline 狀態為 confirmed／pending／previous_year_reference，並整合區域比較與 ICS |
| 各就學區時程比較 | `/schedule/compare` | 重要時程內的比較 | redirect `/schedule/timeline`；比較控制留在 Timeline |
| 現在該做什麼 | `/schedule/now` | 升學日程 → 現在該做什麼 | 保留；依日期、就學區、規則閱讀、試算、志願與健檢進度產生下一步 |
| 升學待辦清單 | `/schedule/tasks` | 升學日程 → 我的待辦 | 保留；拆成 systemTasks 與 userTasks |
| 行事曆匯出 | `/schedule/export` | 重要時程頁內按鈕 | redirect `/schedule/timeline`；ICS 匯出保留在 Timeline |
| 校園開放日行事曆 | `/schedule/open-days` | 找學校 → 校園開放日 | redirect `/schools/open-days`；不再出現在升學日程選單 |

### 官方資訊／升學指南／資料與信任

| 現有功能 | 現有 URL | PRD 對應位置 | 處理方式 |
| --- | --- | --- | --- |
| JSHS 升學情報首頁 | `/news` | 官方資訊 → 官方最新公告 | 重做為官方-only；不得再顯示 JSHS 編輯文章 |
| JSHS 文章與分類頁 | `/news/[slug]`、`/news/exam` 等 | 升學指南內相應內容，或無 canonical 對應 | 從官方導航與 Footer 移除；舊 URL redirect 至五大指南分類、找學校或官方首頁，不再直接渲染為官方內容 |
| 官方簡章與規則 | `/admission-guides` | 官方資訊 → 官方簡章與規則 | 保留；原始 PDF／官方網站與年度狀態明確分離 |
| 官方招生時程 | `/admission-guides/schedule` | 官方資訊 → 官方招生時程 | 建立 official-only canonical route；不得放 JSHS 建議 |
| 官方招生平台 | `/planner/official-platform` | 官方資訊 → 官方招生平台 | 共用官方入口 component；可從兩個 PRD 指定位置進入 |
| 升學知識首頁 | `/knowledge` | 升學指南 hub | 重做為五個固定分類，不列舊內容入口 |
| 入門／白話規則／百科／生涯 | `/knowledge/*` | 升學指南五類 | canonical pages 保留；迷思、影音、Podcast、經驗等改為分類內內容或相容 redirect |
| 特殊資格 | `/eligibility`、`/eligibility/[topic]` | 升學指南 → 特殊入學與資格 | 保留能力與初步判定聲明；active nav 歸屬升學指南 |
| 群科介紹 | `/knowledge/groups` | 找學校 → 群科介紹 | 移至 `/schools/groups`；舊路由 redirect |
| 信任首頁與詳情 | `/trust`、`/trust/[slug]` | 資料與信任七類 | canonical 七類保留；社群／政策等非 PRD 額外內容不進主導航 |
| 帳號／通知／AI／搜尋 | `/account`、`/notifications`、`/ai`、`/search` | 右上角全域功能 | 保留為 global utility，不加入七大主選單 |
| 管理後台／API | `/admin/**`、`/api/**` | 後台與系統邊界 | 不屬公開 IA；維持必要功能與權限隔離 |

## 4. Data trust／年度決策

全站以既有 `sourceType` 五值為唯一顯示分類：

| sourceType | UI 標籤 | 使用範圍 |
| --- | --- | --- |
| `official` | 官方 | 官方單位、學校官網、正式簡章、原始公告 |
| `official_based_calculation` | 依官方資料計算 | 積分、同分比序與 JSHS 計算結果 |
| `jshs_curated` | JSHS 整理 | 結構化資料、索引與整理頁 |
| `jshs_estimated` | JSHS 推估 | 落點、推薦、風險分層與估算 |
| `community` | 社群資料 | 學長姐分享、匿名回報與使用者經驗 |

年度欄位固定分離：

```text
serviceYear = 116
sourceAcademicYear = 115
verificationStatus = awaiting_116_official_release
```

尚未有 116 官方簡章的區域不得把 115 資料改字串冒充 116；前端須顯示「116 學年度試算，目前暫依 115 學年度官方規則。」並保留最後更新／校核資訊。

## 5. 互動與資料流驗收基線

canonical 主線：

```text
找學校 → 算成績 → 我的志願（自己排／系統推薦）
       → 結構化志願健檢 → 調整志願
       → 升學日程／官方資訊 → 官方選填平台
```

必須驗證的實際流：

1. 學校／校科結果可以加入唯一共享志願清單。
2. 試算完成可以把就學區、積分、會考與必要資料帶入自己排或系統推薦。
3. 自己排與系統推薦讀寫同一份清單；推薦可加入，自己排弱點可帶入聚焦推薦。
4. 自己排的拖曳／排序後，健檢以結構化項目更新，而不是只顯示長文。
5. 升學總覽倒數與待辦讀取實際進度；「現在該做什麼」直接連到可操作功能。
6. 重要時程可比較 2–3 區並在頁內產出 ICS；匯出後明確提醒不會自動同步更新。
7. 官方時程節點直接連到官方招生平台；官方頁面不混入推估、社群或個人待辦。

## 6. 本次修改順序

1. 先建立 canonical IA 的單一資料鏡像，移除 JSON／runtime 分歧。
2. 收斂 routes：合併頁內能力，建立 legacy redirect，移除舊導航／Footer／首頁／搜尋 shortcut。
3. 修正內容頁職責：官方 only、指南五分類、找學校群科與校園開放日。
4. 修正跨頁狀態與 loading／empty／error，確認沒有 dead CTA。
5. 最後做 desktop、375／390／430px、typecheck、test、build、production placeholder 與 route smoke。
