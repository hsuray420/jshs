import assert from "node:assert/strict";
import test from "node:test";

import { calculateAdmissionScore, assignPreferenceSequences } from "../lib/admission-score.ts";

const perfectExam = {
  chineseGrade: "A++",
  mathGrade: "A++",
  englishGrade: "A++",
  socialGrade: "A++",
  scienceGrade: "A++",
  writingLevel: 6,
};

function choices(count, prefix = "school") {
  return Array.from({ length: count }, (_, index) => ({ schoolId: `${prefix}-${index + 1}` }));
}

test("五區滿分案例都遵守各區總分上限", () => {
  const cases = [
    ["tp", {
      choiceList: choices(1),
      balancedLearning: { healthAndPE: true, arts: true, integrativeActivities: true, technology: true },
      serviceHoursBySemester: [6, 6, 6],
      exam: perfectExam,
    }, 108],
    ["ct", {
      choiceList: choices(1),
      enrollmentDistrictStatus: "CT_MAIN_DISTRICT",
      remoteAreaEligible: true,
      economicStatus: "LOW_INCOME",
      balancedLearning: { healthAndPE: true, arts: true, integrativeActivities: true, technology: true },
      clubEligibleSemesters: 2,
      serviceHoursBySemester: [6, 6, 6],
      disciplineAfterCancellation: {},
      rewards: { majorMerits: 1, minorMerits: 1, commendations: 1 },
      exam: perfectExam,
    }, 100],
    ["tainan", {
      choiceList: choices(3),
      enrollmentDistrictStatus: "TAINAN_MAIN_DISTRICT",
      contestScore: 10,
      rewards: { majorMerits: 4, minorMerits: 1, commendations: 2 },
      serviceHours: 50,
      clubEligibleSemesters: 5,
      fitnessTier: "PR85_TWO_OR_MORE",
      languageCertified: true,
      exam: perfectExam,
    }, 108],
    ["kaohsiung", {
      choiceList: choices(1),
      balancedLearning: { healthAndPE: true, arts: true, integrativeActivities: true },
      serviceHoursByYear: [12, 12, 12],
      fitnessQualifiedItems: 7,
      certificationScore: 20,
      contestScore: 20,
      rewards: { majorMerits: 3, minorMerits: 3, commendations: 2 },
      leadershipSemesters: 5,
      exam: perfectExam,
    }, 100],
    ["taoyuan-lienchiang", {
      choiceList: choices(1),
      graduationEligible: true,
      careerGoalMatches: true,
      enrollmentDistrictStatus: "TL_MAIN_DISTRICT",
      leadershipSemesters: 2,
      serviceHours: 30,
      contestScore: 10,
      fitnessScore: 6,
      disciplineAfterCancellation: {},
      rewards: { majorMerits: 2, minorMerits: 1, commendations: 1 },
      exam: perfectExam,
    }, 100],
  ];

  for (const [district, input, expected] of cases) {
    const result = calculateAdmissionScore({ district, ...input });
    assert.equal(result.totalScore, expected, district);
    assert.equal(result.rule.totalScore, expected, `${district} rule metadata`);
  }
});

test("各區會考折算與作文規則分開呈現", () => {
  const grades = { chineseGrade: "A++", mathGrade: "A+", englishGrade: "A", socialGrade: "B+", scienceGrade: "C" };
  assert.equal(calculateAdmissionScore({ district: "tp", exam: { ...grades, writingLevel: 5 } }).exam.examPerformanceScore, 22);
  assert.equal(calculateAdmissionScore({ district: "tp", exam: { ...grades, writingLevel: 5 } }).exam.writingScore, 0.8);
  assert.equal(calculateAdmissionScore({ district: "ct", exam: { ...grades, writingLevel: 6 } }).exam.examPerformanceScore, 22);
  assert.equal(calculateAdmissionScore({ district: "tainan", exam: { ...grades, writingLevel: 5 } }).exam.writingScore, 0.8);
  assert.equal(calculateAdmissionScore({ district: "taoyuan-lienchiang", exam: { ...grades, writingLevel: 4 } }).exam.writingScore, 3);
});

test("志願序會依各區規則分群，且同校連續科別不重複扣分", () => {
  const repeated = [
    { schoolId: "A", departmentId: "1" },
    { schoolId: "A", departmentId: "2" },
    { schoolId: "B", departmentId: "1" },
    { schoolId: "C", departmentId: "1" },
    { schoolId: "D", departmentId: "1" },
  ];
  assert.deepEqual(assignPreferenceSequences(repeated, "ct").map((choice) => choice.preferenceSequence), [1, 1, 2, 3, 4]);
  assert.deepEqual(assignPreferenceSequences(repeated, "tainan").map((choice) => choice.preferenceSequence), [1, 1, 1, 1, 2]);
  assert.equal(calculateAdmissionScore({ district: "ct", choiceList: choices(11) }).otherItems.preferenceScore, 29);
  assert.equal(calculateAdmissionScore({ district: "tainan", choiceList: choices(4) }).otherItems.preferenceScore, 11);
  assert.equal(calculateAdmissionScore({ district: "tp", choiceList: choices(21) }).otherItems.preferenceScore, 32);
});

test("特殊身分與資料不足不會讓分數超出上限", () => {
  const tainan = calculateAdmissionScore({ district: "tainan", fitnessExempt: true, exam: { writingLevel: 99 } });
  assert.equal(tainan.otherItems.fitnessScore, 6);
  assert.equal(tainan.exam.writingScore, 1);
  assert.ok(tainan.totalScore <= 108);

  assert.throws(() => calculateAdmissionScore({ district: "unknown" }), /Unsupported admission district/);
});
