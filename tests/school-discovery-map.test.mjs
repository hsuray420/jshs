import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("school information architecture keeps one canonical query and a separate map", async () => {
  const [nationalPage, discoveryPage, siteMap, routes] = await Promise.all([
    read("app/schools/page.tsx"),
    read("app/schools/explore/page.tsx"),
    read("content/site-map.json"),
    read("content/route-metadata.json"),
  ]);
  assert.match(nationalPage, /SchoolExplorer/);
  assert.match(discoveryPage, /redirect\("\/schools"\)/);
  assert.match(siteMap, /"label": "全國校科查詢", "href": "\/schools"/);
  assert.match(routes, /"pathname": "\/schools\/explore"/);
});

test("discovery uses compact source-backed cards without school photography", async () => {
  const discovery = await read("components/school-discovery-explorer.tsx");
  for (const token of ["useSchoolSearchIndex", "normalizedSearchText", "admissionDistricts", "departmentNames", "共", "所學校"]) {
    assert.match(discovery, new RegExp(token));
  }
  assert.match(discovery, /readStoredDistrict/);
  assert.match(discovery, /writeStoredDistrict/);
  assert.doesNotMatch(discovery, /SchoolMedia|<img|next\/image/);
  assert.doesNotMatch(discovery, /人氣|排名|評分/);
});

test("map explorer is region-scoped, URL-addressable and resilient", async () => {
  const [map, config] = await Promise.all([
    read("components/school-map-explorer.tsx"),
    read("lib/school-map-config.ts"),
  ]);
  for (const token of ["URLSearchParams", "replaceState", "admissionDistricts", "departmentNames", "搜尋此區域", "mapSchoolPoints", "activeSchoolCode", "地圖暫時無法載入"]) {
    assert.match(map, new RegExp(token));
  }
  assert.match(config, /tile\.openstreetmap\.org/);
  assert.match(config, /OpenStreetMap contributors/);
  assert.doesNotMatch(map, /geolocation|getCurrentPosition/);
  assert.doesNotMatch(map, /Google 地圖/);
});

test("school module shares one persistent region control", async () => {
  const [control, discovery, map] = await Promise.all([
    read("components/school-region-control.tsx"),
    read("components/school-discovery-explorer.tsx"),
    read("components/school-map-explorer.tsx"),
  ]);
  assert.match(control, /getAvailableSchoolDataRegions/);
  assert.match(control, /writeStoredDistrict/);
  assert.match(discovery, /SchoolRegionControl/);
  assert.match(map, /SchoolRegionControl/);
});

test("verified coordinate coverage is audited for every available region", async () => {
  const audit = await read("SCHOOL_MAP_AUDIT.md");
  for (const region of ["基北區", "桃連區", "竹苗區", "中投區", "高雄區", "彰化區", "雲林區", "嘉義區", "臺南區", "屏東區", "宜蘭區", "花蓮區", "臺東區", "澎湖區", "金門區"]) assert.match(audit, new RegExp(region));
  assert.match(audit, /座標可用合計：532／545/);
});
