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

test("校園開放日已從使用者產品移除，舊網址導回日程", async () => {
  const [schoolsRoute, scheduleRoute, siteMap] = await Promise.all([source("app/schools/open-days/page.tsx"), source("app/schedule/open-days/page.tsx"), source("content/site-map.json")]);
  assert.match(schoolsRoute, /redirect\("\/schools"\)/);
  assert.match(scheduleRoute, /redirect\("\/schedule"\)/);
  assert.doesNotMatch(siteMap, /校園開放日|open-days/);
});

test("school fields expose per-section source links from the canonical repository", async () => {
  const [page, repository] = await Promise.all([source("components/school-detail.tsx"), source("lib/school-repository.ts")]);
  for (const key of ["address", "transport", "lodging", "course", "project", "life"]) assert.match(repository, new RegExp(key));
  assert.match(page, /查看資料來源/);
  assert.match(page, /資料來源/);
});

test("map coordinates use a provenance cache and retain schools without coordinates", async () => {
  const [api, map, discovery, audit, geocode] = await Promise.all([source("app/api/school-geocode/route.ts"), source("components/school-map-explorer.tsx"), source("components/school-discovery-explorer.tsx"), source("SCHOOL_MAP_AUDIT.md"), source("lib/school-geocode.ts")]);
  for (const key of ["getSchoolCoordinate", "verifiedAt"]) assert.match(api + map + geocode, new RegExp(key));
  assert.match(map, /未有可驗證座標的學校/);
  assert.match(discovery, /school-search-index|useSchoolSearchIndex/);
  assert.match(audit, /13 所學校.*不顯示標記.*仍保留/s);
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
