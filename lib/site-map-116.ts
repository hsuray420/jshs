import type { MenuGroup, NewsCategoryHub, PrimaryNavigationItem, MenuItem } from "@/lib/site-map";

export const primaryNavigation116: readonly PrimaryNavigationItem[] = [
  { label: "找學校", href: "/schools", activeHref: "/schools" },
  { label: "算成績", href: "/tools", activeHref: "/tools" },
  { label: "我的志願", href: "/planner", activeHref: "/planner" },
  { label: "升學日程", href: "/schedule", activeHref: "/schedule" },
  { label: "官方資訊", href: "/admission-guides", activeHref: "/admission-guides" },
  { label: "升學指南", href: "/knowledge", activeHref: "/knowledge" },
  { label: "資料與信任", href: "/trust", activeHref: "/trust" },
];

const item = (label: string, href: string, description: string, children?: readonly MenuItem[]): MenuItem => ({ label, href, description, children });

export const menuGroups116: readonly MenuGroup[] = [
  { label: "找學校", href: "/schools", activeHref: "/schools", eyebrow: "先找到值得了解的校科", description: "從全國校科查詢開始，再比較錄取參考、地圖、通勤、費用與學習內容。", items: [
    item("全國校科查詢", "/schools", "依就學區、縣市、學制、群科與科別搜尋"),
    item("歷年錄取參考", "/schools/history", "查看不同年度與資料來源的參考趨勢"),
    item("學校地圖", "/schools/map", "先選就學區，再查看該區學校位置"),
    item("學校比較", "/schools/compare", "並排比較 2–4 所學校／校科"),
    item("通勤比較", "/schools/commute", "比較距離、時間與交通方式"),
    item("費用試算", "/schools/cost", "區分官方金額、JSHS 估算與自行輸入"),
    item("學長姐分享", "/schools/alumni", "社群內容，不代表校方立場"),
    item("校園開放日", "/schools/open-days", "查看學校官方活動與參訪資訊"),
    item("群科介紹", "/knowledge/groups", "理解學習內容與後續方向"),
  ] },
  { label: "算成績", href: "/tools", activeHref: "/tools", eyebrow: "先理解規則，再完成試算", description: "目前開放 8 / 15 區；每個結果都保留規則年度與資料來源。", items: [
    item("成績積分試算", "/tools", "輸入資料並取得依官方規則計算的結果"),
    item("積分規則", "/tools/rules", "互動查看項目、公式、上限與官方來源"),
    item("模擬考落點", "/tools/placement", "JSHS 推估的挑戰／適中／穩定參考"),
    item("個人積分摘要", "/tools/summary", "查看最近一次試算與同分比序資料"),
    item("成績歷史", "/tools/history", "查看保存在裝置或帳號的試算紀錄"),
  ] },
  { label: "我的志願", href: "/planner", activeHref: "/planner", eyebrow: "把選項整理成可討論的清單", description: "自己排與系統推薦共用同一份志願清單，完成後可進行客觀健檢。", items: [
    item("自己排", "/planner/custom", "加入、排序、備註並查看志願健檢"),
    item("系統推薦", "/planner/recommend", "依目前資料提供挑戰、適中、穩定選項"),
    item("版本紀錄", "/planner/versions", "查看與恢復真正保存的志願快照"),
    item("列印／下載", "/planner/export", "取得志願摘要或列印版本"),
    item("官方選填平台", "/planner/official-platform", "前往正式官方志願選填平台"),
  ] },
  { label: "升學日程", href: "/schedule", activeHref: "/schedule", eyebrow: "知道現在該做什麼", description: "個人化查看 116 學年度階段、重要日期與待辦。", items: [
    item("升學總覽", "/schedule", "查看目前階段、倒數、進度與下一個重要日期"),
    item("重要時程", "/schedule/timeline", "以狀態清楚標示已公告、待公告與上年度參考"),
    item("現在該做什麼", "/schedule/now", "依日期、就學區與使用者進度產生下一步"),
    item("我的待辦", "/schedule/tasks", "管理自動同步的系統待辦與自訂待辦"),
  ] },
  { label: "官方資訊", href: "/admission-guides", activeHref: "/admission-guides", eyebrow: "只放官方原始資訊", description: "公告、簡章、官方招生時程與正式平台，與 JSHS 分析分開。", items: [
    item("官方最新公告", "/news", "查看正式招生單位發布的公告"),
    item("官方簡章與規則", "/admission-guides", "查看各區原始 PDF 與官方網站"),
    item("官方招生時程", "/admission-guides#schedule", "查看已公告、待公告與上年度參考日期"),
    item("官方招生平台", "/planner/official-platform", "前往報名、選填、序位與錄取查詢平台"),
  ] },
  { label: "升學指南", href: "/knowledge", activeHref: "/knowledge", eyebrow: "把制度講成人話", description: "先建立全貌，再回到精確規則與工具完成決策。", items: [
    item("升學入門", "/knowledge/admission-basics", "理解會考、積分、序位、志願到放榜"),
    item("志願與積分", "/knowledge/rules", "用白話理解判斷概念，不取代精確規則"),
    item("特殊入學與資格", "/eligibility", "查看特殊管道與資格初步檢測"),
    item("升學百科", "/knowledge/glossary", "查詢名詞、迷思與制度說明"),
    item("生涯探索", "/knowledge/fit-quiz", "探索高中、技高、五專與未來方向"),
  ] },
  { label: "資料與信任", href: "/trust", activeHref: "/trust", eyebrow: "知道每筆資料從哪裡來", description: "公開來源、更新狀態、建置進度、方法與更正機制。", items: [
    item("資料來源", "/trust/sources", "查看官方、整理、計算、推估與社群資料的界線"),
    item("資料更新狀態", "/trust/status", "查看服務年度、來源年度與最後校核"),
    item("15 區建置進度", "/trust/progress", "公開目前 8 / 15 區試算完成狀態"),
    item("試算與分析方法", "/trust/methodology", "了解規則資料、計算與推估限制"),
    item("資料版本紀錄", "/trust/versions", "查看目前資料版本與校核事件"),
    item("錯誤回報", "/trust/report", "回報資料、規則、日期或功能問題"),
    item("平台可信度說明", "/trust", "了解 JSHS 與官方招生單位的界線"),
  ] },
];

export type NewsCategoryHub116 = NewsCategoryHub;
