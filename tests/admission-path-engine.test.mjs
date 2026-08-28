import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAdmissionEligibility } from "../lib/admission-path-engine.ts";

const base = {
  academicYear: "115",
  zone: "ct",
  studentType: "current_graduate",
  schoolCounty: "臺中市",
  schoolCode: "",
  identities: [],
  specialNeeds: [],
  answers: {},
};

test("一般應屆生同區就學會得到可追溯的符合結果", () => {
  const result = evaluateAdmissionEligibility(base);
  const general = result.routes.find((route) => route.routeId === "general-no-exam");
  assert.equal(general?.status, "eligible");
  assert.match(general?.reasons.join(" ") || "", /應屆/);
  assert.equal(general?.ruleIds.includes("general-admission-115"), true);
  assert.equal(general?.officialSources[0]?.officialSourcePage, "資格審查／報名資格");
});

test("跨區需求會出現條件式問題尚未完成的確認結果", () => {
  const result = evaluateAdmissionEligibility({ ...base, specialNeeds: ["cross_zone"], answers: { crossZoneReason: "move" } });
  const crossZone = result.routes.find((route) => route.routeId === "cross-zone");
  assert.equal(crossZone?.status, "needs_confirmation");
  assert.match(crossZone?.missingInformation.join(" ") || "", /目標學校/);
  assert.equal(crossZone?.requiredDocuments.length > 0, true);
});

test("非應屆與轉學生不會被誤判為一般符合", () => {
  const result = evaluateAdmissionEligibility({ ...base, studentType: "transfer_student" });
  const general = result.routes.find((route) => route.routeId === "general-no-exam");
  const nonGraduate = result.routes.find((route) => route.routeId === "non-graduate");
  assert.equal(general?.status, "needs_confirmation");
  assert.equal(nonGraduate?.status, "needs_confirmation");
});

test("已有該區身分規則的特殊身分會顯示可能符合並附文件", () => {
  const result = evaluateAdmissionEligibility({ ...base, identities: ["indigenous"] });
  const identity = result.routes.find((route) => route.routeId === "special-identity");
  assert.equal(identity?.status, "possibly_eligible");
  assert.match(identity?.reasons.join(" ") || "", /外加名額|升學優待/);
  assert.equal(identity?.requiredDocuments.includes("身分證明或主管機關核發證明"), true);
});

test("缺少學年度或就學區時回傳友善錯誤，不產生假判定", () => {
  const result = evaluateAdmissionEligibility({ ...base, academicYear: "", zone: "" });
  assert.equal(result.error?.code, "missing_context");
  assert.equal(result.routes.length, 0);
});

test("特色招生需求會產生獨立的待確認路徑", () => {
  const result = evaluateAdmissionEligibility({ ...base, specialNeeds: ["special_admission"] });
  const route = result.routes.find((item) => item.routeId === "special-admission");
  assert.equal(route?.status, "needs_confirmation");
  assert.match(route?.nextSteps.join(" ") || "", /招生學校/);
});

test("明確不具完全中學條件時，直升路徑會回傳目前不符合", () => {
  const result = evaluateAdmissionEligibility({ ...base, specialNeeds: ["direct_selection"], answers: { directSchoolType: "no" } });
  const route = result.routes.find((item) => item.routeId === "direct-selection");
  assert.equal(route?.status, "ineligible");
  assert.match(route?.reasons.join(" ") || "", /不適用/);
});
