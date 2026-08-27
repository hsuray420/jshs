import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("community voting is LINE-member gated and one vote per topic/account", async () => {
  const [route, store, page] = await Promise.all([
    read("app/api/community/votes/route.ts"),
    read("db/community-vote-store.ts"),
    read("components/community-voting.tsx"),
  ]);
  assert.match(route, /member_required/);
  assert.match(store, /PRIMARY KEY\(topic_id, line_user_id\)/);
  assert.match(page, /CommunityVoting/);
});

test("planner versions are persisted for members and exposed by a route", async () => {
  const [store, stateRoute, versionsRoute, page] = await Promise.all([
    read("db/planner-store.ts"),
    read("app/api/planner/state/route.ts"),
    read("app/api/planner/versions/route.ts"),
    read("components/planner-versions.tsx"),
  ]);
  assert.match(store, /planner_versions/);
  assert.match(stateRoute, /createPlannerVersion/);
  assert.match(versionsRoute, /member_required/);
  assert.match(page, /selected/);
});

test("official platform entry is outbound-only and LINE weekly report is opt-in", async () => {
  const [official, notifications, prefs, worker] = await Promise.all([
    read("components/official-platform-links.tsx"),
    read("lib/notifications.ts"),
    read("components/notification-center.tsx"),
    read("worker/index.ts"),
  ]);
  assert.match(official, /target="_blank"/);
  assert.match(notifications, /dispatchWeeklyReportNotifications/);
  assert.match(prefs, /weekly_report_enabled/);
  assert.match(worker, /dispatchWeeklyReportNotifications/);
});
