import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("school navigation opens the current discovery experience while preserving national query", async () => {
  const [header, menu, catalog] = await Promise.all([
    read("components/site-header.tsx"),
    read("components/navigation/mega-menu.tsx"),
    read("content/site-map.json"),
  ]);

  assert.match(header, /item\.label === "找學校" \? "\/schools\/explore"/);
  assert.match(menu, /group\.label === "找學校" \? "\/schools\/explore"/);
  assert.match(catalog, /"label": "探索學校", "href": "\/schools\/explore"/);
  assert.match(catalog, /"label": "全國校科查詢", "href": "\/schools"/);
});

test("public school discovery copy does not expose the storage format", async () => {
  const [discovery, commute] = await Promise.all([
    read("components/school-discovery-explorer.tsx"),
    read("components/commute-comparison.tsx"),
  ]);
  assert.doesNotMatch(discovery, /區域 CSV/);
  assert.doesNotMatch(commute, /各校 CSV/);
  assert.match(discovery, /官方區域資料/);
});

test("school exploration surfaces include restrained visual cues", async () => {
  const [discovery, map, css] = await Promise.all([
    read("components/school-discovery-explorer.tsx"),
    read("components/school-map-explorer.tsx"),
    read("components/school-discovery.css"),
  ]);
  assert.match(discovery, /FeatureIllustration/);
  assert.match(discovery, /sd-hero-illustration/);
  assert.match(map, /FeatureIllustration/);
  assert.match(map, /sm-toolbar-illustration/);
  assert.match(css, /radial-gradient/);
});
