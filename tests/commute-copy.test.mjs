import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("commute navigation copy states routes are handled by Google Maps", async () => {
  const siteMap = JSON.parse(await readFile(new URL("../content/site-map.json", import.meta.url), "utf8"));
  const text = JSON.stringify(siteMap);
  assert.match(text, /路線交由 Google 地圖計算/);
  assert.doesNotMatch(text, /比較距離、時間與交通方式/);
});
