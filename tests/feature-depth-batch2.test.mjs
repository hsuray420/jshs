import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("Batch 2 export uses a Traditional-Chinese capable PDF font and paginates long summaries", async () => {
  const page = await source("components/planner-export-workspace.tsx");
  assert.match(page, /MSung-Light|UniCNS-UTF16-H/);
  assert.match(page, /頁碼|Page/);
  assert.doesNotMatch(page, /function ascii/);
  assert.match(page, /school_name/);
  assert.match(page, /department/);
  assert.match(page, /notes/);
});

test("Batch 2 tasks distinguish local custom tasks and provide edit/delete persistence", async () => {
  const page = await source("components/schedule-workspace.tsx");
  assert.match(page, /此待辦目前儲存在這台裝置/);
  assert.match(page, /編輯/);
  assert.match(page, /刪除/);
  assert.match(page, /確認刪除/);
  assert.match(page, /jshs_user_tasks/);
});

test("Batch 2 open-day records include full personal-record fields and no false official label", async () => {
  const page = await source("components/schedule-workspace.tsx");
  for (const label of ["活動名稱", "日期", "時間", "地點", "來源網址", "備註", "個人紀錄"]) assert.match(page, new RegExp(label));
  assert.match(page, /校園開放日紀錄/);
  assert.match(page, /onEdit/);
  assert.match(page, /完成/);
});

test("Batch 2 school fields expose a traceable provenance contract", async () => {
  const [page, provenance] = await Promise.all([source("app/schools/[district]/[code]/page.tsx"), source("lib/school-field-provenance.ts")]);
  assert.match(page, /FieldProvenance/);
  for (const key of ["sourceType", "sourceUrl", "sourceTitle", "schoolYear", "verifiedAt", "status"]) assert.match(provenance, new RegExp(key));
  assert.match(page, /查看資料來源/);
});

test("Batch 2 map coordinates expose deterministic confidence and retain no-coordinate schools", async () => {
  const [api, map] = await Promise.all([source("app/api/school-geocode/route.ts"), source("components/school-map-explorer.tsx")]);
  for (const key of ["schoolCode", "coordinateSource", "matchedName", "matchMethod", "confidence", "verifiedAt"]) assert.match(api, new RegExp(key));
  assert.match(map, /自動比對，可能需要校正/);
  assert.match(map, /尚未取得座標/);
});

test("Batch 2 account and notification channels distinguish unavailable states", async () => {
  const [account, workspace] = await Promise.all([source("components/account-center.tsx"), source("components/notification-feature-workspace.tsx")]);
  for (const text of ["服務尚未設定", "服務暫時失敗", "登入取消", "登入逾時", "登入工作階段已失效"]) assert.match(account, new RegExp(text));
  assert.match(workspace, /not_configured|unavailable|requires_login/);
  assert.match(workspace, /目前尚未提供 Email 通知/);
  assert.match(workspace, /目前尚未提供手機推播/);
});

test("Batch 2 AI separates general, JSHS data, and official-source-required answers", async () => {
  const [policy, route] = await Promise.all([source("lib/assistant-policy.ts"), source("app/api/assistant/route.ts")]);
  assert.match(policy, /OFFICIAL_SOURCE_REQUIRED/);
  assert.match(policy, /JSHS_DATA/);
  assert.match(route, /目前本站沒有足夠的官方資料可以確認這項規定/);
  assert.match(route, /schoolYear/);
  assert.match(route, /sources/);
});
