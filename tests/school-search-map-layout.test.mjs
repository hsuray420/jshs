import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("全國校科查詢保留搜尋主軸，不在入口重複品牌與官方資料導言，也不載入學校照片", async () => {
  const source = await read("components/school-explorer.tsx");

  assert.doesNotMatch(source, /官方資料查校|從官方資料開始，認識每一所高中/);
  assert.doesNotMatch(source, /SchoolMedia/);
  assert.match(source, /sv-school-card-symbol/);
});

test("學校地圖先呈現地圖，提供區域總覽與指定學校定位，且不重複校科導覽", async () => {
  const source = await read("components/school-map-explorer.tsx");

  assert.doesNotMatch(source, /SchoolRegionControl/);
  assert.match(source, /顯示整個\{regionName\}/);
  assert.match(source, /選擇要在地圖定位的學校/);
  assert.match(source, /showWholeRegion/);
});

test("找學校與地圖頁的主內容在頁尾前保留柔和漸層過渡", async () => {
  const css = await read("app/globals.css");

  assert.match(css, /\.jshs-page-shell\.jshs-feature-school > footer::before/);
  assert.match(css, /linear-gradient\(180deg, transparent, #fff\)/);
});
