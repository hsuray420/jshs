import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("school directory exposes searchable national records with trust metadata", async () => {
  const [directory, schoolsPage] = await Promise.all([
    read("lib/school-directory.ts"),
    read("app/schools/page.tsx"),
  ]);

  assert.match(directory, /schoolDirectory/);
  for (const field of ["districtCode", "districtLabel", "academicYear", "dataStatus", "groups", "hasQuota", "hasHistoricalData", "sourceUrl"]) {
    assert.match(directory, new RegExp(field));
  }
  assert.match(schoolsPage, /schoolDistrictOptions/);
  assert.match(schoolsPage, /SchoolExplorer/);
});

test("new school center supports search, filters, selected conditions, and decision actions", async () => {
  const explorer = await read("components/school-explorer.tsx");

  for (const label of ["搜尋學校名稱、科系、群科、縣市、學校代碼", "就學區", "學制分類", "公私立", "縣市", "有招生名額", "有歷年參考資料", "已選條件", "清除條件", "加入規劃", "查看官方網站"]) {
    assert.match(explorer, new RegExp(label));
  }
  assert.match(explorer, /hasQuota/);
  assert.match(explorer, /hasHistoricalData/);
  assert.doesNotMatch(explorer, /jshs:school-compare|加入比較|比較工作區/);
  assert.match(explorer, /資料狀態/);
});

test("all school surfaces use the CSV field naming standard", async () => {
  const [detail, explorer, search, history, header, comparison] = await Promise.all([
    read("app/schools/[district]/[code]/page.tsx"),
    read("components/school-explorer.tsx"),
    read("app/search/page.tsx"),
    read("components/admission-history-explorer.tsx"),
    read("components/site-header.tsx"),
    read("components/school-comparison-explorer.tsx"),
  ]);

  for (const [source, labels] of [
    [detail, ["學制分類", "縣市", "區", "科系與名額", "招生名額", "招生區", "正式簡章連結", "交通方式", "通勤資訊", "住宿資訊", "生活資料來源"]],
    [explorer, ["學校名稱", "科系", "學制分類", "縣市"]],
    [search, ["學制分類", "科系"]],
    [history, ["科系"]],
    [header, ["搜尋學校、會考、志願、資格"]],
    [comparison, ["學校類型", "公私立", "科別", "招生名額", "資料年度"]],
  ]) {
    for (const label of labels) assert.match(source, new RegExp(label));
  }

  assert.doesNotMatch(detail, /學校類型|招生管道|科別與課程方向|適合什麼樣的學生|住宿／交通資訊/);
});

test("school details keep decision sections without duplicating separate history or alumni tools", async () => {
  const [page, actions] = await Promise.all([
    read("app/schools/[district]/[code]/page.tsx"),
    read("components/school-decision-actions.tsx"),
  ]);

  for (const label of ["一眼看懂", "學習內容", "招生資訊", "生活條件", "決策操作", "適合學生", "交通方式", "通勤資訊", "住宿資訊"]) {
    assert.match(page, new RegExp(label));
  }
  assert.doesNotMatch(page, /HISTORICAL REFERENCE|歷年參考|ALUMNI SHARING|學長姐分享/);
  for (const label of ["加入挑戰", "加入適中", "加入穩定", "加備註"]) {
    assert.match(actions, new RegExp(label));
  }
  assert.doesNotMatch(page, /maps\/search|Google Maps/);
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
