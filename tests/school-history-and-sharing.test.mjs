import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("查學校選單提供查詢、歷年、分享、地圖、費用與通勤入口", async () => {
  const siteMap = JSON.parse(await read("content/site-map.json"));
  const schoolGroup = siteMap.menuGroups.find(({ label }) => label === "查學校");
  const items = schoolGroup.items;
  const labels = items.map(({ label }) => label);

  assert.ok(labels.includes("全國校科查詢"));
  assert.ok(labels.includes("歷年錄取成績查詢"));
  for (const [label, href] of [
    ["學長姐分享", "/schools?view=alumni"],
    ["學校地圖", "/schools?view=map"],
    ["費用試算", "/schools?view=cost"],
    ["通勤比較", "/schools?view=commute"],
  ]) {
    assert.equal(items.find((item) => item.label === label)?.href, href);
  }
  for (const removed of ["學制篩選（普高／技高／綜高／五專）", "校科比較表"]) {
    assert.equal(labels.includes(removed), false, `不應再有：${removed}`);
  }
});

test("全國校科查詢不再顯示獨立比較與地圖功能", async () => {
  const explorer = await read("components/school-explorer.tsx");
  for (const label of ["學制分類", "公私立", "縣市", "招生名額", "歷年資料", "清除條件", "查看學校詳情"]) {
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

test("查學校四個獨立工具各自有路由與可操作頁面", async () => {
  const page = await read("app/schools/page.tsx");
  for (const [view, component] of [
    ["alumni", "SchoolAlumniExplorer"],
    ["map", "SchoolMapExplorer"],
    ["cost", "SchoolCostPlanner"],
    ["commute", "CommuteComparison"],
  ]) {
    assert.match(page, new RegExp(`view === "${view}"`));
    assert.match(page, new RegExp(component));
  }
  const [alumni, map, cost, commute] = await Promise.all([
    read("components/school-alumni-explorer.tsx"),
    read("components/school-map-explorer.tsx"),
    read("components/school-cost-planner.tsx"),
    read("components/commute-comparison.tsx"),
  ]);
  assert.match(alumni, /school-reviews/);
  assert.match(alumni, /學長姐分享/);
  assert.match(map, /學校地圖/);
  assert.match(map, /Google Maps/);
  assert.match(map, /address/);
  assert.match(cost, /費用/);
  assert.match(cost, /三年/);
  assert.match(cost, /估算/);
  assert.match(commute, /通勤比較/);
  assert.match(commute, /分鐘/);
  assert.match(commute, /選擇學校/);
});

test("學校地圖使用免付款的 OpenStreetMap 與 Leaflet 顯示標記並支援聚焦", async () => {
  const [map, route, globals, packageJson] = await Promise.all([
    read("components/school-map-explorer.tsx"),
    read("app/api/school-geocode/route.ts"),
    read("app/globals.css"),
    read("package.json"),
  ]);
  const manifest = JSON.parse(packageJson);
  assert.ok(manifest.dependencies.leaflet);
  assert.match(map, /from "leaflet"/);
  assert.match(map, /tile.openstreetmap.org/);
  assert.match(map, /fitBounds/);
  assert.match(map, /setView/);
  assert.match(map, /jshs-school-marker/);
  assert.match(map, /jshs-school-marker-pin/);
  assert.match(map, /shortSchoolName/);
  assert.match(map, /搜尋學校/);
  assert.match(map, /中投區/);
  assert.match(map, /住家位置/);
  assert.match(map, /通勤時間/);
  assert.match(map, /比較/);
  assert.match(map, /selectedSchools/);
  assert.match(map, /distance/);
  assert.match(map, /\/api\/school-geocode/);
  assert.match(route, /nominatim\.openstreetmap\.org/);
  assert.match(globals, /leaflet\/dist\/leaflet\.css/);
  assert.match(route, /overpass-api\.de/);
  assert.match(route, /district/);
  assert.match(route, /coordinates/);
  assert.match(route, /user-agent/i);
  assert.match(route, /q/);
  assert.doesNotMatch(map, /maps.googleapis.com/);
});

test("歷年與學長姐資料保留在獨立工具，不混入全國校科查詢詳情", async () => {
  const [page, history, alumni, api, store] = await Promise.all([
    read("app/schools/[district]/[code]/page.tsx"),
    read("components/admission-history-explorer.tsx"),
    read("components/school-alumni-explorer.tsx"),
    read("app/api/school-reviews/route.ts"),
    read("db/school-review-store.ts"),
  ]);
  assert.doesNotMatch(page, /HISTORICAL REFERENCE|歷年參考|ALUMNI SHARING|學長姐分享/);
  assert.match(history, /最低錄取成績/);
  assert.match(alumni, /學長姐分享/);
  assert.doesNotMatch(page, /maps\/search/);
  assert.match(api, /schoolCode/);
  assert.match(api, /listRecentSchoolReviews/);
  assert.match(api, /content/);
  assert.match(api, /sameOrigin/);
  assert.match(api, /consumeSchoolReviewRateLimit/);
  assert.match(store, /school_reviews/);
  assert.match(store, /ORDER BY created_at DESC LIMIT \?/);
});
