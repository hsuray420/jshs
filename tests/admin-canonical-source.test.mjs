import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("後台資料入口列出十五區 canonical CSV 與 GitHub 檔案路徑", async () => {
  const [page, registry] = await Promise.all([
    read("app/admin/data/csv/page.tsx"),
    read("content/schools/region-registry.json"),
  ]);

  assert.match(page, /getAvailableSchoolDataRegions/);
  assert.match(page, /GitHub 原始檔/);
  assert.match(page, /csvPath/);
  assert.equal((registry.match(/"schoolDataStatus": "available"/g) || []).length, 15);
});

test("學校後台詳情可修改所有影響前台的 CSV 欄位，但保護跨檔案識別欄位", async () => {
  const [editor, csv] = await Promise.all([
    read("components/admin-school-detail-editor.tsx"),
    read("lib/school-admin-csv.mjs"),
  ]);

  assert.match(editor, /招生與課程/);
  assert.match(editor, /前台查看/);
  assert.match(csv, /'科系與名額'/);
  assert.match(csv, /'招生名額'/);
  assert.match(csv, /'學制分類'/);
  assert.match(csv, /'學校代碼', '招生區', '排名'/);
});
