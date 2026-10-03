import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("mock exam is a real local/member CRUD workflow", async () => {
  const workspace = await source("components/mock-exam-workspace.tsx");
  const route = await source("app/api/mock-exams/route.ts");
  assert.match(workspace, /編輯模擬考/);
  assert.match(workspace, /查看詳情/);
  assert.match(workspace, /保存失敗/);
  assert.match(workspace, /api\/mock-exams/);
  assert.match(route, /validateRecord/);
  assert.match(route, /all === true/);
  assert.match(route, /invalid_subject_score/);
});

test("formal score history and planner versions expose explainable comparisons", async () => {
  const scores = await source("components/score-workspaces.tsx");
  const planner = await source("components/planner-versions.tsx");
  assert.match(scores, /勾選兩次試算/);
  assert.match(scores, /ScoreComparison/);
  assert.match(scores, /不代表錄取機率或排名/);
  assert.match(planner, /moved/);
  assert.match(planner, /順序移動/);
});

test("schedule metadata stays source-traceable from admin to public timeline", async () => {
  const store = await source("db/notification-store.ts");
  const admin = await source("app/admin/notifications/page.tsx");
  const api = await source("app/api/schedule/route.ts");
  const workspace = await source("components/schedule-workspace.tsx");
  for (const field of ["academic_year", "district", "status", "source_url", "verified_at", "version"]) {
    assert.match(store, new RegExp(field));
    assert.match(admin, new RegExp(field));
  }
  assert.match(api, /academicYear/);
  assert.match(api, /verifiedAt/);
  assert.match(workspace, /academicYear/);
});

test("IA keeps mock exams separate from formal score analysis", async () => {
  const home = await source("components/home-next-step.tsx");
  const mock = await source("app/scores/mock/page.tsx");
  assert.doesNotMatch(home, /模擬考與免試積分入口/);
  assert.match(home, /正式會考與免試入學積分/);
  assert.match(mock, /建立、編輯與保存/);
  assert.match(mock, /不捏造答案、排名或錄取預測/);
});
