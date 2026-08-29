import test from "node:test";
import assert from "node:assert/strict";
import { analyzePlannerHealth } from "../lib/planner-health.ts";
import { CURRENT_YEAR_CONTEXT, SOURCE_TYPE_LABELS } from "../lib/trust.ts";
import { menuGroups116, primaryNavigation116 } from "../lib/site-map-116.ts";
import { nationalAdmissionSchedule } from "../lib/admission-schedules.ts";

test("116 trust context keeps service and source years separate", () => {
  assert.equal(CURRENT_YEAR_CONTEXT.serviceYear, "116");
  assert.equal(CURRENT_YEAR_CONTEXT.sourceAcademicYear, "115");
  assert.equal(CURRENT_YEAR_CONTEXT.verificationStatus, "awaiting_116_official_release");
  assert.equal(SOURCE_TYPE_LABELS.official_based_calculation, "依官方資料計算");
});

test("116 會考日期使用已公布的五月15、16日，且不冒充免試入學時程", () => {
  assert.deepEqual(nationalAdmissionSchedule.map((item) => item.eventDate), ["2027-05-15", "2027-05-16"]);
  assert.ok(nationalAdmissionSchedule.every((item) => item.status === "confirmed"));
  assert.match(nationalAdmissionSchedule[0].description, /116/);
});

test("計算器缺資料時會顯示缺項數並定位第一個錯誤欄位", async () => {
  const source = await (await import("node:fs/promises")).readFile(new URL("../components/admission-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /尚缺 \{invalidExamKeys\.length \+/);
  assert.match(source, /data-admission-error/);
  assert.match(source, /querySelector<HTMLElement>\("\[data-admission-error='true'\]"\)/);
});

test("計算器草稿與清除入口具備重新整理後的資料契約", async () => {
  const source = await (await import("node:fs/promises")).readFile(new URL("../components/admission-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /jshs_admission_calculator_draft_v1/);
  assert.match(source, /localStorage\.removeItem\(CALCULATOR_DRAFT_KEY\)/);
  assert.match(source, /清除試算資料/);
});

test("desktop IA exposes exactly seven primary groups", () => {
  assert.deepEqual(primaryNavigation116.map((item) => item.label), ["找學校", "算成績", "我的志願", "升學日程", "官方資訊", "升學指南", "資料與信任"]);
  assert.equal(menuGroups116.some((group) => group.label === "更多"), false);
});

test("planner health returns structured checks instead of a prose-only result", () => {
  const result = analyzePlannerHealth({
    serviceYear: "116",
    items: [
      { id: "a", schoolCode: "A", tier: "challenge", hasQuota: false, qualificationStatus: "unknown", commuteMinutes: 95 },
      { id: "a-duplicate", schoolCode: "A", tier: "challenge", hasQuota: true, qualificationStatus: "pass", commuteMinutes: 95 },
    ],
  });
  assert.ok(result.some((check) => check.id === "distribution" && check.status === "warning"));
  assert.ok(result.some((check) => check.id === "duplicates" && check.status === "error"));
  assert.ok(result.some((check) => check.id === "data" && check.status === "warning"));
  assert.ok(result.every((check) => check.actionLabel && check.actionHref));
});
