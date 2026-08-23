import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteMapUrl = new URL("../content/site-map.json", import.meta.url);
const headerUrl = new URL("../components/site-header.tsx", import.meta.url);
const footerUrl = new URL("../components/site-footer.tsx", import.meta.url);
const expectedGroups = ["查學校", "算成績", "時間日程", "我的志願", "特殊資格", "升學知識", "更多"];
const requiredLabels = [
  "全國學校查詢", "學制篩選（普高／技高／綜高／五專）", "群科／十五群科介紹", "校科比較表", "費用試算",
  "開始試算", "積分／序位換算說明", "成績歷史紀錄", "模擬考先估落點", "全年倒數計時", "重要時程總覽",
  "升學待辦清單", "個人化行事曆匯出", "我的候選校科清單", "排序與健檢", "版本紀錄", "列印／下載",
  "資格自我檢測", "特色招生／特色班", "跨區就學資格判定", "僑生／境外生說明", "3 分鐘看懂免試入學",
  "名詞小百科", "常見迷思破解", "AI 問答小幫手", "會員登入", "通知與提醒", "資料來源與更新紀錄", "資料錯誤回報", "支持／合作",
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
  assert.match(header, /group\.items/);
  assert.doesNotMatch(header, /功能準備中/);
  assert.match(footer, /menuGroups\.map/);
});
