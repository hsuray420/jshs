import assert from "node:assert/strict";
import test from "node:test";
import { ADMISSION_RULES, getAdmissionChoiceLimit, getAdmissionRule } from "../lib/admission-score.ts";

const INTERNAL = /(preference|multiple|adaptive|nearby|low_income|graduation|morality_service|competition|balanced|service|other|_score|_rank)/i;

test("15 個就學區都有可用中文規則、分數上限與志願上限", () => {
  assert.equal(Object.keys(ADMISSION_RULES).length, 15);
  for (const [code, rule] of Object.entries(ADMISSION_RULES)) {
    assert.match(rule.label, /區$/);
    assert.ok(Number.isFinite(rule.totalScore) && rule.totalScore > 0);
    assert.ok(getAdmissionChoiceLimit(code) > 0);
    assert.ok(rule.categories.every((category) => Number.isFinite(category.max) && category.max >= 0));
    assert.ok(rule.categories.every((category) => !INTERNAL.test(category.label)), `${code} leaked an internal category label`);
    assert.ok(rule.tieBreakers.every((item) => !INTERNAL.test(item)), `${code} leaked an internal tie-breaker`);
  }
});

test("花蓮區不會輸出空白上限或 undefined", () => {
  const rule = getAdmissionRule("hualien");
  assert.ok(rule.categories.every((category) => category.max !== undefined && category.max !== null));
  assert.doesNotMatch(JSON.stringify(rule), /undefined/);
});
