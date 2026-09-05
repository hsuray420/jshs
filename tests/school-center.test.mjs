import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("school repository exposes the canonical entity and admission relation sources", async () => {
  const [repository, schoolsPage] = await Promise.all([read("lib/school-repository.ts"), read("app/schools/page.tsx")]);
  for (const field of ["getSchoolByCode", "getSchoolSummaries", "admissionRecords", "admissionDistricts", "lodgingStatus", "transportStatus"]) assert.match(repository, new RegExp(field));
  assert.match(schoolsPage, /getSchoolSummaries/);
  assert.match(schoolsPage, /SchoolExplorer/);
});

test("national school center supports full-text search and source-derived filters", async () => {
  const explorer = await read("components/school-explorer.tsx");

  for (const label of ["搜尋學校、科別或課程方向", "招生區／免試就學區", "學制", "公私立", "縣市", "有明確住宿資訊", "清除篩選", "有學生專車／校車資訊"]) {
    assert.match(explorer, new RegExp(label));
  }
  assert.match(explorer, /courseDirection/);
  assert.match(explorer, /features/);
  assert.match(explorer, /project/);
});

test("all school surfaces use the CSV field naming standard", async () => {
  const [detail, explorer, search, history, header, comparison] = await Promise.all([
    read("components/school-detail.tsx"),
    read("components/school-explorer.tsx"),
    read("app/search/page.tsx"),
    read("components/admission-history-explorer.tsx"),
    read("components/site-header.tsx"),
    read("components/school-comparison-explorer.tsx"),
  ]);

  for (const [source, labels] of [
    [detail, ["招生資訊", "招生名額", "招生區", "到校方式", "通勤說明", "住宿", "資料來源"]],
    [explorer, ["學校", "科別", "學制", "縣市"]],
    [search, ["學校", "科系"]],
    [history, ["科別"]],
    [header, ["搜尋學校、會考、志願、資格"]],
    [comparison, ["學制", "公私立", "科別", "招生名額"]],
  ]) {
    for (const label of labels) assert.match(source, new RegExp(label));
  }

  assert.doesNotMatch(detail, /學校類型|招生管道|科別與課程方向|適合什麼樣的學生|住宿／交通資訊/);
});

test("school details separate source-backed facts from historical and alumni tools", async () => {
  const page = await read("components/school-detail.tsx");

  for (const label of ["招生資訊", "課程與學習", "交通與通勤", "住宿", "資料來源"]) {
    assert.match(page, new RegExp(label));
  }
  assert.doesNotMatch(page, /HISTORICAL REFERENCE|歷年參考|ALUMNI SHARING|學長姐分享/);
  assert.match(page, /Google 地圖/);
});

test("the old embedded school search surface is removed from the legacy guide", async () => {
  const [guide, guideScript] = await Promise.all([
    read("public/it_hs/guide.htm"),
    read("public/it_hs/guide.js"),
  ]);

  assert.doesNotMatch(guide, /id="page-schools"/);
  assert.doesNotMatch(guide, /id="schoolSearch"/);
  assert.doesNotMatch(guide, /data-page="schools"/);
  assert.doesNotMatch(guideScript, /function initSchools\(/);
  assert.doesNotMatch(guideScript, /function renderSchools\(/);
  assert.doesNotMatch(guideScript, /schoolSearchAliases/);
});
