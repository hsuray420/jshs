export const GRADES = ["A++", "A+", "A", "B++", "B+", "B", "C"] as const;

export const EXAM_SCORE_MAP = {
  "A++": 6,
  "A+": 6,
  A: 6,
  "B++": 4,
  "B+": 4,
  B: 4,
  C: 2,
} as const;

export const EXAM_POINT_MAP = {
  "A++": 21,
  "A+": 18,
  A: 15,
  "B++": 12,
  "B+": 9,
  B: 6,
  C: 3,
} as const;

export const GRADE_RANK_MAP = {
  "A++": 7,
  "A+": 6,
  A: 5,
  "B++": 4,
  "B+": 3,
  B: 2,
  C: 1,
} as const;

export type AdmissionDistrict = "tp" | "ct" | "tainan" | "kaohsiung" | "taoyuan-lienchiang";
export type ExamGrade = keyof typeof EXAM_SCORE_MAP;
export type EconomicStatus = "NONE" | "LOWER_MIDDLE_INCOME" | "LOW_INCOME";

type ScoreCategory = Readonly<{ key: string; label: string; max: number; description: string }>;
export type AdmissionRule = Readonly<{
  code: AdmissionDistrict;
  label: string;
  academicYear: string;
  totalScore: number;
  sourceNote: string;
  categories: readonly ScoreCategory[];
  tieBreakers: readonly string[];
}>;

const category = (key: string, label: string, max: number, description: string): ScoreCategory => ({ key, label, max, description });

export const ADMISSION_RULES: Record<AdmissionDistrict, AdmissionRule> = {
  tp: {
    code: "tp", label: "基北區", academicYear: "115", totalScore: 108,
    sourceNote: "依提供的 115 學年度基北區規則稿整理；正式招生仍以基北區委員會公告為準。",
    categories: [
      category("preferenceScore", "志願序", 36, "第 1–5 志願 36 分，之後每 5 個志願遞減 1 分，第 21–30 志願為 32 分。"),
      category("multipleLearningScore", "多元學習表現", 36, "均衡學習 24 分，加上服務學習 12 分。"),
      category("examPerformanceScore", "國中教育會考", 36, "五科七級分 35 分，加上寫作測驗 1 分。"),
    ],
    tieBreakers: ["多元學習表現", "國中教育會考表現", "志願序", "五科等級標示", "寫作測驗", "名額 5% 內增額錄取"],
  },
  ct: {
    code: "ct", label: "中投區", academicYear: "115", totalScore: 100,
    sourceNote: "依提供的 115 學年度中投區規則稿整理；正式招生仍以中投區委員會公告為準。",
    categories: [
      category("preferenceScore", "志願序", 30, "每 10 個志願一組：第 1–10 志願 30 分、第 11–20 志願 29 分、第 21 志願起 28 分。"),
      category("nearbyEnrollmentScore", "就近入學", 10, "符合免試就學區或共同就學區者核給 10 分。"),
      category("disadvantagedScore", "扶助弱勢", 3, "偏遠地區 1 分；中低收入戶 1 分；低收入戶 2 分，合計上限 3 分。"),
      category("multipleLearningScore", "多元學習表現", 27, "均衡學習、德行、無記過與獎勵紀錄合計上限 27 分。"),
      category("examPerformanceScore", "國中教育會考", 30, "五科採 A／B／C 三級分，A 6 分、B 4 分、C 2 分。"),
    ],
    tieBreakers: ["志願序", "就近入學", "扶助弱勢", "多元學習表現子項", "會考 111 點", "等級標示與科目順序"],
  },
  tainan: {
    code: "tainan", label: "臺南區", academicYear: "115", totalScore: 108,
    sourceNote: "依提供的 115 學年度臺南區規則稿整理；正式招生仍以臺南區委員會公告為準。",
    categories: [
      category("preferenceScore", "志願序", 12, "第 1 至第 5 序依序 12 至 8 分，第 6 序起每校科 7 分；每序最多 3 校。"),
      category("nearbyEnrollmentScore", "就近入學", 10, "符合臺南區、共同就學區或核准變更就學區者核給 10 分。"),
      category("multipleLearningScore", "多元學習表現", 50, "競賽、獎勵、服務、社團、體適能與語言認證合計上限 50 分。"),
      category("examPerformanceScore", "國中教育會考", 36, "五科七級分 35 分，加上寫作測驗 1 分。"),
    ],
    tieBreakers: ["經濟弱勢", "志願序", "會考總積分", "多元學習表現", "會考總積點與標示"],
  },
  kaohsiung: {
    code: "kaohsiung", label: "高雄區", academicYear: "115", totalScore: 100,
    sourceNote: "依提供的 115 學年度高雄區規則稿整理；正式招生仍以高雄區委員會公告為準。",
    categories: [
      category("preferenceScore", "志願序", 30, "每 10 個志願一組：第 1–10 志願 30 分、第 11–20 志願 29 分、第 21 志願起 28 分。"),
      category("multipleLearningScore", "多元發展項目", 40, "均衡、服務、體適能、證照、競賽、獎勵與幹部任期採計後，以 40 分為上限。"),
      category("examPerformanceScore", "國中教育會考", 30, "五科採 A／B／C 三級分，A 6 分、B 4 分、C 2 分；寫作不列入總分。"),
    ],
    tieBreakers: ["多元發展項目", "志願序", "會考總積分", "會考 35 點", "科目標示與寫作", "弱勢身分"],
  },
  "taoyuan-lienchiang": {
    code: "taoyuan-lienchiang", label: "桃連區", academicYear: "115", totalScore: 100,
    sourceNote: "依提供的 115 學年度桃連區規則稿整理；正式招生仍以桃連區委員會公告為準。",
    categories: [
      category("adaptationScore", "適性輔導", 32, "志願序 15 分、畢業資格 6 分、生涯規劃 6 分、就近入學 5 分。"),
      category("multipleLearningScore", "多元學習表現", 35, "品德、服務、才藝與體適能合計上限 35 分。"),
      category("examPerformanceScore", "國中教育會考", 33, "五科採 A／B／C 三級分 30 分，加上寫作測驗最高 3 分。"),
    ],
    tieBreakers: ["低收入戶", "適性輔導", "多元學習表現", "會考總積分", "志願序", "會考標示"],
  },
};

export type EnrollmentDistrictStatus = string;
export type AdmissionScoreInput = {
  district?: AdmissionDistrict | string;
  choiceList?: Array<{ schoolId: string; departmentId?: string }>;
  enrollmentDistrictStatus?: EnrollmentDistrictStatus;
  remoteAreaEligible?: boolean;
  economicStatus?: EconomicStatus;
  balancedLearning?: { healthAndPE?: boolean; arts?: boolean; integrativeActivities?: boolean; technology?: boolean };
  clubEligibleSemesters?: number;
  serviceHoursBySemester?: number[];
  serviceHoursByYear?: number[];
  serviceHours?: number;
  leadershipSemesters?: number;
  fitnessQualifiedItems?: number;
  fitnessScore?: number;
  fitnessTier?: string;
  fitnessExempt?: boolean;
  certificationScore?: number;
  contestScore?: number;
  languageCertified?: boolean;
  graduationEligible?: boolean;
  careerGoalMatches?: boolean;
  disciplineAfterCancellation?: { warnings?: number; minorDemerits?: number; majorDemerits?: number };
  rewards?: { majorMerits?: number; minorMerits?: number; commendations?: number };
  exam?: { chineseGrade?: ExamGrade; mathGrade?: ExamGrade; englishGrade?: ExamGrade; socialGrade?: ExamGrade; scienceGrade?: ExamGrade; writingLevel?: number; violationPoints?: number };
};

const SUBJECT_KEYS = ["chinese", "math", "english", "social", "science"] as const;

export function isAdmissionDistrict(value: string): value is AdmissionDistrict {
  return Object.prototype.hasOwnProperty.call(ADMISSION_RULES, value);
}

export function getAdmissionRule(district: string | undefined): AdmissionRule {
  const code = district || "ct";
  if (!isAdmissionDistrict(code)) throw new Error(`Unsupported admission district: ${code}`);
  return ADMISSION_RULES[code];
}

export function calculateAdmissionScore(input: AdmissionScoreInput) {
  const rule = getAdmissionRule(input.district);
  const choices = input.choiceList ?? [];
  const assignedChoices = assignPreferenceSequences(choices, rule.code);
  const preferenceSequence = assignedChoices[0]?.preferenceSequence ?? 1;
  const preferenceScore = calculatePreferenceScore(preferenceSequence, rule.code);
  const exam = calculateExam(rule.code, input.exam);
  const otherItems = calculateDistrictItems(rule.code, input, preferenceScore);
  const totalScore = roundToTenth(Math.min(rule.totalScore, otherItems.otherItemsTotal + exam.examPerformanceScore));

  return {
    district: rule.code,
    rule,
    otherItems,
    exam: {
      chinese: input.exam?.chineseGrade ?? "", math: input.exam?.mathGrade ?? "", english: input.exam?.englishGrade ?? "", social: input.exam?.socialGrade ?? "", science: input.exam?.scienceGrade ?? "",
      writingLevel: clamp(input.exam?.writingLevel, 0, 6), violationPoints: clamp(input.exam?.violationPoints, 0, 100), ...exam,
    },
    totalScore,
    storageTenths: Object.fromEntries(Object.entries({ ...otherItems, examPerformanceScore: exam.examPerformanceScore, totalScore }).map(([key, value]) => [key, Math.round(value * 10)])),
    comparisonKeys: { totalScore, ...otherItems, examPerformanceScore: exam.examPerformanceScore, examTotalPoints: exam.examTotalPoints, subjectScores: subjectMap(exam.grades, exam.scoreMap), subjectGradeRanks: subjectMap(exam.grades, GRADE_RANK_MAP), ...calculateGradeMarkerCounts(exam.grades), schoolSequence: preferenceSequence, choiceSequence: 1 },
    perChoiceResults: assignedChoices.map((choice, index) => ({ ...choice, choiceSequence: index + 1, preferenceScore: calculatePreferenceScore(choice.preferenceSequence, rule.code), totalScore: roundToTenth(Math.min(rule.totalScore, otherItems.otherItemsTotal - preferenceScore + calculatePreferenceScore(choice.preferenceSequence, rule.code) + exam.examPerformanceScore)) })),
  };
}

function calculateDistrictItems(district: AdmissionDistrict, input: AdmissionScoreInput, preferenceScore: number) {
  if (district === "tp") {
    const balancedLearningScore = Math.min(24, countBalanced(input.balancedLearning) * 6);
    const serviceLearningScore = Math.min(12, countAtLeast(input.serviceHoursBySemester, 6) * 4);
    const multipleLearningScore = Math.min(36, balancedLearningScore + serviceLearningScore);
    return itemResult({ preferenceScore, balancedLearningScore, serviceLearningScore, multipleLearningScore, otherItemsTotal: preferenceScore + multipleLearningScore });
  }

  if (district === "ct") {
    const nearbyEnrollmentScore = calculateNearbyEnrollmentScore(input.enrollmentDistrictStatus ?? "OTHER");
    const disadvantagedScore = calculateDisadvantagedScore({ remoteAreaEligible: Boolean(input.remoteAreaEligible), economicStatus: input.economicStatus ?? "NONE" });
    const balancedLearningScore = Math.min(12, countBalanced(input.balancedLearning) * 3);
    const conductScore = Math.min(5, Math.min(clamp(input.clubEligibleSemesters, 0, 5), 2) + countAtLeast(input.serviceHoursBySemester, 6));
    const noDemeritScore = calculateNoDemeritScore(input.disciplineAfterCancellation ?? {});
    const rewardScore = calculateRewardScore(input.rewards ?? {});
    const multipleLearningScore = Math.min(27, balancedLearningScore + conductScore + noDemeritScore + rewardScore);
    return itemResult({ preferenceScore, nearbyEnrollmentScore, disadvantagedScore, balancedLearningScore, conductScore, noDemeritScore, rewardScore, multipleLearningScore, otherItemsTotal: preferenceScore + nearbyEnrollmentScore + disadvantagedScore + multipleLearningScore });
  }

  if (district === "tainan") {
    const nearbyEnrollmentScore = isNearby(input.enrollmentDistrictStatus, "TAINAN") ? 10 : 0;
    const contestScore = Math.min(10, nonNegative(input.contestScore));
    const rewardScore = hasDiscipline(input.disciplineAfterCancellation) ? 0 : Math.min(15, 3 + rewardPoints(input.rewards));
    const serviceLearningScore = Math.min(15, nonNegative(input.serviceHours) * 0.3);
    const clubScore = Math.min(15, nonNegative(input.clubEligibleSemesters) * 3);
    const fitnessScore = input.fitnessExempt ? 6 : fitnessTierScore(input.fitnessTier);
    const languageScore = input.languageCertified ? 5 : 0;
    const multipleLearningScore = Math.min(50, contestScore + rewardScore + serviceLearningScore + clubScore + fitnessScore + languageScore);
    return itemResult({ preferenceScore, nearbyEnrollmentScore, contestScore, rewardScore, serviceLearningScore, clubScore, fitnessScore, languageScore, multipleLearningScore, otherItemsTotal: preferenceScore + nearbyEnrollmentScore + multipleLearningScore });
  }

  if (district === "kaohsiung") {
    const balancedLearningScore = balancedLearningKaohsiung(input.balancedLearning);
    const serviceLearningScore = Math.min(16, (input.serviceHoursByYear ?? []).reduce((sum, hours) => sum + Math.min(4, Math.floor(nonNegative(hours) / 3)), 0));
    const fitnessScore = Math.min(20, Math.floor(nonNegative(input.fitnessQualifiedItems) * 3));
    const certificationScore = Math.min(20, nonNegative(input.certificationScore));
    const contestScore = Math.min(20, nonNegative(input.contestScore));
    const rewardScore = Math.min(10, rewardPoints(input.rewards, { major: 4.5, minor: 1.5, commendation: 0.5 }));
    const leadershipScore = Math.min(10, nonNegative(input.leadershipSemesters) * 2);
    const multipleLearningScore = Math.min(40, balancedLearningScore + serviceLearningScore + fitnessScore + certificationScore + contestScore + rewardScore + leadershipScore);
    return itemResult({ preferenceScore, balancedLearningScore, serviceLearningScore, fitnessScore, certificationScore, contestScore, rewardScore, leadershipScore, multipleLearningScore, otherItemsTotal: preferenceScore + multipleLearningScore });
  }

  const graduationScore = input.graduationEligible ? 6 : 0;
  const careerGoalScore = input.careerGoalMatches ? 6 : 0;
  const nearbyEnrollmentScore = isNearby(input.enrollmentDistrictStatus, "TL") ? 5 : 0;
  const conductScore = Math.min(10, Math.min(4, nonNegative(input.leadershipSemesters) * 2) + nonNegative(input.serviceHours) * 0.3);
  const conductBaseScore = hasDiscipline(input.disciplineAfterCancellation) ? 0 : 6;
  const rewardScore = Math.min(10, conductBaseScore + rewardPoints(input.rewards, { major: 4.5, minor: 1.5, commendation: 0.5 }));
  const contestScore = Math.min(10, nonNegative(input.contestScore));
  const fitnessScore = Math.min(6, nonNegative(input.fitnessScore));
  const multipleLearningScore = Math.min(35, rewardScore + conductScore + contestScore + fitnessScore);
  const adaptationScore = Math.min(32, preferenceScore + graduationScore + careerGoalScore + nearbyEnrollmentScore);
  return itemResult({ preferenceScore, graduationScore, careerGoalScore, nearbyEnrollmentScore, rewardScore, conductScore, contestScore, fitnessScore, adaptationScore, multipleLearningScore, otherItemsTotal: adaptationScore + multipleLearningScore });
}

function calculateExam(district: AdmissionDistrict, examInput: AdmissionScoreInput["exam"] = {}) {
  const grades = [examInput.chineseGrade, examInput.mathGrade, examInput.englishGrade, examInput.socialGrade, examInput.scienceGrade];
  const scoreMap = district === "tp" || district === "tainan" ? GRADE_RANK_MAP : EXAM_SCORE_MAP;
  const examAcademicScore = grades.reduce((sum, grade) => sum + (grade ? scoreMap[grade] : 0), 0);
  const writingScore = calculateWritingScore(district, examInput.writingLevel);
  const examMax = ADMISSION_RULES[district].categories.find((item) => item.key === "examPerformanceScore")?.max ?? 0;
  const examPerformanceScore = Math.min(examMax, roundToTenth(examAcademicScore + writingScore));
  const examTotalPoints = calculateTiePoints(district, grades, examInput.writingLevel);
  return { grades, scoreMap, examAcademicScore, writingScore, examPerformanceScore, examTotalPoints };
}

function calculateWritingScore(district: AdmissionDistrict, level: number | undefined) {
  const writing = clamp(level, 0, 6);
  if (district === "tainan" || district === "tp") return [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1][writing] ?? 0;
  if (district === "taoyuan-lienchiang") return writing === 0 ? 0 : writing === 1 ? 1 : writing <= 3 ? 2 : 3;
  return 0;
}

function calculateTiePoints(district: AdmissionDistrict, grades: Array<ExamGrade | undefined>, writingLevel = 0) {
  if (district === "ct") return grades.reduce((sum, grade) => sum + (grade ? EXAM_POINT_MAP[grade] : 0), 0) + clamp(writingLevel, 0, 6);
  if (district === "kaohsiung" || district === "taoyuan-lienchiang") return grades.reduce((sum, grade) => sum + (grade ? GRADE_RANK_MAP[grade] : 0), 0);
  if (district === "tainan") return grades.reduce((sum, grade) => sum + (grade ? GRADE_RANK_MAP[grade] : 0), 0) + calculateWritingScore(district, writingLevel);
  return 0;
}

export function calculatePreferenceScore(preferenceSequence: number, district: AdmissionDistrict = "ct") {
  if (district === "tp") {
    if (preferenceSequence <= 5) return 36;
    if (preferenceSequence <= 10) return 35;
    if (preferenceSequence <= 15) return 34;
    if (preferenceSequence <= 20) return 33;
    return 32;
  }
  if (district === "tainan") return preferenceSequence <= 1 ? 12 : preferenceSequence <= 5 ? 13 - preferenceSequence : 7;
  if (district === "taoyuan-lienchiang") {
    if (preferenceSequence <= 3) return 15;
    if (preferenceSequence <= 6) return 12;
    if (preferenceSequence <= 9) return 9;
    if (preferenceSequence <= 12) return 6;
    if (preferenceSequence <= 15) return 3;
    return 1;
  }
  if (preferenceSequence <= 10) return 30;
  if (preferenceSequence <= 20) return 29;
  return 28;
}

export function assignPreferenceSequences(choices: Array<{ schoolId: string; departmentId?: string }>, district: AdmissionDistrict = "ct") {
  let currentSequence = 0;
  let previousSchoolId: string | null = null;
  let schoolsInTainanGroup = 0;
  return choices.map((choice) => {
    const isNewSchool = choice.schoolId !== previousSchoolId;
    if (district === "tainan") {
      if (isNewSchool) {
        schoolsInTainanGroup += 1;
        if (schoolsInTainanGroup > 3) { currentSequence += 1; schoolsInTainanGroup = 1; }
        if (currentSequence === 0) currentSequence = 1;
      }
    } else if (isNewSchool) currentSequence += 1;
    previousSchoolId = choice.schoolId;
    return { ...choice, preferenceSequence: currentSequence || 1 };
  });
}

export function calculateNearbyEnrollmentScore(status: EnrollmentDistrictStatus) { return isNearby(status, "CT") ? 10 : 0; }

export function calculateDisadvantagedScore(input: { remoteAreaEligible: boolean; economicStatus: EconomicStatus }) {
  let score = input.remoteAreaEligible ? 1 : 0;
  if (input.economicStatus === "LOW_INCOME") score += 2;
  if (input.economicStatus === "LOWER_MIDDLE_INCOME") score += 1;
  return Math.min(score, 3);
}

export function calculateBalancedLearningScore(fields: NonNullable<AdmissionScoreInput["balancedLearning"]>) { return Math.min(12, countBalanced(fields) * 3); }

export function calculateNoDemeritScore(input: NonNullable<AdmissionScoreInput["disciplineAfterCancellation"]>) {
  if ((input.minorDemerits ?? 0) > 0 || (input.majorDemerits ?? 0) > 0 || Math.floor((input.warnings ?? 0) / 3) > 0) return 0;
  return (input.warnings ?? 0) % 3 > 0 ? 3 : 6;
}

export function calculateRewardScore(rewards: NonNullable<AdmissionScoreInput["rewards"]>) { return Math.min(4, rewardPoints(rewards, { major: 3, minor: 1, commendation: 0.5 })); }

export function calculateGradeMarkerCounts(grades: Array<ExamGrade | undefined>) {
  return grades.reduce((counts, grade) => ({ aPlusCount: counts.aPlusCount + (grade === "A++" ? 2 : grade === "A+" ? 1 : 0), bPlusCount: counts.bPlusCount + (grade === "B++" ? 2 : grade === "B+" ? 1 : 0) }), { aPlusCount: 0, bPlusCount: 0 });
}

function itemResult(items: Record<string, number>) { return { ...items, otherItemsTotal: roundToTenth(items.otherItemsTotal ?? 0) }; }
function countBalanced(fields: AdmissionScoreInput["balancedLearning"] = {}) { return [fields?.healthAndPE, fields?.arts, fields?.integrativeActivities, fields?.technology].filter(Boolean).length; }
function balancedLearningKaohsiung(fields: AdmissionScoreInput["balancedLearning"] = {}) { const count = countBalanced(fields); return count >= 3 ? 10 : count === 2 ? 6 : count === 1 ? 3 : 0; }
function subjectMap<T extends Record<string, number>>(grades: Array<ExamGrade | undefined>, map: T) { return SUBJECT_KEYS.reduce<Record<string, number>>((result, key, index) => ({ ...result, [key]: grades[index] ? map[grades[index] as keyof T] : 0 }), {}); }
function rewardPoints(rewards: AdmissionScoreInput["rewards"] = {}, weights = { major: 4.5, minor: 1.5, commendation: 0.5 }) { return nonNegative(rewards?.majorMerits) * weights.major + nonNegative(rewards?.minorMerits) * weights.minor + nonNegative(rewards?.commendations) * weights.commendation; }
function hasDiscipline(discipline: AdmissionScoreInput["disciplineAfterCancellation"]) { return nonNegative(discipline?.warnings) > 0 || nonNegative(discipline?.minorDemerits) > 0 || nonNegative(discipline?.majorDemerits) > 0; }
function countAtLeast(values: number[] | undefined, minimum: number) { return (values ?? []).filter((value) => nonNegative(value) >= minimum).length; }
function fitnessTierScore(tier: string | undefined) { return ({ PR85_TWO_OR_MORE: 10, PR75_TWO_OR_MORE: 9, PR50_TWO_OR_MORE: 8, PR25: 6, BELOW: 4 } as Record<string, number>)[tier ?? ""] ?? 0; }
function isNearby(status: string | undefined, districtPrefix: string) { return String(status ?? "").toUpperCase().startsWith(districtPrefix); }
function nonNegative(value: number | undefined) { return Number.isFinite(value) ? Math.max(0, value as number) : 0; }
function clamp(value: number | undefined, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, Math.trunc(nonNegative(value)))); }
function roundToTenth(value: number) { return Math.round(value * 10) / 10; }
