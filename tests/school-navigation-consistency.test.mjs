import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("school navigation uses one canonical school query while preserving the national interface", async () => {
  const [header, menu, catalog] = await Promise.all([
    read("components/site-header.tsx"),
    read("components/navigation/mega-menu.tsx"),
    read("content/site-map.json"),
  ]);

  assert.match(header, /item\.label === "找學校" \? "\/schools"/);
  assert.match(menu, /group\.label === "找學校" \? "\/schools"/);
  assert.doesNotMatch(catalog, /"label": "探索學校", "href": "\/schools\/explore"/);
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

test("school exploration surfaces use restrained brand texture instead of generated artwork", async () => {
  const [discovery, map, css] = await Promise.all([
    read("components/school-discovery-explorer.tsx"),
    read("components/school-map-explorer.tsx"),
    read("components/school-discovery.css"),
  ]);
  assert.doesNotMatch(discovery, /FeatureIllustration/);
  assert.doesNotMatch(map, /FeatureIllustration/);
  assert.match(css, /linear-gradient/);
});

test("feature families keep their own visual language", async () => {
  const [themes, mockPage] = await Promise.all([
    read("lib/feature-themes.ts"),
    read("app/scores/mock/page.tsx"),
  ]);
  assert.match(themes, /"mock-exam": \{ primary: "#7651c8"/);
  assert.match(mockPage, /theme="mock-exam"/);
  assert.match(mockPage, /jshs-feature-mock-exam/);
});
