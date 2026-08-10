import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appPageUrl = new URL("../app/page.tsx", import.meta.url);
const jshsPageUrl = new URL("../app/jshs/page.tsx", import.meta.url);
const legacyJshsPageUrl = new URL("../app/jshs/jshs/page.tsx", import.meta.url);
const legacyJshsHtmlUrl = new URL("../public/jshs/jshs.html", import.meta.url);
const districtScriptUrl = new URL("../public/it_hs/it_hs.js", import.meta.url);
const districtIndexUrl = new URL("../public/it_hs/ilan/index.html", import.meta.url);

test("root route sends visitors to the public homepage", async () => {
  const page = await readFile(appPageUrl, "utf8");

  assert.match(page, /redirect\("\/jshs\/home"\)/);
  assert.doesNotMatch(page, /localStorage|role="dialog"|setSelectedDistrict/);
});

test("legacy jshs entry points resolve to the single public homepage", async () => {
  const [jshsPage, legacyJshsPage, legacyHtml] = await Promise.all([
    readFile(jshsPageUrl, "utf8"),
    readFile(legacyJshsPageUrl, "utf8"),
    readFile(legacyJshsHtmlUrl, "utf8"),
  ]);

  assert.match(jshsPage, /redirect\("\/jshs\/home"\)/);
  assert.match(legacyJshsPage, /redirect\("\/jshs\/home"\)/);
  assert.match(legacyHtml, /url=\/jshs\/home/);
  assert.match(legacyHtml, /window\.location\.replace\('\/jshs\/home'\)/);
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

test("districts with a school CSV open school search without scoring tools", async () => {
  const [script, page] = await Promise.all([
    readFile(districtScriptUrl, "utf8"),
    readFile(new URL("../public/it_hs/it_hs.html", import.meta.url), "utf8"),
  ]);

  assert.match(script, /function isSchoolQueryOnlyMode\(\)/);
  assert.match(script, /\? 'schools' : 'overview'/);
  assert.match(script, /\['calculator', 'analysis'\]/);
  assert.match(page, /data-scoring-feature/);
});
