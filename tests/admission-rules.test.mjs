import assert from "node:assert/strict";
import test from "node:test";

import { CHANGHUA_COMPETITION_CATALOG, calculateAdmissionScore, assignPreferenceSequences, isAdmissionCalculatorAvailable } from "../lib/admission-score.ts";

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

test("只有有研究 MD/JSON 的區域開放積分試算", () => {
  for (const district of ["tp", "ct", "ilan", "taoyuan-lienchiang", "hsinchu-miaoli", "changhua", "yunlin", "kaohsiung"]) assert.equal(isAdmissionCalculatorAvailable(district), true);
  for (const district of ["chiayi", "tainan", "pingtung", "hualien", "taitung", "penghu", "kinmen"]) assert.equal(isAdmissionCalculatorAvailable(district), false);
});

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
  assert.equal(calculateAdmissionScore({ district: "tp", exam: { ...grades, writingLevel: 5 } }).exam.examPerformanceScore, 22.8);
  assert.equal(calculateAdmissionScore({ district: "tp", exam: { ...grades, writingLevel: 5 } }).exam.writingScore, 0.8);
  assert.equal(calculateAdmissionScore({ district: "ct", exam: { ...grades, writingLevel: 6 } }).exam.examPerformanceScore, 24);
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
  assert.equal(calculateAdmissionScore({ district: "ct", choiceList: choices(11) }).perChoiceResults[10].preferenceScore, 29);
  assert.equal(calculateAdmissionScore({ district: "tainan", choiceList: choices(4) }).perChoiceResults[3].preferenceScore, 11);
  assert.equal(calculateAdmissionScore({ district: "tp", choiceList: choices(21) }).perChoiceResults[20].preferenceScore, 32);
});

test("特殊身分與資料不足不會讓分數超出上限", () => {
  const tainan = calculateAdmissionScore({ district: "tainan", fitnessExempt: true, exam: { writingLevel: 99 } });
  assert.equal(tainan.otherItems.fitnessScore, 6);
  assert.equal(tainan.exam.writingScore, 1);
  assert.ok(tainan.totalScore <= 108);

  assert.throws(() => calculateAdmissionScore({ district: "unknown" }), /Unsupported admission district/);
});

test("15 個就學區都能完成一次透明的成績試算", () => {
  const districts = ["tp", "ct", "ilan", "taoyuan-lienchiang", "hsinchu-miaoli", "changhua", "yunlin", "chiayi", "tainan", "kaohsiung", "pingtung", "hualien", "taitung", "penghu", "kinmen"];
  for (const district of districts) {
    const result = calculateAdmissionScore({ district, manualCategoryScores: { preferenceScore: 10, multipleLearningScore: 20, examPerformanceScore: 15 }, exam: { writingLevel: 3 } });
    assert.equal(result.district, district);
    assert.ok(result.totalScore >= 0 && result.totalScore <= result.rule.totalScore, district);
  }
});

test("中投與彰化的規則 metadata 直接來自研究 JSON", () => {
  const ct = calculateAdmissionScore({ district: "ct" });
  const chc = calculateAdmissionScore({ district: "changhua" });
  assert.equal(ct.rule.sourceId, "ct-115-research-json");
  assert.equal(chc.rule.sourceId, "changhua-115-research-json");
  assert.equal(ct.rule.totalScore, 100);
  assert.equal(chc.rule.totalScore, 135);
  assert.equal(ct.rule.fields.some((field) => field.field_id === "service_hours_by_semester"), true);
  assert.equal(chc.rule.fields.some((field) => field.field_id === "competition_results"), true);
});

test("基北、桃連、高雄使用各自的 115 研究 JSON 與欄位 schema", () => {
  for (const [district, sourceId, fieldId] of [["tp", "tp-115-research-json", "service_hours_112_s1"], ["taoyuan-lienchiang", "taoyuan-lienchiang-115-research-json", "graduation_status"], ["kaohsiung", "kaohsiung-115-research-json", "credential_results"]]) {
    const result = calculateAdmissionScore({ district, ruleValues: {}, exam: {} });
    assert.equal(result.rule.sourceId, sourceId);
    assert.equal(result.rule.academicYear, "115");
    assert.equal(result.rule.fields.some((field) => field.field_id === fieldId), true);
    assert.match(result.rule.verificationStatus, /verified/);
  }
});

test("宜蘭、竹苗、雲林使用暫存研究 JSON 進行實際計分", () => {
  const fullExam = { chineseGrade: "A++", englishGrade: "A+", mathGrade: "A", socialGrade: "B++", scienceGrade: "B+", writingLevel: 6 };
  const iln = calculateAdmissionScore({ district: "ilan", ruleValues: {
    graduation_qualification: true, balanced_health_pe: true, balanced_arts: true, balanced_integrated: true, balanced_technology: true,
    discipline_status: "no_warning_or_above", class_cadre_semesters: 3, club_cadre_semesters: 2, volunteer_semesters: 3,
    competition_achievements: [], fitness_flexibility_qualified: true, fitness_muscular_endurance_qualified: true, fitness_explosive_power_qualified: true, fitness_cardiorespiratory_qualified: true,
    fitness_medal: "gold", adaptive_student_choice_match: true, adaptive_parent_suggestion_match: true, adaptive_guidance_suggestion_match: true, economic_tiebreak_status: "none",
    chinese_exam_grade: fullExam.chineseGrade, english_exam_grade: fullExam.englishGrade, math_exam_grade: fullExam.mathGrade, social_exam_grade: fullExam.socialGrade, science_exam_grade: fullExam.scienceGrade, writing_grade: 6, exam_violation_points: 0,
  }});
  assert.equal(iln.totalScore, 46);
  assert.equal(iln.status, "complete");

  const hhm = calculateAdmissionScore({ district: "hsinchu-miaoli", ruleValues: {
    disadvantaged_qualifications: ["remote_school"], nearby_eligibility: true, preference_rank: 1,
    balanced_health_pe: true, balanced_arts: true, balanced_integrated: true, balanced_technology: true, discipline_clear: true, no_truancy_semesters: 6,
    major_merit_count: 1, minor_merit_count: 1, commendation_count: 1, service_hours_grade7_first: 6, service_hours_grade7_second: 6, service_hours_grade8_first: 6, service_hours_grade8_second: 6, service_hours_grade9_first: 6, local_language_certificate: "none",
    chinese_exam_grade: fullExam.chineseGrade, english_exam_grade: fullExam.englishGrade, math_exam_grade: fullExam.mathGrade, social_exam_grade: fullExam.socialGrade, science_exam_grade: fullExam.scienceGrade, writing_grade: 6, exam_violation_points: 0,
  }});
  assert.equal(hhm.totalScore, 94.5);

  const ylc = calculateAdmissionScore({ district: "yunlin", ruleValues: {
    economic_status: "low_income", nearby_eligibility: true, preference_rank: 1, no_truancy_semesters: 5, discipline_status: "no_warning_or_above", balanced_qualified_domain_count: 3, remote_school_class_band: "seven_or_less", major_merit_count: 3, minor_merit_count: 2, commendation_count: 2, competition_achievements: ["national_1"], fitness_qualified_item_count: 2,
    chinese_exam_grade: fullExam.chineseGrade, english_exam_grade: fullExam.englishGrade, math_exam_grade: fullExam.mathGrade, social_exam_grade: fullExam.socialGrade, science_exam_grade: fullExam.scienceGrade, writing_grade: 6, exam_violation_points: 0,
  }});
  assert.equal(ylc.totalScore, 86);
});

test("研究 JSON 的必填欄位缺漏時回傳 incomplete，不把缺漏當成零分", () => {
  const result = calculateAdmissionScore({ district: "ct", exam: { writingLevel: 6 } });
  assert.equal(result.status, "incomplete");
  assert.equal(result.totalScore, null);
  assert.ok(result.missingFields.includes("chinese_exam_grade"));
  assert.ok(result.missingFields.includes("service_hours_by_semester"));
});

test("彰化競賽只能採計官方 catalog，體適能只取同次檢測最佳三項", () => {
  assert.equal(CHANGHUA_COMPETITION_CATALOG.length, 159);
  const result = calculateAdmissionScore({ district: "changhua", ruleValues: {
    preference_choices: [{ schoolId: "s" }], economic_weakness_status: "low_income", nearby_eligibility: "approved_common", cadre_semesters: 4, service_hours: 20,
    major_merit_count: 2, minor_merit_count: 1, commendation_count: 1, no_discipline_record: true, no_truancy_record: true,
    balanced_passing_domain_count_by_semester: { g7_s1: 3, g7_s2: 3, g8_s1: 3, g8_s2: 3, g9_s1: 3 }, excellent_club_semesters: ["g7_s1", "g7_s2", "g8_s1", "g8_s2"],
    competition_results: [{ catalog_id: "national-01", level: "national", rank: "first", participant_count: 3, result_date: "2026-04-01", proof_submission_date: "2026-04-20" }],
    fitness_session_results: { test_date: "2026-03-01", flexibility: "bronze_or_above", muscular_endurance: "medium_or_needs_improvement", explosive_power: "bronze_or_above", cardiorespiratory: "no_score" },
    chinese_exam_grade: "A++", math_exam_grade: "A++", english_exam_grade: "A++", social_exam_grade: "A++", science_exam_grade: "A++", writing_grade: 6, exam_disposition: "normal", exam_violation_points: 0,
  } });
  assert.equal(result.status, "complete");
  assert.equal(result.otherItems.competition_score, 5);
  assert.equal(result.otherItems.fitness_score, 5);
  assert.equal(result.totalScore, 135);
});
