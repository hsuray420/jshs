import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin persistence contains drafts and immutable audit records", async () => {
  const store = await read("db/admin-store.ts");
  assert.match(store, /CREATE TABLE IF NOT EXISTS school_data_drafts/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS school_data_audit/);
  assert.match(store, /listSchoolDataAudit/);
  assert.match(store, /createSchoolDataAuditEntries/);
});

test("school editor requires preview before publish and supports draft save", async () => {
  const editor = await read("components/admin-school-detail-editor.tsx");
  assert.match(editor, /儲存草稿/);
  assert.match(editor, /預覽變更/);
  assert.match(editor, /確認發布/);
  assert.doesNotMatch(editor, />儲存並同步 GitHub</);
});

test("admin exposes audit and data health pages without placeholder navigation", async () => {
  const [shell, audit, data] = await Promise.all([
    read("components/admin-shell.tsx"),
    read("app/admin/audit/page.tsx"),
    read("app/admin/data/page.tsx"),
  ]);
  assert.match(shell, /Audit Log/);
  assert.match(audit, /listSchoolDataAudit/);
  assert.match(data, /資料健康中心/);
  assert.match(data, /validation/);
});

test("school publish route checks same-origin requests and publish role", async () => {
  const route = await read("app/api/admin/schools/[schoolCode]/route.ts");
  assert.match(route, /assertSameOrigin/);
  assert.match(route, /requireAdminRole/);
  assert.match(route, /preview/);
  assert.match(route, /publish/);
});

