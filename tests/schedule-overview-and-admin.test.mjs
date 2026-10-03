import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("schedule overview exposes a responsive timeline and reminder actions", async () => {
  const workspace = await source("components/schedule-workspace.tsx");
  assert.match(workspace, /OverviewTimeline/);
  assert.match(workspace, /升學時間軸/);
  assert.match(workspace, /查看完整時間軸/);
  assert.match(workspace, /開啟 LINE 日期提醒/);
  assert.match(workspace, /md:before:left-6/);
});

test("admin can create, update, disable and delete managed schedule dates", async () => {
  const page = await source("app/admin/notifications/page.tsx");
  const route = await source("app/api/admin/notifications/route.ts");
  assert.match(page, /listImportantDates\(true\)/);
  assert.match(page, /create_date/);
  assert.match(page, /update_date/);
  assert.match(page, /delete_date/);
  assert.match(page, /event_date/);
  assert.match(page, /datetime-local/);
  assert.match(route, /createImportantDate/);
  assert.match(route, /updateImportantDate/);
  assert.match(route, /deleteImportantDate/);
});
