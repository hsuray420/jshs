import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("查學校選單提供查詢、歷年、分享、地圖、費用與通勤入口", async () => {
  const siteMap = JSON.parse(await read("content/site-map.json"));
  const schoolGroup = siteMap.menuGroups.find(({ label }) => label === "找學校");
  const items = schoolGroup.items;
  const labels = items.map(({ label }) => label);

  assert.ok(labels.includes("全國校科查詢"));
  assert.ok(labels.includes("歷年錄取"));
  for (const [label, href] of [
    ["學長姐分享", "/schools/alumni"],
    ["學校地圖", "/schools/map"],
    ["費用試算", "/schools/cost"],
    ["通勤比較", "/schools/commute"],
  ]) {
    assert.equal(items.find((item) => item.label === label)?.href, href);
  }
  for (const removed of ["就學區找學校", "學校詳細資料"]) {
    assert.equal(labels.includes(removed), false, `不應再有：${removed}`);
  }
});

test("全國高中職查詢提供比較與地圖的獨立入口", async () => {
  const explorer = await read("components/school-explorer.tsx");
  for (const label of ["學制", "公私立", "縣市", "招生名額", "清除篩選", "全國高中職查詢"]) {
    assert.match(explorer, new RegExp(label));
  }
  assert.match(explorer, /schools\/compare/);
  assert.match(explorer, /schools\/map/);
});

test("歷年錄取查詢使用可稽核資料契約並分開官方與社群資料", async () => {
  const [page, history] = await Promise.all([
    read("app/schools/history/page.tsx"),
    read("components/admission-history-explorer.tsx"),
  ]);
  assert.match(page, /AdmissionHistoryExplorer/);
  assert.match(page, /AdmissionHistoryExplorer/);
  assert.match(history, /historical-records\.json/);
  assert.doesNotMatch(history, /school-directory\.json/);
  assert.match(history, /官方資料/);
  assert.match(history, /社群參考資料/);
  assert.match(history, /目前沒有找到這個年度的官方歷史資料/);
});

test("canonical school data and historical records remain separate", async () => {
  const [directory, history, generator] = await Promise.all([
    read("content/schools/generated/metadata.json").then(JSON.parse),
    read("public/it_hs/admission-history.json").then(JSON.parse),
    read("scripts/generate-school-directory.mjs"),
  ]);

  assert.equal(directory.schoolCount, 545);
  assert.ok(history.schools.length > 0);
  assert.ok(history.schools.every((school) => school.sourceType === "community"));
  assert.match(generator, /generate-schools/);
  assert.doesNotMatch(generator, /admission-history\.json/);
});

test("找學校工具各自有 canonical route 與可操作頁面", async () => {
  for (const route of ["history", "map", "compare", "commute", "cost", "alumni", "open-days", "groups"]) {
    await access(new URL(`../app/schools/${route}/page.tsx`, import.meta.url));
  }
  const [alumni, map, cost, commute, comparison] = await Promise.all([
    read("components/school-alumni-explorer.tsx"),
    read("components/school-map-explorer.tsx"),
    read("components/school-cost-planner.tsx"),
    read("components/commute-comparison.tsx"),
    read("components/school-comparison-explorer.tsx"),
  ]);
  assert.match(alumni, /school-reviews/);
  assert.match(alumni, /學長姐分享/);
  assert.match(map, /已核對學校位置地圖/);
  assert.match(map, /openstreetmap|OpenStreetMap/i);
  assert.match(map, /address/);
  assert.match(cost, /費用/);
  assert.match(cost, /三年/);
  assert.match(cost, /估算/);
  assert.match(commute, /校方交通資訊/);
  assert.match(commute, /你的路線試算/);
  assert.match(commute, /加入學校/);
  assert.match(comparison, /2 至 4/);
});

test("學校地圖使用 OpenStreetMap，並只顯示有來源的座標", async () => {
  const [map, route, globals, packageJson] = await Promise.all([
    read("components/school-map-explorer.tsx"),
    read("app/api/school-geocode/route.ts"),
    read("app/globals.css"),
    read("package.json"),
  ]);
  const manifest = JSON.parse(packageJson);
  assert.ok(manifest.dependencies.leaflet);
  assert.match(map, /import\('leaflet'\)/);
  assert.match(map, /tile.openstreetmap.org/);
  assert.match(map, /fitBounds/);
  assert.match(map, /setView/);
  assert.match(map, /getSchoolCoordinate/);
  assert.match(map, /尚無已核對座標/);
  assert.match(map, /Google 地圖開啟/);
  assert.match(map, /selected/);
  assert.doesNotMatch(map, /通勤時間|distance/);
  assert.doesNotMatch(route, /nominatim\.openstreetmap\.org/);
  assert.match(globals, /leaflet\/dist\/leaflet\.css/);
  assert.doesNotMatch(route, /overpass-api\.de/);
  assert.match(route, /district/);
  assert.match(route, /coordinates/);
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
  assert.match(history, /歷年錄取資料探索/);
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
