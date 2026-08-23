import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("查學校選單只保留全國校科查詢與歷年錄取成績查詢", async () => {
  const siteMap = JSON.parse(await read("content/site-map.json"));
  const schoolGroup = siteMap.menuGroups.find(({ label }) => label === "查學校");
  const labels = schoolGroup.items.map(({ label }) => label);

  assert.ok(labels.includes("全國校科查詢"));
  assert.ok(labels.includes("歷年錄取成績查詢"));
  for (const removed of ["學制篩選（普高／技高／綜高／五專）", "校科比較表", "學校地圖總覽", "費用試算"]) {
    assert.equal(labels.includes(removed), false, `不應再有：${removed}`);
  }
});

test("全國校科查詢不再顯示獨立比較與地圖功能", async () => {
  const explorer = await read("components/school-explorer.tsx");
  for (const label of ["學制", "公私立", "地區", "招生名額", "歷年資料", "清除條件", "查看學校詳情"]) {
    assert.match(explorer, new RegExp(label));
  }
  assert.doesNotMatch(explorer, /jshs:school-compare/);
  assert.doesNotMatch(explorer, /加入比較|比較工作區/);
});

test("歷年錄取查詢讀取同一份校科目錄並區分官方與非官方", async () => {
  const [page, history] = await Promise.all([
    read("app/schools/page.tsx"),
    read("components/admission-history-explorer.tsx"),
  ]);
  assert.match(page, /view === "history"/);
  assert.match(page, /AdmissionHistoryExplorer/);
  assert.match(history, /school-directory\.json/);
  assert.match(history, /最低錄取成績/);
  assert.match(history, /官方資料/);
  assert.match(history, /非官方整理/);
  assert.match(history, /sourceNote/);
});

test("學校詳情顯示最低錄取資料並提供非官方學長姐分享", async () => {
  const [page, api, store] = await Promise.all([
    read("app/schools/[district]/[code]/page.tsx"),
    read("app/api/school-reviews/route.ts"),
    read("db/school-review-store.ts"),
  ]);
  assert.match(page, /AlumniSharing/);
  assert.match(page, /最低錄取成績/);
  assert.doesNotMatch(page, /maps\/search/);
  assert.match(api, /schoolCode/);
  assert.match(api, /content/);
  assert.match(api, /sameOrigin/);
  assert.match(api, /consumeSchoolReviewRateLimit/);
  assert.match(store, /school_reviews/);
});
