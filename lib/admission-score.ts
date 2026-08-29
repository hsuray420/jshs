export const GRADES = ["A++", "A+", "A", "B++", "B+", "B", "C"] as const;

import centralTaiwanResearch from "../data/admission/115/central_taiwan.json" with { type: "json" };
import changhuaResearch from "../data/admission/115/changhua.json" with { type: "json" };
import changhuaCompetitionCatalog from "../data/admission/115/changhua_competition_catalog.json" with { type: "json" };
import ttkResearch from "../data/admission/115/research/ttk_115_admission_rules.json" with { type: "json" };
import tycResearch from "../data/admission/115/research/tyc_115_admission_rules.json" with { type: "json" };
import khResearch from "../data/admission/115/research/kh_115_admission_rules.json" with { type: "json" };
import ilnResearch from "../data/admission/115/research/iln_115_admission_rules.json" with { type: "json" };
import hhmResearch from "../data/admission/115/research/hhm_115_admission_rules.json" with { type: "json" };
import ylcResearch from "../data/admission/115/research/ylc_115_admission_rules.json" with { type: "json" };
import cycResearch from "../data/admission/115/research/cyc_115_admission_rules.json" with { type: "json" };
import tnnResearch from "../data/admission/115/research/tnn_115_admission_rules.json" with { type: "json" };
import ptcResearch from "../data/admission/115/research/ptc_115_admission_rules.json" with { type: "json" };
import hlcResearch from "../data/admission/115/research/hlc_115_admission_rules.json" with { type: "json" };
import tttResearch from "../data/admission/115/research/ttt_115_admission_rules.json" with { type: "json" };
import phcResearch from "../data/admission/115/research/phc_115_admission_rules.json" with { type: "json" };
import kmnResearch from "../data/admission/115/research/kmn_115_admission_rules.json" with { type: "json" };

export const CHANGHUA_COMPETITION_CATALOG = changhuaCompetitionCatalog.items;

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
const CHANGHUA_EXAM_SCORE_MAP: Record<ExamGrade, number> = { "A++": 9, "A+": 8, A: 7, "B++": 6, "B+": 5, B: 4, C: 3 };

export const GRADE_RANK_MAP = {
  "A++": 7,
  "A+": 6,
  A: 5,
  "B++": 4,
  "B+": 3,
  B: 2,
  C: 1,
} as const;

export type AdmissionDistrict = "tp" | "ct" | "ilan" | "taoyuan-lienchiang" | "hsinchu-miaoli" | "changhua" | "yunlin" | "chiayi" | "tainan" | "kaohsiung" | "pingtung" | "hualien" | "taitung" | "penghu" | "kinmen";
export type ExamGrade = keyof typeof EXAM_SCORE_MAP;
export type EconomicStatus = "NONE" | "LOWER_MIDDLE_INCOME" | "LOW_INCOME";

/** Only districts backed by an explicitly supplied 115 MD/JSON rule source may calculate. */
export const SOURCE_BACKED_ADMISSION_DISTRICTS = ["tp", "ct", "ilan", "taoyuan-lienchiang", "hsinchu-miaoli", "changhua", "yunlin", "chiayi", "tainan", "kaohsiung", "pingtung", "hualien", "taitung", "penghu", "kinmen"] as const;

export type ScoreCategory = Readonly<{ key: string; label: string; max: number; description: string; calculation?: string }>;
export type AdmissionRule = Readonly<{
  code: AdmissionDistrict;
  label: string;
  academicYear: string;
  totalScore: number;
  sourceNote: string;
  categories: readonly ScoreCategory[];
  tieBreakers: readonly string[];
  sourceId?: string;
  fields?: readonly ResearchField[];
  preferenceScoring?: Readonly<ResearchPreferenceScoring>;
  examScoring?: Readonly<ResearchExamScoring>;
  verificationStatus?: string;
  officialSourceName?: string;
  officialSourceUrl?: string;
  verifiedAt?: string;
  status?: "已核對／準備版，116 待官方公告" | "待確認";
  writingIncludedInTotal?: boolean;
}>;

type ResearchPreferenceScoring = Readonly<{ enabled?: boolean; max_choices?: number | null; grouping_method?: string | null; minimum_score?: number | null; score_cap?: number; ranges?: readonly { from: number; to: number | null; score: number }[] }>;
type ResearchExamScoring = Readonly<{ subject_options?: readonly { value: string; score: number }[]; writing_options?: readonly { value: string; score: number }[]; score_cap?: number; base_score_cap?: number; writing_in_total?: boolean; violation_deduction?: { one_point?: number } }>;
export type ResearchField = Readonly<{ field_id: string; label: string; input_type: string; category?: string; subcategory?: string; helper_text?: string; official_rule?: string; conditions?: readonly string[]; adopted_period?: string; score_cap?: number; evidence_description?: string; calculation?: string; options?: readonly { label: string; value: unknown; score?: number | null }[]; validation?: { required?: boolean; min?: number; max?: number; min_items?: number } }>;
type ResearchRule = { district_name: string; academic_year: number; total_score_max: number; version: string; categories: readonly { category_id?: string; id?: string; label?: string; score_cap: number; calculation?: string }[]; tie_breaking_rules: readonly { field: string }[]; fields: readonly ResearchField[]; verification_status: string; preference_scoring?: ResearchPreferenceScoring; exam_scoring?: ResearchExamScoring; sources?: readonly { document_title?: string; official_url?: string; accessed_date?: string }[] };

function researchRule(data: ResearchRule, code: AdmissionDistrict): AdmissionRule {
  const source = data.sources?.[0];
  const keyMap: Record<string, string> = {
    exam: "examPerformanceScore", preference: "preferenceScore", nearby: "nearbyEnrollmentScore",
    disadvantaged: "disadvantagedScore", economic: "economicScore", balanced: "balancedScore",
    multiple: "multipleLearningScore", multiple_learning: "multipleLearningScore",
    multiple_development: "multipleLearningScore", adaptive: "adaptationScore",
    adaptive_guidance: "adaptationScore", graduation: "graduationScore", morality: "moralityScore",
    service: "serviceScore", competition: "competitionScore", fitness: "fitnessScore", other: "otherScore",
  };
  return {
    code, label: data.district_name, academicYear: String(data.academic_year), totalScore: data.total_score_max,
    sourceNote: "依本區官方規則資料整理；正式送出前仍須核對當年度官方簡章。",
    categories: data.categories.map((item) => { const id = item.category_id ?? item.id ?? "other"; const label = item.label ?? id; return { key: keyMap[id] ?? id, label, max: item.score_cap, description: `${label}依本區官方規則換算，最高採計${item.score_cap}分。`, calculation: item.calculation }; }),
    tieBreakers: data.tie_breaking_rules.map((item) => item.field), sourceId: `${code}-115-research-json`, fields: data.fields, preferenceScoring: data.preference_scoring,
    examScoring: data.exam_scoring, verificationStatus: data.verification_status,
    officialSourceName: source?.document_title ?? `${data.district_name} 115 學年度高級中等學校免試入學簡章`,
    officialSourceUrl: source?.official_url ?? "https://www.edu.tw/",
    verifiedAt: source?.accessed_date ?? "2026-08-28",
    status: /unresolved|partial|blocker/i.test(data.verification_status) ? "待確認" : "已核對／準備版，116 待官方公告",
    writingIncludedInTotal: data.exam_scoring?.writing_in_total ?? (code === "tp" || code === "tainan" || code === "taoyuan-lienchiang"),
  };
}

const DERIVED_FIELD_LABELS: Readonly<Record<string, string>> = {
  total_score: "總積分",
  preference_score: "志願序積分",
  nearby_score: "就近入學積分",
  nearby_enrollment_score: "就近入學積分",
  economic_weakness_score: "經濟弱勢積分",
  raw_choice_order: "原始志願順序",
  writing_grade: "寫作測驗級分",
  exam_violation_points: "會考違規扣點",
  exam_total_points: "會考總積點",
  exam_performance_score: "會考表現分數",
  preference_choices: "志願清單",
  chinese_exam_grade: "國文會考成績",
  math_exam_grade: "數學會考成績",
  english_exam_grade: "英語會考成績",
  social_exam_grade: "社會會考成績",
  science_exam_grade: "自然會考成績",
  competition_results: "競賽得獎紀錄",
  fitness_session_results: "體適能檢測結果",
  catalog_id: "官方競賽項目",
  result_date: "成績公布日期",
  proof_submission_date: "證明繳交日期",
  participant_count: "參賽人數",
  test_date: "體適能檢測日期",
};

function normalizedFieldId(fieldId: string) {
  return fieldId.replace(/\[\d+\]/g, "").split(".").pop() || fieldId;
}

/** Converts rule/configuration identifiers into safe, human-readable UI copy. */
export function resolveAdmissionFieldLabel(fieldId: string, rule: AdmissionRule): string {
  if (/[\u3400-\u9fff]/.test(fieldId)) return fieldId;
  const exact = rule.fields?.find((field) => field.field_id === fieldId)?.label;
  if (exact) return exact;
  const normalized = normalizedFieldId(fieldId);
  return DERIVED_FIELD_LABELS[fieldId] || DERIVED_FIELD_LABELS[normalized] || "規則欄位";
}

export function resolveAdmissionMissingFieldLabels(fieldIds: readonly string[], rule: AdmissionRule): string[] {
  return [...new Set(fieldIds.map((fieldId) => resolveAdmissionFieldLabel(fieldId, rule)))];
}

const referenceRule = (code: AdmissionDistrict, label: string, totalScore = 100): AdmissionRule => ({
  code,
  label,
  academicYear: "115",
  totalScore,
  sourceNote: `依 Notebook 提供的 ${label}規則報告建立逐項輸入版；正式計分仍請以${label}免試入學委員會最新簡章核對。`,
  categories: [
    category("preferenceScore", "志願序小計", 30, "請依本區報告與當年度簡章，輸入志願序項目的實際小計。"),
    category("multipleLearningScore", "多元學習表現小計", 40, "請依本區報告逐項加總後，輸入多元學習表現小計。"),
    category("examPerformanceScore", "國中教育會考小計", 30, "請依本區會考折算表輸入會考小計；五科標示仍會保留供同分比序參考。"),
  ],
  tieBreakers: ["依本區簡章公告之第一順位", "依本區簡章公告之第二順位", "依本區簡章公告之第三順位", "會考標示與科目順序", "志願序", "名額與超額比序規則"],
  officialSourceName: `${label} 115 學年度高級中等學校免試入學簡章`,
  officialSourceUrl: "https://www.edu.tw/",
  verifiedAt: "2026-08-28",
  status: "待確認",
  writingIncludedInTotal: false,
});

const category = (key: string, label: string, max: number, description: string): ScoreCategory => ({ key, label, max, description });
const REFERENCE_DISTRICTS = new Set<AdmissionDistrict>(["ilan", "hsinchu-miaoli", "changhua", "yunlin", "chiayi", "pingtung", "hualien", "taitung", "penghu", "kinmen"]);

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
  ilan: referenceRule("ilan", "宜蘭區"),
  "hsinchu-miaoli": referenceRule("hsinchu-miaoli", "竹苗區"),
  changhua: referenceRule("changhua", "彰化區", 135),
  yunlin: referenceRule("yunlin", "雲林區"),
  chiayi: referenceRule("chiayi", "嘉義區"),
  pingtung: referenceRule("pingtung", "屏東區"),
  hualien: referenceRule("hualien", "花蓮區"),
  taitung: referenceRule("taitung", "臺東區"),
  penghu: referenceRule("penghu", "澎湖區"),
  kinmen: referenceRule("kinmen", "金門區", 60),
};

ADMISSION_RULES.tp = researchRule(ttkResearch as unknown as ResearchRule, "tp");
ADMISSION_RULES["taoyuan-lienchiang"] = researchRule(tycResearch as unknown as ResearchRule, "taoyuan-lienchiang");
ADMISSION_RULES.kaohsiung = researchRule(khResearch as unknown as ResearchRule, "kaohsiung");
ADMISSION_RULES.ct = researchRule(centralTaiwanResearch as unknown as ResearchRule, "ct");
ADMISSION_RULES.changhua = researchRule(changhuaResearch as unknown as ResearchRule, "changhua");
ADMISSION_RULES.ilan = researchRule(ilnResearch as unknown as ResearchRule, "ilan");
ADMISSION_RULES["hsinchu-miaoli"] = researchRule(hhmResearch as unknown as ResearchRule, "hsinchu-miaoli");
ADMISSION_RULES.yunlin = researchRule(ylcResearch as unknown as ResearchRule, "yunlin");
ADMISSION_RULES.chiayi = researchRule(cycResearch as unknown as ResearchRule, "chiayi");
ADMISSION_RULES.tainan = researchRule(tnnResearch as unknown as ResearchRule, "tainan");
ADMISSION_RULES.pingtung = researchRule(ptcResearch as unknown as ResearchRule, "pingtung");
ADMISSION_RULES.hualien = researchRule(hlcResearch as unknown as ResearchRule, "hualien");
ADMISSION_RULES.taitung = researchRule(tttResearch as unknown as ResearchRule, "taitung");
ADMISSION_RULES.penghu = researchRule(phcResearch as unknown as ResearchRule, "penghu");
ADMISSION_RULES.kinmen = researchRule(kmnResearch as unknown as ResearchRule, "kinmen");

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
  manualCategoryScores?: { preferenceScore?: number; multipleLearningScore?: number; examPerformanceScore?: number };
  exam?: { chineseGrade?: ExamGrade; mathGrade?: ExamGrade; englishGrade?: ExamGrade; socialGrade?: ExamGrade; scienceGrade?: ExamGrade; writingLevel?: number; violationPoints?: number };
  ruleValues?: Record<string, unknown>;
};

const SUBJECT_KEYS = ["chinese", "math", "english", "social", "science"] as const;

export function isAdmissionDistrict(value: string): value is AdmissionDistrict {
  return Object.prototype.hasOwnProperty.call(ADMISSION_RULES, value);
}

export function isAdmissionCalculatorAvailable(value: string): value is (typeof SOURCE_BACKED_ADMISSION_DISTRICTS)[number] {
  return (SOURCE_BACKED_ADMISSION_DISTRICTS as readonly string[]).includes(value);
}

export function getAdmissionRule(district: string | undefined): AdmissionRule {
  const code = district || "ct";
  if (!isAdmissionDistrict(code)) throw new Error(`Unsupported admission district: ${code}`);
  return ADMISSION_RULES[code];
}

export function calculateAdmissionScore(input: AdmissionScoreInput) {
  const rule = getAdmissionRule(input.district);
  if (rule.sourceId && (["ct", "changhua"].includes(rule.code) || Boolean(input.ruleValues))) return calculateResearchScore(input, rule);
  const choices = input.choiceList ?? [];
  const assignedChoices = assignPreferenceSequences(choices, rule.code);
  const preferenceSequence = assignedChoices[0]?.preferenceSequence ?? 1;
  const preferenceScore = calculatePreferenceScore(preferenceSequence, rule.code);
  const exam = calculateExam(rule.code, input.exam, input.manualCategoryScores);
  const otherItems = calculateDistrictItems(rule.code, input, preferenceScore);
  const totalScore = roundToTenth(Math.min(rule.totalScore, otherItems.otherItemsTotal + exam.examPerformanceScore));

  const output = {
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
    perChoiceResults: assignedChoices.map((choice, index) => {
      const referencePreferenceScore = (otherItems as { preferenceScore?: number }).preferenceScore ?? 0;
      const choicePreferenceScore = REFERENCE_DISTRICTS.has(rule.code) ? referencePreferenceScore : calculatePreferenceScore(choice.preferenceSequence, rule.code);
      const basePreferenceScore = REFERENCE_DISTRICTS.has(rule.code) ? referencePreferenceScore : preferenceScore;
      return { ...choice, choiceSequence: index + 1, preferenceScore: choicePreferenceScore, totalScore: roundToTenth(Math.min(rule.totalScore, otherItems.otherItemsTotal - basePreferenceScore + choicePreferenceScore + exam.examPerformanceScore)) };
    }),
  };
  return { ...output, scoreBreakdown: buildScoreBreakdown(rule, output.otherItems, output.exam.examPerformanceScore) };
}

function calculateResearchScore(input: AdmissionScoreInput, rule: AdmissionRule) {
  const values = input.ruleValues ?? legacyResearchValues(input, rule.code);
  const missingFields = (rule.fields ?? []).filter((field) => {
    if (!field.validation?.required || values[field.field_id] === undefined) return Boolean(field.validation?.required);
    const minItems = (field.validation as { min_items?: number }).min_items;
    const listValue = values[field.field_id];
    if (field.field_id === "exam_full_marks") {
      const marks = listValue as Record<string, unknown>;
      return !marks || typeof marks !== "object" || ["chinese", "math", "english", "social", "science"].some((key) => !marks[key]);
    }
    return minItems !== undefined && (!Array.isArray(listValue) || (listValue as unknown[]).length < minItems);
  }).map((field) => field.field_id);
  if (rule.preferenceScoring?.enabled && !(rule.fields ?? []).some((field) => field.field_id === "preference_choices") && values.preference_rank === undefined && values.preference_group_rank === undefined) missingFields.push("preference_rank");
  if (rule.code === "changhua") missingFields.push(...validateChanghuaStructuredFields(values));
  const gradeKeys = rule.code === "tp" || rule.code === "taoyuan-lienchiang" || rule.code === "kaohsiung"
    ? ["chinese_exam_level", "math_exam_level", "english_exam_level", "social_exam_level", "science_exam_level"]
    : ["chinese_exam_grade", "math_exam_grade", "english_exam_grade", "social_exam_grade", "science_exam_grade"];
  const grades = gradeKeys.map((key) => normalizeResearchExamGrade(values[key])) as Array<ExamGrade | undefined>;
  if (missingFields.length) {
    const examPerformanceScore = grades.reduce((sum, grade) => sum + (grade ? (rule.code === "changhua" ? CHANGHUA_EXAM_SCORE_MAP[grade] : examScoreForResearch(rule.code, grade)) : 0), 0);
    const assigned = assignPreferenceSequences((values.preference_choices as Array<{ schoolId: string; departmentId?: string }> | undefined) ?? input.choiceList ?? [], rule.code);
    return { district: rule.code, rule, status: "incomplete" as const, totalScore: null, missingFields, otherItems: {}, exam: { examPerformanceScore, examTotalPoints: grades.reduce((sum, grade) => sum + (grade ? EXAM_POINT_MAP[grade] : 0), 0) + Number(values.writing_grade ?? 0), writingScore: 0 }, comparisonKeys: {}, perChoiceResults: assigned.map((choice, index) => ({ ...choice, choiceSequence: index + 1, preferenceScore: rule.code === "changhua" ? (choice.preferenceSequence <= 20 ? 45 : 44) : calculatePreferenceScore(choice.preferenceSequence, "ct"), totalScore: null })), scoreBreakdown: [] };
  }
  const choices = (values.preference_choices as Array<{ schoolId: string; departmentId?: string; vocationalClusterId?: string }> | undefined) ?? input.choiceList ?? [];
  const assigned = assignPreferenceSequences(choices, rule.code);
  const rank = assigned[0]?.preferenceSequence ?? 1;
  const preferenceScore = rule.preferenceScoring?.enabled ? preferenceScoreFromRule(rule, values, rank) : 0;
  const examGrades = gradeKeys.map((key) => normalizeResearchExamGrade(values[key]) as ExamGrade);
  const usesNewDistrictExam = ["chiayi", "tainan", "pingtung", "hualien", "taitung", "penghu", "kinmen"].includes(rule.code);
  const examScores = examGrades.map((grade) => rule.code === "changhua" ? CHANGHUA_EXAM_SCORE_MAP[grade] ?? 0 : usesNewDistrictExam ? researchExamSubjectScore(rule, grade) : examScoreForResearch(rule.code, grade));
  const writing = Number(values.writing_grade ?? 0);
  const violation = Number(values.exam_violation_points ?? 0);
  const examRawScore = examScores.reduce((a, b) => a + b, 0) + (usesNewDistrictExam ? researchExamWritingScore(rule, writing) : examWritingScore(rule.code, writing));
  const examPerformanceScore = rule.code === "changhua" && values.exam_disposition === "exam_component_zero" ? 0 : Math.max(0, (usesNewDistrictExam ? Math.min(rule.examScoring?.score_cap ?? rule.examScoring?.base_score_cap ?? Infinity, examRawScore) - violation * researchExamViolationDeduction(rule) : examRawScore - violation * (rule.code === "changhua" || rule.code === "kaohsiung" ? .3 : 0)));
  const examTotalPoints = examGrades.reduce((sum, grade) => sum + (EXAM_POINT_MAP[grade] ?? 0), 0) + writing;
  const calculatedItems = rule.code === "ct" ? calculateResearchCt(values, preferenceScore) : rule.code === "changhua" ? calculateResearchChc(values, preferenceScore) : rule.code === "tp" ? calculateResearchTtk(values, preferenceScore) : rule.code === "taoyuan-lienchiang" ? calculateResearchTyc(values, preferenceScore) : rule.code === "kaohsiung" ? calculateResearchKh(values, preferenceScore) : rule.code === "ilan" ? calculateResearchIln(values) : rule.code === "hsinchu-miaoli" ? calculateResearchHhm(values) : rule.code === "yunlin" ? calculateResearchYlc(values) : calculateNewDistrictResearch(rule, values, preferenceScore);
  const calculated = calculatedItems as Record<string, number>;
  const otherItems = { ...calculated, otherItemsTotal: calculated.otherItemsTotal ?? 0, preferenceScore: calculated.preferenceScore ?? calculated.preference_score ?? calculated.preference ?? preferenceScore, preference_score: calculated.preference_score ?? calculated.preference ?? preferenceScore, multipleLearningScore: calculated.multipleLearningScore ?? calculated.multiple_learning ?? calculated.multiple_score ?? calculated.multiple_development ?? 0, adaptationScore: calculated.adaptationScore ?? calculated.adaptive_guidance ?? calculated.adaptive_preference_score ?? calculated.adaptive_score ?? 0 };
  const totalScore = Math.min(rule.totalScore, otherItems.otherItemsTotal + examPerformanceScore);
  return { district: rule.code, rule, status: "complete" as const, totalScore, missingFields: [], otherItems, exam: { examPerformanceScore, examTotalPoints, writingScore: 0 }, comparisonKeys: { totalScore, examTotalPoints }, perChoiceResults: assigned.map((choice, index) => { const choicePreferenceScore = rule.preferenceScoring?.enabled ? preferenceScoreFromRule(rule, values, choice.preferenceSequence) : 0; return { ...choice, choiceSequence: index + 1, preferenceScore: choicePreferenceScore, totalScore: Math.min(rule.totalScore, otherItems.otherItemsTotal - preferenceScore + choicePreferenceScore + examPerformanceScore) }; }), scoreBreakdown: buildScoreBreakdown(rule, otherItems, examPerformanceScore) };
}

function buildScoreBreakdown(rule: AdmissionRule, otherItems: Record<string, number>, examScore: number) {
  const aliases: Record<string, string[]> = {
    preferenceScore: ["preferenceScore", "preference_score", "preference"],
    multipleLearningScore: ["multipleLearningScore", "multiple_learning", "multiple_score", "multiple_development"],
    adaptationScore: ["adaptationScore", "adaptive_guidance", "adaptive_preference_score"],
  };
  return rule.categories.map((category) => {
    if (category.key === "examPerformanceScore") return { key: category.key, label: category.label, score: examScore, max: category.max, calculation: category.calculation ?? "依五科等級與寫作測驗規則折算", includedInTotal: rule.writingIncludedInTotal };
    const keys = aliases[category.key] ?? [category.key, category.key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), `${category.key.replace(/Score$/, "")}_score`];
    const score = keys.map((key) => otherItems[key]).find((value) => typeof value === "number") ?? 0;
    return { key: category.key, label: category.label, score, max: category.max, calculation: category.calculation ?? category.description, includedInTotal: true };
  });
}

function researchPreferenceScore(district: AdmissionDistrict, values: Record<string, unknown>, rank: number) {
  if (district === "changhua") return rank <= 20 ? 45 : 44;
  if (!["ilan", "hsinchu-miaoli", "yunlin"].includes(district)) return calculatePreferenceScore(rank, "ct");
  if (district === "ilan") return 0;
  const field = district === "hsinchu-miaoli" ? "preference_rank" : "preference_rank";
  const selectedRank = Math.max(1, Number(values[field] ?? rank) || rank || 1);
  const ranges = district === "hsinchu-miaoli"
    ? [[1, 5, 10], [6, 10, 9], [11, 15, 8], [16, 20, 7], [21, 25, 6]]
    : [[1, 10, 8], [11, 20, 7], [21, 30, 6], [31, 40, 5], [41, 50, 4]];
  return ranges.find(([from, to]) => selectedRank >= from && selectedRank <= to)?.[2] ?? 0;
}

function preferenceScoreFromRule(rule: AdmissionRule, values: Record<string, unknown>, fallbackRank: number) {
  const field = rule.code === "tainan" || rule.code === "taitung" ? "preference_group_rank" : "preference_rank";
  const rank = Math.max(1, integerValue(values[field] ?? fallbackRank));
  const range = rule.preferenceScoring?.ranges?.find(({ from, to }) => rank >= from && (to === null || rank <= to));
  return range?.score ?? rule.preferenceScoring?.minimum_score ?? 0;
}

function examScoreForResearch(district: AdmissionDistrict, grade: ExamGrade) {
  return district === "tp" ? GRADE_RANK_MAP[grade] : EXAM_SCORE_MAP[grade];
}

function researchExamSubjectScore(rule: AdmissionRule, grade: ExamGrade) {
  const configured = rule.examScoring?.subject_options?.find((option) => option.value === grade)?.score;
  return configured ?? examScoreForResearch(rule.code, grade);
}

function researchExamWritingScore(rule: AdmissionRule, writing: number) {
  if (rule.examScoring?.writing_in_total === false) return 0;
  const configured = rule.examScoring?.writing_options?.find((option) => option.value === String(clamp(writing, 0, 6)))?.score;
  return configured ?? examWritingScore(rule.code, writing);
}

function researchExamViolationDeduction(rule: AdmissionRule) {
  return rule.examScoring?.violation_deduction?.one_point ?? (rule.code === "changhua" || rule.code === "kaohsiung" ? .3 : 0);
}

function normalizeResearchExamGrade(value: unknown): ExamGrade | undefined {
  if (["A++", "A+", "A", "B++", "B+", "B", "C"].includes(String(value))) return value as ExamGrade;
  return undefined;
}

function examWritingScore(district: AdmissionDistrict, writing: number) {
  if (district === "tp") return [0, .1, .2, .4, .6, .8, 1][clamp(writing, 0, 6)] ?? 0;
  if (district === "taoyuan-lienchiang") return writing === 0 ? 0 : writing === 1 ? 1 : writing <= 3 ? 2 : 3;
  return 0;
}

function calculateResearchTtk(values: Record<string, unknown>, preferenceScore: number) {
  const balanced = ["balanced_health_pe_passed", "balanced_arts_passed", "balanced_integrated_passed", "balanced_technology_passed"].filter((key) => values[key] === true).length * 6;
  const service = Math.min(12, ["service_hours_112_s1", "service_hours_112_s2", "service_hours_113_s1", "service_hours_113_s2", "service_hours_114_s1"].filter((key) => Number(values[key]) >= 6).length * 4);
  return { preference: preferenceScore, multiple_learning: balanced + service, otherItemsTotal: preferenceScore + balanced + service };
}

function calculateResearchTyc(values: Record<string, unknown>, preferenceScore: number) {
  const graduation = enumScore(values.graduation_status, ["graduated", "completion"], [6, 2]);
  const career = ["career_parent_match", "career_homeroom_match", "career_counselor_match"].filter((key) => values[key] === true).length * 2;
  const nearby = enumScore(values.nearby_eligibility, ["general", "common"], [5, 5]);
  const balanced = Math.min(9, ["balanced_health_pe_passed", "balanced_arts_passed", "balanced_integrated_passed", "balanced_technology_passed"].filter((key) => values[key] === true).length * 3);
  const reward = Math.min(6, Number(values.major_merit_count) * 4.5 + Number(values.minor_merit_count) * 1.5 + Number(values.commendation_count) * .5);
  const morality = Math.min(10, reward + (values.discipline_after_cancellation === "qualified" ? 6 : 0));
  const service = Math.min(10, Math.min(4, Number(values.qualified_cadre_semesters) * 2) + Math.floor(Number(values.certified_service_hours)) * .3);
  const talent = Math.min(5, sumScores(values.talent_competition_results));
  const fitness = values.fitness_any_item_qualified === true ? 6 : 0;
  const language = ["indigenous_initial_plus", "hakka_initial_plus", "taiwanese_initial_plus"].includes(String(values.local_language_certificate)) ? 2 : 0;
  const adaptive = graduation + preferenceScore + career + nearby;
  const multipleRaw = balanced + morality + service + talent + fitness + language;
  const multiple = Math.min(35, multipleRaw);
  return { adaptive_guidance: adaptive, multiple_learning_raw: multipleRaw, multiple_learning: multiple, otherItemsTotal: adaptive + multiple };
}

function calculateResearchKh(values: Record<string, unknown>, preferenceScore: number) {
  const balancedCount = ["balanced_health_pe_passed", "balanced_arts_passed", "balanced_integrated_passed", "balanced_technology_passed"].filter((key) => values[key] === true).length;
  const balanced = balancedCount === 0 ? 0 : balancedCount === 1 ? 3 : 10;
  const service = Math.min(10, ["service_hours_grade7", "service_hours_grade8", "service_hours_grade9"].reduce((sum, key) => sum + Math.min(Math.floor(Number(values[key]) / 3), 4), 0));
  const fitness = Math.min(20, 3 * ["fitness_qualified_items_grade7", "fitness_qualified_items_grade8", "fitness_qualified_items_grade9"].reduce((sum, key) => sum + Number(values[key] || 0), 0));
  const competition = Math.min(20, sumScores(values.competition_results));
  const credential = Math.min(20, sumScores(values.credential_results));
  const reward = Math.min(10, Math.max(0, Number(values.major_merit_count) * 4.5 + Number(values.minor_merit_count) * 1.5 + Number(values.commendation_count) * .5));
  const cadre = Math.min(10, Number(values.qualified_cadre_semesters) * 2);
  const multiple = Math.min(40, balanced + service + fitness + competition + credential + reward + cadre);
  return { preference: preferenceScore, multiple_development: multiple, otherItemsTotal: preferenceScore + multiple };
}

function calculateResearchIln(values: Record<string, unknown>) {
  const balanced = ["balanced_health_pe", "balanced_arts", "balanced_integrated", "balanced_technology"].filter((key) => values[key] === true).length * 1.5;
  const discipline = optionValueScore(values.discipline_status, "discipline_status", 5);
  const service = Math.min(5, Math.min(3, integerValue(values.class_cadre_semesters)) + Math.min(2, integerValue(values.club_cadre_semesters)) + Math.min(3, integerValue(values.volunteer_semesters)));
  const competition = Math.min(3, selectedOptionScore(values.competition_achievements, researchFieldOptions(ilnResearch, "competition_achievements")));
  const fitness = Math.min(3, ["fitness_flexibility_qualified", "fitness_muscular_endurance_qualified", "fitness_explosive_power_qualified", "fitness_cardiorespiratory_qualified"].filter((key) => values[key] === true).length * 0.6 + optionValueScore(values.fitness_medal, "fitness_medal", 0.6));
  const adaptive = ["adaptive_student_choice_match", "adaptive_parent_suggestion_match", "adaptive_guidance_suggestion_match"].filter((key) => values[key] === true).length * 2;
  const graduation = values.graduation_qualification === true ? 3 : 0;
  const nonExam = graduation + balanced + discipline + service + competition + fitness + adaptive;
  return { non_exam: nonExam, otherItemsTotal: nonExam };
}

function calculateResearchHhm(values: Record<string, unknown>) {
  const disadvantaged = Math.min(5, selectedOptionScore(values.disadvantaged_qualifications, researchFieldOptions(hhmResearch, "disadvantaged_qualifications")));
  const nearby = values.nearby_eligibility === true ? 5 : 0;
  const preference = researchPreferenceScore("hsinchu-miaoli", values, 0);
  const balancedCount = ["balanced_health_pe", "balanced_arts", "balanced_integrated", "balanced_technology"].filter((key) => values[key] === true).length;
  const balanced = [0, 4, 8, 12, 15][balancedCount] ?? 0;
  const balancedDevelopment = Math.min(30, disadvantaged + nearby + preference + balanced);
  const discipline = values.discipline_clear === true ? 10 : 0;
  const attendance = Math.min(12, integerValue(values.no_truancy_semesters) * 2);
  const reward = Math.min(20, integerValue(values.major_merit_count) * 4.5 + integerValue(values.minor_merit_count) * 1.5 + integerValue(values.commendation_count) * 0.5);
  const service = ["service_hours_grade7_first", "service_hours_grade7_second", "service_hours_grade8_first", "service_hours_grade8_second", "service_hours_grade9_first"].reduce((sum, key) => sum + Math.min(2, Math.floor(Math.max(0, Number(values[key] ?? 0)) / 3)), 0);
  const language = optionValueScore(values.local_language_certificate, "local_language_certificate", 2);
  const multipleLearning = Math.min(40, discipline + attendance + reward + service + language);
  return { balanced_development: balancedDevelopment, multiple_learning: multipleLearning, otherItemsTotal: balancedDevelopment + multipleLearning };
}

function calculateResearchYlc(values: Record<string, unknown>) {
  const preference = researchPreferenceScore("yunlin", values, 0);
  const economic = optionValueScore(values.economic_status, "economic_status", 1);
  const nearby = values.nearby_eligibility === true ? 5 : 0;
  const attendance = Math.min(5, integerValue(values.no_truancy_semesters));
  const discipline = optionValueScore(values.discipline_status, "discipline_status", 5);
  const balanced = Math.min(9, integerValue(values.balanced_qualified_domain_count) * 3);
  const remote = optionValueScore(values.remote_school_class_band, "remote_school_class_band", 2);
  const reward = Math.min(15, integerValue(values.major_merit_count) * 4.5 + integerValue(values.minor_merit_count) * 1.5 + integerValue(values.commendation_count) * 0.5);
  const competition = Math.min(9, selectedOptionScore(values.competition_achievements, researchFieldOptions(ylcResearch, "competition_achievements")));
  const fitness = Math.min(6, integerValue(values.fitness_qualified_item_count) * 3);
  const grouped = Math.min(25, reward + competition + fitness);
  const nonExam = preference + economic + nearby + attendance + discipline + balanced + remote + grouped;
  return { preference: preference, non_exam: nonExam, otherItemsTotal: nonExam };
}

function calculateNewDistrictResearch(rule: AdmissionRule, values: Record<string, unknown>, preferenceScore: number) {
  const option = (fieldId: string) => optionScore(values[fieldId], rule.fields?.find((field) => field.field_id === fieldId)?.options);
  const records = (fieldId: string, cap: number) => Math.min(cap, sumScores(values[fieldId]));
  const fitness = (fieldId: string, multiplier: number, cap: number, extraKey?: string) => {
    const value = values[fieldId];
    if (typeof value === "number") return Math.min(cap, Math.max(0, value));
    if (!value || typeof value !== "object") return 0;
    const record = value as Record<string, unknown>;
    if (record.special === true) return cap;
    return Math.min(cap, integerValue(record.qualified_items) * multiplier + Number(record[extraKey ?? "medal_bonus"] ?? record.medal_bonus ?? 0) + (record.completed_all === true ? 2 : 0));
  };

  if (rule.code === "chiayi") {
    const balanced = ["balanced_health_pe", "balanced_arts", "balanced_integrated", "balanced_technology"].filter((id) => values[id] === true).length * 3;
    const adaptive = ["adaptive_parent_matches", "adaptive_teacher_matches", "adaptive_counselor_matches"].filter((id) => values[id] === true).length * 2;
    const morality = Math.min(12, option("discipline_status") + integerValue(values.major_merit_count) * 9 + integerValue(values.minor_merit_count) * 3 + integerValue(values.commendation_count));
    const service = Math.min(8, Math.floor(Number(values.service_learning_hours) / 2));
    const fitnessScore = fitness("fitness_result", 3, 10);
    const competition = records("competition_records", 10);
    const multiple = Math.min(26, morality + service + fitnessScore + competition);
    const lowIncome = option("low_income_status");
    return { preference_score: preferenceScore, low_income_score: lowIncome, balanced_score: balanced, adaptive_score: adaptive, morality_score: morality, service_score: service, fitness_score: fitnessScore, competition_score: competition, multiple_score: multiple, otherItemsTotal: preferenceScore + lowIncome + balanced + adaptive + multiple };
  }

  if (rule.code === "tainan") {
    const competition = records("competition_records", 10);
    const reward = Math.min(15, Math.max(0, (values.no_remaining_punishment === true ? 3 : 0) + integerValue(values.major_merit_count) * 4.5 + integerValue(values.minor_merit_count) * 1.5 + integerValue(values.commendation_count) * .5 - integerValue(values.major_demerit_count) * 4.5 - integerValue(values.minor_demerit_count) * 1.5 - integerValue(values.warning_count) * .5));
    const club = Math.min(15, [1, 2, 3, 4, 5].filter((n) => values[`club_semester_${n}_qualified`] === true).length * 3);
    const service = Math.min(15, Number(values.service_learning_hours) * .3);
    const fitnessScore = option("fitness_band");
    const language = option("language_certificate");
    const multiple = Math.min(50, competition + reward + club + service + fitnessScore + language);
    const nearby = values.nearby_eligibility === true ? 10 : 0;
    return { preference_score: preferenceScore, competition_score: competition, reward_score: reward, club_score: club, service_score: service, fitness_score: fitnessScore, language_score: language, multiple_score: multiple, nearby_score: nearby, otherItemsTotal: preferenceScore + multiple + nearby };
  }

  if (rule.code === "pingtung") {
    const graduation = values.graduation_qualified === true ? 2 : 0;
    const balanced = Math.min(9, integerValue(values.balanced_qualified_domain_count) * 3);
    const service = Math.min(10, integerValue(values.class_cadre_semesters) * 3 + integerValue(values.club_president_semesters) * 2 + integerValue(values.special_service_semesters) * 2);
    const discipline = option("discipline_status");
    const competition = records("competition_records", 10);
    const fitnessScore = fitness("fitness_status", 2, 10);
    const language = values.local_language_certificate === true ? 2 : 0;
    const multiple = Math.min(28, service + discipline + competition + fitnessScore + language);
    const adaptive = ["adaptive_parent", "adaptive_teacher", "adaptive_counselor"].filter((id) => values[id] === true).length * 2;
    const economic = option("economic_status");
    return { graduation_score: graduation, preference_score: preferenceScore, balanced_score: balanced, service_score: service, discipline_score: discipline, competition_score: competition, fitness_score: fitnessScore, language_score: language, multiple_score: multiple, adaptive_score: adaptive, economic_score: economic, otherItemsTotal: graduation + preferenceScore + balanced + multiple + adaptive + economic };
  }

  if (rule.code === "hualien") {
    const balanced = Math.min(16, integerValue(values.balanced_qualified_domains) * 4);
    const discipline = values.no_minor_demerit === true ? 9 : 0;
    const cadre = values.cadre_qualified === true ? 9 : 0;
    const competition = records("competition_records", 15);
    const fitnessScore = fitness("fitness_result", 2, 9);
    const targetSchool = Math.min(15, Number(values.target_school_other_score) || 0);
    const multiple = Math.min(47, balanced + discipline + cadre + competition + fitnessScore + targetSchool);
    const lowIncome = values.low_income_status === true ? 3 : 0;
    return { adaptive_preference_score: preferenceScore, balanced_score: balanced, discipline_score: discipline, cadre_score: cadre, competition_score: competition, fitness_score: fitnessScore, target_school_other_score: targetSchool, multiple_score: multiple, low_income_score: lowIncome, otherItemsTotal: preferenceScore + multiple + lowIncome };
  }

  if (rule.code === "taitung") {
    const service = Math.min(12, integerValue(values.cadre_semesters) * 3 + (Array.isArray(values.service_hours_by_semester) ? values.service_hours_by_semester.reduce((sum, hours) => sum + Math.min(Number(hours) * .125, 3), 0) : 0));
    const reward = Math.min(15, integerValue(values.major_merit_count) * 4.5 + integerValue(values.minor_merit_count) * 1.5 + integerValue(values.commendation_count) * .5);
    const noPunishment = values.no_punishment === true ? 5 : 0;
    const balanced = Math.min(20, integerValue(values.balanced_qualified_domains) * 5);
    const fitnessScore = Math.min(6, integerValue(values.fitness_qualified_items) * 1.5);
    const multiple = Math.min(58, service + reward + noPunishment + balanced + fitnessScore);
    return { preference_score: preferenceScore, service_score: service, reward_score: reward, no_punishment_score: noPunishment, balanced_score: balanced, fitness_score: fitnessScore, multiple_score: multiple, otherItemsTotal: preferenceScore + multiple };
  }

  if (rule.code === "penghu") {
    const cadre = Math.min(3, integerValue(values.cadre_semesters));
    const rewards = Math.min(10, rewardInputScore(values.reward_score_inputs));
    const discipline = option("discipline_status");
    const service = Math.min(2, integerValue(values.school_service_semesters_20h) * .5 + Math.floor(Number(values.external_service_hours) / 20) * .5);
    const moralityService = Math.min(20, cadre + rewards + discipline + service);
    const balanced = Math.min(3, integerValue(values.balanced_qualified_domains));
    const competition = records("competition_records", 15);
    const fitnessScore = fitness("fitness_result", 2, 8, "pr50_items");
    const language = Math.min(8, sumScores(values.language_certificates));
    const multiple = Math.min(26, balanced + competition + fitnessScore + language);
    const other = Math.min(4, option("adaptive_plan_status") + (values.technical_arts_class === true ? 1 : 0) + Math.min(2, integerValue(values.club_semesters_20h) * .5));
    return { preference_score: preferenceScore, cadre_score: cadre, reward_score: rewards, discipline_score: discipline, service_score: service, morality_service_score: moralityService, balanced_score: balanced, competition_score: competition, fitness_score: fitnessScore, language_score: language, multiple_score: multiple, other_score: other, otherItemsTotal: preferenceScore + moralityService + multiple + other };
  }

  const graduation = values.graduation_qualified === true ? 3 : 0;
  const balanced = Math.min(8, integerValue(values.balanced_qualified_domains) * 2);
  const morality = option("morality_status");
  const service = Math.min(4, integerValue(values.cadre_semesters) * .5 + Math.floor(Number(values.service_hours) / 9) * .5);
  const competition = records("competition_records", 6);
  const fitnessScore = fitness("fitness_result", .5, 3);
  const nearby = values.nearby_eligibility === true ? 1 : 0;
  const weak = option("economic_status");
  return { graduation_score: graduation, preference_score: preferenceScore, balanced_score: balanced, morality_score: morality, service_score: service, competition_score: competition, fitness_score: fitnessScore, nearby_score: nearby, weak_score: weak, otherItemsTotal: graduation + preferenceScore + balanced + morality + service + competition + fitnessScore + nearby + weak };
}

function integerValue(value: unknown) { const number = Number(value); return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0; }

function selectedOptionScore(value: unknown, options?: readonly { value: unknown; score?: number | null }[]) {
  if (!Array.isArray(value)) return optionScore(value, options);
  return value.reduce((sum, selected) => sum + optionScore(selected, options), 0);
}

function optionScore(value: unknown, options?: readonly { value: unknown; score?: number | null }[]) {
  const option = options?.find((candidate) => String(candidate.value) === String(value));
  return typeof option?.score === "number" ? option.score : 0;
}

function optionValueScore(value: unknown, fieldId: string, fallback: number) {
  const options = [ilnResearch, hhmResearch, ylcResearch].map((data) => researchFieldOptions(data, fieldId)).find((candidate) => candidate.length > 0);
  return optionScore(value, options) || (value === undefined ? 0 : fallback && String(value) !== "none" ? fallback : 0);
}

function researchFieldOptions(data: unknown, fieldId: string): readonly { label: string; value: unknown; score?: number | null }[] {
  const fields = (data as { fields?: readonly ResearchField[] }).fields ?? [];
  return fields.find((field) => field.field_id === fieldId)?.options ?? [];
}

function enumScore(value: unknown, values: string[], scores: number[]) { const index = values.indexOf(String(value)); return index >= 0 ? scores[index] : 0; }
function sumScores(value: unknown) { return Array.isArray(value) ? value.reduce((sum, item) => sum + (typeof item === "object" && item ? Number((item as { score?: unknown }).score ?? 0) : Number(item) || 0), 0) : 0; }
function rewardInputScore(value: unknown) {
  if (Array.isArray(value)) return sumScores(value);
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  return integerValue(record.major) * 4.5 + integerValue(record.minor) * 1.5 + integerValue(record.commendation) * .5;
}

function legacyResearchValues(input: AdmissionScoreInput, district: AdmissionDistrict): Record<string, unknown> {
  const exam = input.exam ?? {};
  const base: Record<string, unknown> = district === "ct" ? {
    preference_choices: input.choiceList ?? [], nearby_eligibility: input.enrollmentDistrictStatus?.startsWith("CT") ? "ct_general" : "none", remote_school_three_years: Boolean(input.remoteAreaEligible), economic_weakness_status: input.economicStatus === "LOW_INCOME" ? "low_income" : input.economicStatus === "LOWER_MIDDLE_INCOME" ? "middle_low_income" : "none", balanced_health_pe_passed: Boolean(input.balancedLearning?.healthAndPE), balanced_arts_passed: Boolean(input.balancedLearning?.arts), balanced_integrated_passed: Boolean(input.balancedLearning?.integrativeActivities), balanced_technology_passed: Boolean(input.balancedLearning?.technology), club_participation_by_semester: Array.from({ length: input.clubEligibleSemesters ?? 0 }, (_, i) => `g7_s${(i % 2) + 1}`), service_hours_by_semester: input.serviceHoursBySemester, discipline_status: hasDiscipline(input.disciplineAfterCancellation) ? "other" : "no_record_including_cleared", major_merit_count: input.rewards?.majorMerits ?? 0, minor_merit_count: input.rewards?.minorMerits ?? 0, commendation_count: input.rewards?.commendations ?? 0,
  } : {
    preference_choices: input.choiceList ?? [], economic_weakness_status: "none", nearby_eligibility: "none", cadre_semesters: input.leadershipSemesters ?? 0, service_hours: input.serviceHours ?? 0, major_merit_count: input.rewards?.majorMerits ?? 0, minor_merit_count: input.rewards?.minorMerits ?? 0, commendation_count: input.rewards?.commendations ?? 0, no_discipline_record: !hasDiscipline(input.disciplineAfterCancellation), no_truancy_record: false, balanced_passing_domain_count_by_semester: [], excellent_club_semesters: [], competition_results: [], fitness_session_results: "no_score", exam_disposition: "normal",
  };
  return { ...base, chinese_exam_grade: exam.chineseGrade, math_exam_grade: exam.mathGrade, english_exam_grade: exam.englishGrade, social_exam_grade: exam.socialGrade, science_exam_grade: exam.scienceGrade, writing_grade: exam.writingLevel, exam_violation_points: exam.violationPoints ?? 0 };
}

function calculateResearchCt(values: Record<string, unknown>, preferenceScore: number) {
  const balanced = ["balanced_health_pe_passed", "balanced_arts_passed", "balanced_integrated_passed", "balanced_technology_passed"].filter((key) => values[key]).length * 3;
  const club = Math.min(2, Array.isArray(values.club_participation_by_semester) ? values.club_participation_by_semester.length : 0);
  const service = Math.min(3, Array.isArray(values.service_hours_by_semester) ? values.service_hours_by_semester.filter((hours) => Number(hours) >= 6).length : 0);
  const discipline = values.discipline_status === "no_record_including_cleared" ? 6 : values.discipline_status === "after_clearing_no_minor_or_above" ? 3 : 0;
  const reward = Math.min(4, Number(values.major_merit_count) * 3 + Number(values.minor_merit_count) + Number(values.commendation_count) * 0.5);
  const disadvantaged = (values.remote_school_three_years ? 1 : 0) + (values.economic_weakness_status === "low_income" ? 2 : values.economic_weakness_status === "middle_low_income" ? 1 : 0);
  const multiple_learning_score = balanced + club + service + discipline + reward;
  const nearby = values.nearby_eligibility === "none" ? 0 : 10;
  const disadvantagedScore = Math.min(3, disadvantaged);
  return { preference: preferenceScore, preference_score: preferenceScore, nearby, nearby_score: nearby, disadvantaged: disadvantagedScore, disadvantaged_score: disadvantagedScore, balanced_learning_score: balanced, club_score: club, service_score: service, discipline_score: discipline, reward_score: reward, multiple_learning: multiple_learning_score, multiple_learning_score, otherItemsTotal: preferenceScore + nearby + disadvantagedScore + multiple_learning_score };
}

function calculateResearchChc(values: Record<string, unknown>, preferenceScore: number) {
  const service = Math.min(8, Number(values.cadre_semesters) * 2 + Math.floor(Number(values.service_hours)) * 0.1);
  const reward = Math.min(6, Number(values.major_merit_count) * 4.5 + Number(values.minor_merit_count) * 1.5 + Number(values.commendation_count) * 0.5);
  const character = Math.min(20, service + reward + (values.no_discipline_record ? 6 : 0) + (values.no_truancy_record ? 2 : 0));
  const balancedValues = Array.isArray(values.balanced_passing_domain_count_by_semester) ? values.balanced_passing_domain_count_by_semester as unknown[] : Object.values((values.balanced_passing_domain_count_by_semester as Record<string, unknown>) || {});
  const balanced = balancedValues.filter((value) => Number(value) >= 3).length;
  const balancedScore = balanced >= 5 ? 6 : balanced === 4 ? 4 : balanced === 3 ? 2 : 0;
  const club = Math.min(4, Array.isArray(values.excellent_club_semesters) ? values.excellent_club_semesters.length : 0);
  const fitnessValue = values.fitness_session_results as Record<string, unknown> | string;
  const fitnessScores: number[] = typeof fitnessValue === "object" && fitnessValue ? Object.values(fitnessValue).map((value) => ["bronze_or_above", "approved_exemption_bronze"].includes(String(value)) ? 2 : ["medium_or_needs_improvement", "approved_exemption_needs_improvement"].includes(String(value)) ? 1 : 0).sort((a, b) => b - a).slice(0, 3) : [];
  const fitness = fitnessScores.reduce((a, b) => a + b, 0);
  const competition = calculateChanghuaCompetition(values.competition_results);
  const excellent = Math.min(16, balancedScore + club + competition + fitness);
  const identity = (values.economic_weakness_status === "low_income" ? 2 : values.economic_weakness_status === "middle_low_income" ? 1 : 0) + (values.nearby_eligibility === "none" ? 0 : 7);
  return { preference: preferenceScore, preference_score: preferenceScore, identity, identity_score: identity, character_service: character, character_service_score: character, service_learning_score: service, reward_score: reward, excellent_performance: excellent, excellent_performance_score: excellent, balanced_learning_score: balancedScore, club_score: club, competition_score: competition, fitness_score: fitness, otherItemsTotal: preferenceScore + identity + character + excellent };
}

function validateChanghuaStructuredFields(values: Record<string, unknown>) {
  const missing: string[] = [];
  const fitness = values.fitness_session_results;
  if (fitness && typeof fitness === "object") {
    for (const key of ["test_date", "flexibility", "muscular_endurance", "explosive_power", "cardiorespiratory"]) if (!(key in fitness)) missing.push(`fitness_session_results.${key}`);
  }
  const records = values.competition_results;
  if (Array.isArray(records)) for (const [index, record] of records.entries()) {
    if (!record || typeof record !== "object") { missing.push(`competition_results[${index}]`); continue; }
    for (const key of ["catalog_id", "rank", "participant_count", "result_date", "proof_submission_date"]) if (!(key in record) || (record as Record<string, unknown>)[key] === "") missing.push(`competition_results[${index}].${key}`);
    const item = record as { catalog_id?: string; rank?: string; participant_count?: number; result_date?: string; proof_submission_date?: string };
    if (!CHANGHUA_COMPETITION_CATALOG.some((catalogItem) => catalogItem.id === item.catalog_id)) missing.push(`competition_results[${index}].catalog_id:not_in_official_catalog`);
    if (!["first", "second", "third", "other_official_award"].includes(String(item.rank))) missing.push(`competition_results[${index}].rank`);
    if (!Number.isInteger(item.participant_count) || Number(item.participant_count) < 1) missing.push(`competition_results[${index}].participant_count`);
    if (String(item.result_date ?? "") > "2026-04-24") missing.push(`competition_results[${index}].result_date:after_deadline`);
    if (String(item.proof_submission_date ?? "") > "2026-05-01") missing.push(`competition_results[${index}].proof_submission_date:after_deadline`);
  }
  return missing;
}

function calculateChanghuaCompetition(value: unknown) {
  if (!Array.isArray(value)) return 0;
  const catalog = new Map(CHANGHUA_COMPETITION_CATALOG.map((item) => [item.id, item.level]));
  const scoreMap: Record<string, Record<string, number>> = { international: { first: 6, second: 5, third: 4, other_official_award: 3 }, national: { first: 5, second: 4, third: 3, other_official_award: 2 }, county: { first: 4, second: 3, third: 2, other_official_award: 1 } };
  const seen = new Set<string>();
  return Math.min(6, value.reduce((sum, raw) => {
    if (!raw || typeof raw !== "object") return sum;
    const record = raw as { catalog_id?: string; award_id?: string; level?: string; rank?: string; participant_count?: number };
    const id = `${record.catalog_id}:${record.award_id ?? record.rank}`;
    if (!record.catalog_id || seen.has(id) || !catalog.has(record.catalog_id)) return sum;
    seen.add(id);
    const level = catalog.get(record.catalog_id) ?? record.level ?? "";
    const score = scoreMap[level]?.[record.rank ?? ""] ?? 0;
    return sum + score * (Number(record.participant_count) >= 4 ? 0.5 : 1);
  }, 0));
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

  if (district === "taoyuan-lienchiang") return calculateLegacyTaoyuanItems(input, preferenceScore);

  const manualPreferenceScore = Math.min(30, nonNegative(input.manualCategoryScores?.preferenceScore));
  const multipleLearningScore = Math.min(40, nonNegative(input.manualCategoryScores?.multipleLearningScore));
  return itemResult({ preferenceScore: manualPreferenceScore, multipleLearningScore, otherItemsTotal: manualPreferenceScore + multipleLearningScore });
}

function calculateLegacyTaoyuanItems(input: AdmissionScoreInput, preferenceScore: number) {
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

function calculateExam(district: AdmissionDistrict, examInput: AdmissionScoreInput["exam"] = {}, manualCategoryScores?: AdmissionScoreInput["manualCategoryScores"]) {
  const grades = [examInput.chineseGrade, examInput.mathGrade, examInput.englishGrade, examInput.socialGrade, examInput.scienceGrade];
  const scoreMap = district === "tp" || district === "tainan" ? GRADE_RANK_MAP : EXAM_SCORE_MAP;
  const examAcademicScore = grades.reduce((sum, grade) => sum + (grade ? scoreMap[grade] : 0), 0);
  const writingScore = calculateWritingScore(district, examInput.writingLevel);
  const examMax = ADMISSION_RULES[district].categories.find((item) => item.key === "examPerformanceScore")?.max ?? ADMISSION_RULES[district].categories.find((item) => item.key === "exam")?.max ?? 0;
  const examPerformanceScore = district !== "tp" && district !== "ct" && district !== "tainan" && district !== "kaohsiung" && district !== "taoyuan-lienchiang"
    ? Math.min(examMax, nonNegative(manualCategoryScores?.examPerformanceScore))
    : Math.min(examMax, roundToTenth(examAcademicScore + writingScore));
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

export function assignPreferenceSequences(choices: Array<{ schoolId: string; departmentId?: string; vocationalClusterId?: string }>, district: AdmissionDistrict = "ct") {
  let currentSequence = 0;
  let previousSchoolId: string | null = null;
  let previousVocationalClusterId: string | null = null;
  let schoolsInTainanGroup = 0;
  return choices.map((choice) => {
    const isNewSchool = choice.schoolId !== previousSchoolId || (district === "changhua" && choice.vocationalClusterId !== previousVocationalClusterId);
    if (district === "tainan") {
      if (isNewSchool) {
        schoolsInTainanGroup += 1;
        if (schoolsInTainanGroup > 3) { currentSequence += 1; schoolsInTainanGroup = 1; }
        if (currentSequence === 0) currentSequence = 1;
      }
    } else if (isNewSchool) currentSequence += 1;
    previousSchoolId = choice.schoolId;
    previousVocationalClusterId = choice.vocationalClusterId ?? null;
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
