import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteMapUrl = new URL("../content/site-map.json", import.meta.url);
const headerUrl = new URL("../components/site-header.tsx", import.meta.url);
const footerUrl = new URL("../components/site-footer.tsx", import.meta.url);
const expectedGroups = ["找學校", "算成績", "我的志願", "升學日程", "官方資訊", "升學指南", "資料與信任"];
const requiredLabels = [
  "全國校科查詢", "歷年錄取", "學長姐分享", "學校地圖", "費用試算", "通勤比較", "群科介紹",
  "成績積分試算", "積分規則", "成績歷史", "模擬考落點", "升學總覽", "重要時程",
  "現在該做什麼", "我的待辦", "自己排", "系統推薦", "版本紀錄", "列印／下載", "官方選填平台",
  "特殊入學與資格", "升學入門", "志願與積分", "升學百科", "生涯探索", "資料來源", "資料更新狀態",
  "15 區建置進度", "試算與分析方法", "資料版本紀錄", "錯誤回報", "平台可信度說明",
];

function collectLabels(items) { return items.flatMap(({ label, children = [] }) => [label, ...collectLabels(children)]); }

test("site map defines the final seven menu groups from the uploaded product sitemap", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));
  assert.deepEqual(siteMap.menuGroups.map(({ label }) => label), expectedGroups);
  const labels = siteMap.menuGroups.flatMap(({ items }) => collectLabels(items));
  for (const label of requiredLabels) assert.ok(labels.includes(label), `missing menu item: ${label}`);
});

test("desktop and mobile navigation render the same complete submenu model", async () => {
  const [header, footer] = await Promise.all([readFile(headerUrl, "utf8"), readFile(footerUrl, "utf8")]);
  assert.match(header, /menuGroups\.map/);
  assert.match(header, /finalNavigationLabels/);
  assert.match(header, /aria-label="主要導覽"/);
  assert.match(header, /role="dialog"/);
  assert.match(header, /搜尋內容與功能/);
  assert.match(header, /mobile-bottom-nav/);
  assert.match(header, /SiteIcon/);
  assert.match(header, /jshs-mobile-nav-item/);
  assert.match(header, /開啟更多功能選單/);
  assert.doesNotMatch(header, /[♧♙⌕☰↗]/);
  assert.match(header, /group\.items/);
  assert.doesNotMatch(header, /功能準備中/);
  assert.match(footer, /footerGroups\.map/);
  assert.match(footer, /快速入口/);
  assert.match(footer, /資料與信任/);
  assert.match(footer, /法律/);
});
