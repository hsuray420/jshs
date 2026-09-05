import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("national school repository derives addressable entities from the canonical CSVs", async () => {
  const [repository, generator] = await Promise.all([read("lib/school-repository.ts"), read("scripts/generate-schools.mjs")]);
  assert.match(repository, /getSchoolByCode/);
  assert.match(generator, /schools_master\.csv/);
  assert.match(generator, /school_admission_records\.csv/);
  assert.doesNotMatch(generator, /public\/it_hs/);
});

test("every school-code route resolves a canonical, source-backed detail page", async () => {
  const [page, detail] = await Promise.all([read("app/schools/[district]/page.tsx"), read("components/school-detail.tsx")]);
  assert.match(page, /generateStaticParams/);
  assert.match(page, /getSchoolByCode/);
  assert.match(detail, /BreadcrumbList/);
  assert.match(detail, /招生區與共同就學區紀錄/);
  assert.match(detail, /查看資料來源/);
});

test("school search results link by the canonical school code", async () => {
  const explorer = await read("components/school-explorer.tsx");
  assert.match(explorer, /href={`\/schools\/\$\{s\.code\}`}/);
  assert.match(explorer, /招生區／免試就學區/);
  assert.match(explorer, /有明確住宿資訊/);
});

test("sitemap generator includes all canonical school-code records", async () => {
  const script = await read("scripts/generate-sitemap.mjs");
  assert.match(script, /content\/schools\/generated\/schools\.json/);
  assert.match(script, /\/schools\/\$\{school\.code\}/);
});

test("legacy guide routes school actions to the new center and has no old school page", async () => {
  const [guide, guideScript] = await Promise.all([read("public/it_hs/guide.htm"), read("public/it_hs/guide.js")]);
  assert.doesNotMatch(guide, /data-page-section="schools"/);
  assert.doesNotMatch(guide, /id="schoolSearch"/);
  assert.doesNotMatch(guideScript, /function renderSchools\(/);
  assert.match(guide, /href="\/schools"/);
});
