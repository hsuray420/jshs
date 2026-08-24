import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

async function source(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("notification controls define all three admin-managed LINE events", async () => {
  const notifications = await source("lib/notifications.ts");
  const store = await source("db/notification-store.ts");
  const adminPage = await source("app/admin/page.tsx");
  const adminRoute = await source("app/api/admin/notifications/route.ts");

  for (const eventKey of ["planner_finalized", "score_calculated", "important_date"]) {
    assert.match(notifications, new RegExp(eventKey));
    assert.match(store, new RegExp(eventKey));
    assert.match(adminPage, new RegExp(eventKey));
    assert.match(adminRoute, new RegExp(eventKey));
  }

  assert.match(store, /CREATE TABLE IF NOT EXISTS notification_settings/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS important_dates/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS member_notification_preferences/);
  assert.match(store, /planner_finalized_enabled/);
  assert.match(store, /score_calculated_enabled/);
  assert.match(store, /important_date_enabled/);
  assert.match(adminPage, /重要日期/);
  assert.match(adminPage, /通知開關|通知主控/);
  assert.match(adminRoute, /requireAdmin/);
});

test("member actions send notifications only after successful operations", async () => {
  const plannerRoute = await source("app/api/planner/finalize/route.ts");
  const scoreRoute = await source("app/api/admission/calculate/route.ts");

  assert.match(plannerRoute, /getMemberSession/);
  assert.match(plannerRoute, /notifyMember/);
  assert.match(plannerRoute, /isMemberNotificationEnabled/);
  assert.match(plannerRoute, /finalize|完成志願/);
  assert.match(scoreRoute, /getMemberSession/);
  assert.match(scoreRoute, /notifyMember/);
  assert.match(scoreRoute, /isMemberNotificationEnabled/);
  assert.match(scoreRoute, /calculateAdmissionScore/);
});

test("members can explicitly opt in or out of each LINE notification category", async () => {
  const preferencesRoute = await source("app/api/notifications/preferences/route.ts");
  const notificationUi = await source("components/notification-center.tsx");

  assert.match(preferencesRoute, /getMemberSession/);
  assert.match(preferencesRoute, /updateMemberNotificationPreferences/);
  assert.match(preferencesRoute, /planner_finalized_enabled/);
  assert.match(preferencesRoute, /score_calculated_enabled/);
  assert.match(preferencesRoute, /important_date_enabled/);
  assert.match(notificationUi, /api\/notifications\/preferences/);
  assert.match(notificationUi, /志願完成通知|重要日期通知|成績試算通知/);
  assert.match(notificationUi, /LINE 登入/);
});

test("important-date notifications are scheduled and exposed to the schedule page", async () => {
  const worker = await source("worker/index.ts");
  const wrangler = await source("wrangler.jsonc");
  const scheduleRoute = await source("app/api/schedule/route.ts");
  const notifications = await source("lib/notifications.ts");
  const scheduleUi = await source("components/schedule-workspace.tsx");

  assert.match(worker, /scheduled/);
  assert.match(worker, /dispatchDueImportantDateNotifications/);
  assert.match(wrangler, /crons/);
  assert.match(scheduleRoute, /listImportantDates/);
  assert.match(notifications, /dispatchDueImportantDateNotifications/);
  assert.match(scheduleUi, /api\/schedule/);
});

test("notification templates are bounded and rendered without exposing secrets", async () => {
  const notifications = await source("lib/notifications.ts");

  assert.match(notifications, /MAX_TEMPLATE_LENGTH/);
  assert.match(notifications, /renderNotificationTemplate/);
  assert.match(notifications, /pushLineText/);
  assert.doesNotMatch(notifications, /LINE_CHANNEL_ACCESS_TOKEN\s*:/);
  assert.doesNotMatch(notifications, /console\.log\(.*TOKEN/i);
});
