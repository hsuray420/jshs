import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("national school directory turns every district CSV into addressable records", async () => {
  const directory = await read("lib/school-directory.ts");
  assert.match(directory, /Object\.entries\(csvByDistrict\)/);
  assert.match(directory, /schoolDirectory/);
  assert.match(directory, /hasQuota/);
  assert.match(directory, /hasHistoricalData/);
});

test("every school detail route has a static decision page contract", async () => {
  const page = await read("app/schools/[district]/[code]/page.tsx");
  assert.match(page, /generateStaticParams/);
  assert.match(page, /EducationalOrganization/);
  assert.doesNotMatch(page, /Google Maps|maps\/search/);
  assert.match(page, /SchoolDecisionActions/);
  assert.match(page, /歷年參考區間/);
});

test("school search results link into every district detail route", async () => {
  const explorer = await read("components/school-explorer.tsx");
  assert.match(explorer, /href={`\/schools\/\$\{school\.districtCode\}\/\$\{school\.code\}`}/);
  assert.match(explorer, /查看官方網站/);
  assert.doesNotMatch(explorer, /加入比較|比較工作區/);
});

test("sitemap generator includes all national school detail records", async () => {
  const script = await read("scripts/generate-sitemap.mjs");
  assert.match(script, /Object\.entries\(districtMetadata\.districts\)/);
  assert.match(script, /\/schools\/\$\{districtCode\}\/\$\{school\.code\}/);
});

test("legacy guide routes school actions to the new center and has no old school page", async () => {
  const [guide, guideScript] = await Promise.all([read("public/it_hs/guide.htm"), read("public/it_hs/guide.js")]);
  assert.doesNotMatch(guide, /data-page-section="schools"/);
  assert.doesNotMatch(guide, /id="schoolSearch"/);
  assert.doesNotMatch(guideScript, /function renderSchools\(/);
  assert.match(guide, /href="\/schools"/);
});
