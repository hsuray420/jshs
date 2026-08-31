import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("志願探索以偏好篩選，而不再產生錄取分層", async () => {
  const source = await readFile(new URL("../components/planner-mode-workspace.tsx", import.meta.url), "utf8");

  for (const label of ["公私立偏好", "群科興趣", "通勤偏好", "位於你的就學區"]) assert.match(source, new RegExp(label));
  assert.doesNotMatch(source, /buildPlannerRecommendations/);
  assert.doesNotMatch(source, /錄取機率/);
});

test("自選排序會把順序保存到 planner state", async () => {
  const source = await readFile(new URL("../components/planner-mode-workspace.tsx", import.meta.url), "utf8");

  assert.match(source, /fetch\("\/api\/planner\/state"/);
  assert.match(source, /order\?: string\[\]/);
  assert.match(source, /saveState\(/);
});
