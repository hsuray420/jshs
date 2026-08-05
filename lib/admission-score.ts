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

export const LIMITS_TENTHS = {
  preferenceScore: 300,
  nearbyEnrollmentScore: 100,
  disadvantagedScore: 30,
  balancedLearningScore: 120,
  conductScore: 50,
  noDemeritScore: 60,
  rewardScore: 40,
  multipleLearningScore: 270,
  examPerformanceScore: 300,
  otherItemsTotal: 700,
  totalScore: 1000,
} as const;

export type ExamGrade = keyof typeof EXAM_SCORE_MAP;
export type EconomicStatus = "NONE" | "LOWER_MIDDLE_INCOME" | "LOW_INCOME";
export type EnrollmentDistrictStatus = "CT_MAIN_DISTRICT" | "CT_SHARED_DISTRICT" | "OTHER";

export type AdmissionScoreInput = {
  choiceList?: Array<{ schoolId: string; departmentId?: string }>;
  enrollmentDistrictStatus?: EnrollmentDistrictStatus;
  remoteAreaEligible?: boolean;
  economicStatus?: EconomicStatus;
  balancedLearning?: {
    healthAndPE?: boolean;
    arts?: boolean;
    integrativeActivities?: boolean;
    technology?: boolean;
  };
  clubEligibleSemesters?: number;
  serviceHoursBySemester?: number[];
  disciplineAfterCancellation?: {
    warnings?: number;
    minorDemerits?: number;
    majorDemerits?: number;
  };
  rewards?: {
    majorMerits?: number;
    minorMerits?: number;
    commendations?: number;
  };
  exam?: {
    chineseGrade?: ExamGrade;
    mathGrade?: ExamGrade;
    englishGrade?: ExamGrade;
    socialGrade?: ExamGrade;
    scienceGrade?: ExamGrade;
    writingLevel?: number;
    violationPoints?: number;
  };
};

const SUBJECT_KEYS = ["chinese", "math", "english", "social", "science"] as const;

export function calculateAdmissionScore(input: AdmissionScoreInput) {
  const subjectGrades = [
    input.exam?.chineseGrade,
    input.exam?.mathGrade,
    input.exam?.englishGrade,
    input.exam?.socialGrade,
    input.exam?.scienceGrade,
  ];
  const preferenceSequence = assignPreferenceSequences(input.choiceList ?? [])[0]?.preferenceSequence ?? 1;
  const preferenceScore = toTenths(calculatePreferenceScore(preferenceSequence));
  const nearbyEnrollmentScore = toTenths(calculateNearbyEnrollmentScore(input.enrollmentDistrictStatus ?? "OTHER"));
  const disadvantagedScore = toTenths(calculateDisadvantagedScore({
    remoteAreaEligible: Boolean(input.remoteAreaEligible),
    economicStatus: input.economicStatus ?? "NONE",
  }));
  const balancedLearningScore = toTenths(calculateBalancedLearningScore(input.balancedLearning ?? {}));
  const conductScore = toTenths(
    calculateClubScore(input.clubEligibleSemesters ?? 0) +
      calculateServiceScore(input.serviceHoursBySemester ?? []),
  );
  const noDemeritScore = toTenths(calculateNoDemeritScore({
    warningCountAfterCancellation: input.disciplineAfterCancellation?.warnings ?? 0,
    minorDemeritCountAfterCancellation: input.disciplineAfterCancellation?.minorDemerits ?? 0,
    majorDemeritCountAfterCancellation: input.disciplineAfterCancellation?.majorDemerits ?? 0,
  }));
  const rewardScore = toTenths(calculateRewardScore(input.rewards ?? {}));
  const examPerformanceScore = toTenths(calculateExamPerformance(
    subjectGrades,
    input.exam?.violationPoints ?? 0,
  ));
  const examTotalPoints = calculateExamTotalPoints(subjectGrades, input.exam?.writingLevel ?? 0);
  const multipleLearningScore = clampTenths(
    balancedLearningScore + conductScore + noDemeritScore + rewardScore,
    LIMITS_TENTHS.multipleLearningScore,
  );
  const otherItemsTotal = clampTenths(
    preferenceScore + nearbyEnrollmentScore + disadvantagedScore + multipleLearningScore,
    LIMITS_TENTHS.otherItemsTotal,
  );
  const totalScore = clampTenths(otherItemsTotal + examPerformanceScore, LIMITS_TENTHS.totalScore);
  const markerCounts = calculateGradeMarkerCounts(subjectGrades);

  return {
    otherItems: fromTenthsObject({
      preferenceScore,
      nearbyEnrollmentScore,
      disadvantagedScore,
      balancedLearningScore,
      conductScore,
      noDemeritScore,
      rewardScore,
      multipleLearningScore,
      otherItemsTotal,
    }),
    exam: {
      chinese: input.exam?.chineseGrade ?? "",
      math: input.exam?.mathGrade ?? "",
      english: input.exam?.englishGrade ?? "",
      social: input.exam?.socialGrade ?? "",
      science: input.exam?.scienceGrade ?? "",
      writingLevel: input.exam?.writingLevel ?? 0,
      violationPoints: input.exam?.violationPoints ?? 0,
      examPerformanceScore: fromTenths(examPerformanceScore),
      examTotalPoints,
    },
    totalScore: fromTenths(totalScore),
    storageTenths: {
      preferenceScore,
      nearbyEnrollmentScore,
      disadvantagedScore,
      balancedLearningScore,
      conductScore,
      noDemeritScore,
      rewardScore,
      multipleLearningScore,
      otherItemsTotal,
      examPerformanceScore,
      totalScore,
    },
    comparisonKeys: {
      totalScore: fromTenths(totalScore),
      preferenceScore: fromTenths(preferenceScore),
      nearbyEnrollmentScore: fromTenths(nearbyEnrollmentScore),
      disadvantagedScore: fromTenths(disadvantagedScore),
      multipleLearningScore: fromTenths(multipleLearningScore),
      balancedLearningScore: fromTenths(balancedLearningScore),
      conductScore: fromTenths(conductScore),
      noDemeritScore: fromTenths(noDemeritScore),
      rewardScore: fromTenths(rewardScore),
      examPerformanceScore: fromTenths(examPerformanceScore),
      examTotalPoints,
      ...markerCounts,
      subjectScores: subjectMap(subjectGrades, EXAM_SCORE_MAP),
      subjectGradeRanks: subjectMap(subjectGrades, GRADE_RANK_MAP),
      schoolSequence: preferenceSequence,
      choiceSequence: 1,
    },
    perChoiceResults: assignPreferenceSequences(input.choiceList ?? []).map((choice, index) => ({
      ...choice,
      choiceSequence: index + 1,
      preferenceScore: calculatePreferenceScore(choice.preferenceSequence),
      totalScore: fromTenths(
        clampTenths(
          otherItemsTotal - preferenceScore + toTenths(calculatePreferenceScore(choice.preferenceSequence)) + examPerformanceScore,
          LIMITS_TENTHS.totalScore,
        ),
      ),
    })),
  };
}

export function calculatePreferenceScore(preferenceSequence: number) {
  if (preferenceSequence >= 1 && preferenceSequence <= 10) return 30;
  if (preferenceSequence >= 11 && preferenceSequence <= 20) return 29;
  if (preferenceSequence >= 21) return 28;
  return 0;
}

export function assignPreferenceSequences(choices: Array<{ schoolId: string; departmentId?: string }>) {
  let currentSequence = 0;
  let previousSchoolId: string | null = null;
  return choices.map((choice) => {
    if (choice.schoolId !== previousSchoolId) currentSequence += 1;
    previousSchoolId = choice.schoolId;
    return { ...choice, preferenceSequence: currentSequence };
  });
}

export function calculateNearbyEnrollmentScore(status: EnrollmentDistrictStatus) {
  return status === "CT_MAIN_DISTRICT" || status === "CT_SHARED_DISTRICT" ? 10 : 0;
}

export function calculateDisadvantagedScore(input: { remoteAreaEligible: boolean; economicStatus: EconomicStatus }) {
  let score = input.remoteAreaEligible ? 1 : 0;
  if (input.economicStatus === "LOW_INCOME") score += 2;
  if (input.economicStatus === "LOWER_MIDDLE_INCOME") score += 1;
  return Math.min(score, 3);
}

export function calculateBalancedLearningScore(fields: NonNullable<AdmissionScoreInput["balancedLearning"]>) {
  return [
    fields.healthAndPE,
    fields.arts,
    fields.integrativeActivities,
    fields.technology,
  ].filter(Boolean).length * 3;
}

export function calculateClubScore(eligibleSemesters: number) {
  return Math.min(Math.max(eligibleSemesters, 0), 2);
}

export function calculateServiceScore(hoursBySemester: number[]) {
  return Math.min(hoursBySemester.filter((hours) => hours >= 6).length, 3);
}

export function calculateNoDemeritScore(input: {
  warningCountAfterCancellation: number;
  minorDemeritCountAfterCancellation: number;
  majorDemeritCountAfterCancellation: number;
}) {
  const convertedMinorDemerits =
    input.minorDemeritCountAfterCancellation +
    input.majorDemeritCountAfterCancellation * 3 +
    Math.floor(input.warningCountAfterCancellation / 3);
  if (convertedMinorDemerits > 0) return 0;
  return input.warningCountAfterCancellation % 3 > 0 ? 3 : 6;
}

export function calculateRewardScore(rewards: NonNullable<AdmissionScoreInput["rewards"]>) {
  return Math.min(
    (rewards.majorMerits ?? 0) * 3 +
      (rewards.minorMerits ?? 0) +
      (rewards.commendations ?? 0) * 0.5,
    4,
  );
}

export function calculateExamPerformance(grades: Array<ExamGrade | undefined>, violationPoints = 0) {
  const rawScore = grades.reduce((sum, grade) => sum + (grade ? EXAM_SCORE_MAP[grade] : 0), 0);
  return Math.max(0, Math.round((rawScore - violationPoints * 0.3) * 10) / 10);
}

export function calculateExamTotalPoints(grades: Array<ExamGrade | undefined>, writingLevel = 0) {
  return grades.reduce((sum, grade) => sum + (grade ? EXAM_POINT_MAP[grade] : 0), 0) + writingLevel;
}

export function calculateGradeMarkerCounts(grades: Array<ExamGrade | undefined>) {
  return grades.reduce(
    (counts, grade) => {
      if (grade === "A++") counts.aPlusCount += 2;
      if (grade === "A+") counts.aPlusCount += 1;
      if (grade === "B++") counts.bPlusCount += 2;
      if (grade === "B+") counts.bPlusCount += 1;
      return counts;
    },
    { aPlusCount: 0, bPlusCount: 0 },
  );
}

function subjectMap<T extends Record<string, number>>(grades: Array<ExamGrade | undefined>, map: T) {
  return SUBJECT_KEYS.reduce<Record<string, number>>((result, key, index) => {
    const grade = grades[index];
    result[key] = grade ? map[grade] : 0;
    return result;
  }, {});
}

function toTenths(score: number) {
  return Math.round(score * 10);
}

function fromTenths(score: number) {
  return Math.round(score) / 10;
}

function fromTenthsObject<T extends Record<string, number>>(value: T) {
  return Object.fromEntries(Object.entries(value).map(([key, score]) => [key, fromTenths(score)]));
}

function clampTenths(score: number, max: number) {
  return Math.min(Math.max(Math.round(score), 0), max);
}
