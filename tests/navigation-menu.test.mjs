import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteMapUrl = new URL("../content/site-map.json", import.meta.url);
const headerUrl = new URL("../components/site-header.tsx", import.meta.url);
const footerUrl = new URL("../components/site-footer.tsx", import.meta.url);

const expectedGroups = [
  "升學指南",
  "找校科",
  "試算工具",
  "我的規劃",
  "更多",
];

const requiredLabels = [
  "會考準備",
  "入學規則",
  "志願策略",
  "校科探索",
  "生涯選擇",
  "家長與新生",
  "全國學校搜尋",
  "群科探索",
  "五專探索",
  "學制比較",
  "校科比較表",
  "各區資料狀態",
  "各區適用規則",
  "各區重要日期",
  "各區官方委員會",
  "搜尋",
  "升學名詞 FAQ",
  "歷年統計",
  "資料來源與更新紀錄",
  "資料錯誤回報",
  "支持／合作",
];

function collectLabels(items) {
  return items.flatMap(({ label, children = [] }) => [label, ...collectLabels(children)]);
}

test("site map defines the complete menu groups from the product sitemap", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));
  assert.deepEqual(siteMap.menuGroups.map(({ label }) => label), expectedGroups);

  const labels = siteMap.menuGroups.flatMap(({ items }) => collectLabels(items));
  for (const label of requiredLabels) assert.ok(labels.includes(label), `missing menu item: ${label}`);
});

test("desktop and mobile navigation render the full submenu model", async () => {
  const [header, footer] = await Promise.all([
    readFile(headerUrl, "utf8"),
    readFile(footerUrl, "utf8"),
  ]);

  assert.match(header, /menuGroups\.map/);
  assert.match(header, /更多導覽/);
  assert.match(header, /瀏覽所有內容/);
  assert.match(header, /group\.items\.map/);
  assert.match(header, /功能準備中/);
  assert.match(footer, /menuGroups\.map/);
});
