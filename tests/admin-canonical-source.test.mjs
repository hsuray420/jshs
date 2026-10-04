import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("後台資料入口只列出通過驗證的 canonical CSV", async () => {
  const [page, registry] = await Promise.all([
    read("app/admin/data/csv/page.tsx"),
    read("content/schools/region-registry.json"),
  ]);

  assert.match(page, /getAvailableSchoolDataRegions/);
  assert.match(page, /GitHub 原始檔/);
  assert.match(page, /csvPath/);
  assert.equal((registry.match(/"schoolDataStatus": "available"/g) || []).length, 7);
  assert.equal((registry.match(/"schoolDataStatus": "verifying"/g) || []).length, 8);
});

test("學校後台詳情透過集中 mapping 修改前台欄位，但保護跨檔案識別欄位", async () => {
  const [editor, csv, fields] = await Promise.all([
    read("components/admin-school-detail-editor.tsx"),
    read("lib/school-admin-csv.mjs"),
    read("lib/school-admin-fields.mjs"),
  ]);

  assert.match(editor, /招生與課程/);
  assert.match(editor, /前台查看/);
  assert.match(csv, /editableCsvColumns/);
  assert.match(fields, /csvColumn: '科系與名額'/);
  assert.match(fields, /csvColumn: '招生名額'/);
  assert.match(fields, /csvColumn: '學制分類'/);
  assert.match(fields, /csvColumn: '學校代碼'.*editable: false/);
  assert.match(fields, /csvColumn: '招生區'.*editable: false/);
});
