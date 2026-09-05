import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("planner data requires a verified LINE member session", async () => {
  const [plannerRoute, stateRoute, plannerStore] = await Promise.all([
    readSource("app/api/planner/route.ts"),
    readSource("app/api/planner/state/route.ts"),
    readSource("db/planner-store.ts"),
  ]);

  for (const source of [plannerRoute, stateRoute]) {
    assert.match(source, /getMemberSession/);
    assert.match(source, /member_required/);
    assert.match(source, /status: 401/);
  }
  assert.match(plannerStore, /member_planners/);
  assert.match(plannerStore, /line_user_id/);
  assert.match(plannerStore, /getOrCreateMemberPlanner/);
  assert.doesNotMatch(plannerRoute, /plannerIdentity\(request\)/);
  assert.doesNotMatch(stateRoute, /plannerIdentity\(request\)/);
});

test("planning remains local while national search stays a read-only discovery surface", async () => {
  const [schoolExplorer, decisionActions, plannerWorkspace, localStore] = await Promise.all([
    readSource("components/school-explorer.tsx"),
    readSource("components/school-decision-actions.tsx"),
    readSource("components/planner-mode-workspace.tsx"),
    readSource("lib/planner-local.ts"),
  ]);

  assert.doesNotMatch(schoolExplorer, /\/api\/planner/);
  assert.match(schoolExplorer, /\/schools\/compare/);
  assert.match(decisionActions, /writeLocalPlanner/);
  assert.match(plannerWorkspace, /writeLocalPlanner/);
  assert.match(plannerWorkspace, /if \(!isMember\)/);
  assert.match(localStore, /localStorage/);
});
