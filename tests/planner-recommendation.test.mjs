import test from "node:test";
import assert from "node:assert/strict";
import { buildPlannerRecommendations } from "../lib/planner-recommendation.ts";

const schools = Array.from({ length: 30 }, (_, index) => ({
  code: `S${index + 1}`,
  name: `學校${index + 1}`,
  referenceScore: String(70 + index),
}));

test("把候選校科分成挑戰、穩定、保底三組，每組八所", () => {
  const result = buildPlannerRecommendations(schools, 80);

  assert.equal(result.challenge.length, 8);
  assert.equal(result.stable.length, 8);
  assert.equal(result.safe.length, 8);
  assert.equal(new Set(Object.values(result).flat().map((school) => school.code)).size, 24);
});

test("沒有參考分數的學校不會被當成精準落點建議", () => {
  const result = buildPlannerRecommendations([
    { code: "A", name: "甲校", referenceScore: "" },
    { code: "B", name: "乙校", referenceScore: "90" },
  ], 80);

  assert.equal(result.challenge[0]?.code, "B");
  assert.equal(result.stable.length, 0);
  assert.equal(result.safe.length, 0);
});
