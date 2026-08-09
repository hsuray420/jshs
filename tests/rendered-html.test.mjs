import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appPageUrl = new URL("../app/page.tsx", import.meta.url);
const districtScriptUrl = new URL("../public/it_hs/it_hs.js", import.meta.url);
const districtIndexUrl = new URL("../public/it_hs/ilan/index.html", import.meta.url);

test("root route sends visitors to the public homepage", async () => {
  const page = await readFile(appPageUrl, "utf8");

  assert.match(page, /redirect\("\/jshs\/jshs\.html"\)/);
  assert.doesNotMatch(page, /localStorage|role="dialog"|setSelectedDistrict/);
});

test("district picker routes choices to district URLs", async () => {
  const script = await readFile(districtScriptUrl, "utf8");

  assert.match(script, /window\.location\.replace\(`\/it_hs\/\$\{encodeURIComponent\(district\)\}\/`\)/);
  assert.match(script, /localStorage\.setItem\('jshs_district', district\)/);
});

test("unavailable districts show a clear construction page", async () => {
  const [script, districtIndex] = await Promise.all([
    readFile(districtScriptUrl, "utf8"),
    readFile(districtIndexUrl, "utf8"),
  ]);

  assert.match(script, /function showDistrictUnavailablePage\(\)/);
  assert.match(script, /功能尚未開放/);
  assert.match(script, /查看中投區/);
  assert.match(script, /查看基北區/);
  assert.match(districtIndex, /district=\$\{encodeURIComponent\(district\)\}/);
});
