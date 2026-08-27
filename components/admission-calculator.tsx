"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHANGHUA_COMPETITION_CATALOG, getAdmissionRule, isAdmissionDistrict, resolveAdmissionMissingFieldLabels, type AdmissionDistrict, type AdmissionRule } from "@/lib/admission-score";
import { readStoredDistrict } from "@/lib/district-context";
import { markProgress } from "@/lib/progress";
import { schoolDirectory } from "@/lib/school-directory";

const subjects = [["chineseGrade", "國文"], ["mathGrade", "數學"], ["englishGrade", "英語"], ["socialGrade", "社會"], ["scienceGrade", "自然"]] as const;
const grades = ["A++", "A+", "A", "B++", "B+", "B", "C"] as const;
const steps = [["context", "1", "確認區域"], ["exam", "2", "輸入會考"], ["criteria", "3", "輸入志願序與必要比序項目"], ["result", "4", "查看結果"]] as const;
const districtOptions: readonly { code: AdmissionDistrict; label: string }[] = [
  { code: "tp", label: "基北區" }, { code: "ct", label: "中投區" }, { code: "ilan", label: "宜蘭區" },
  { code: "taoyuan-lienchiang", label: "桃連區" }, { code: "hsinchu-miaoli", label: "竹苗區" }, { code: "changhua", label: "彰化區" },
  { code: "yunlin", label: "雲林區" }, { code: "chiayi", label: "嘉義區" }, { code: "tainan", label: "臺南區" },
  { code: "kaohsiung", label: "高雄區" }, { code: "pingtung", label: "屏東區" }, { code: "hualien", label: "花蓮區" },
  { code: "taitung", label: "臺東區" }, { code: "penghu", label: "澎湖區" }, { code: "kinmen", label: "金門區" },
];

type ExamState = Record<(typeof subjects)[number][0], string>;
type StepId = (typeof steps)[number][0];
type ExamStateKey = keyof ExamState;
type CriteriaState = {
  choiceText: string;
  nearbyEligible: boolean;
  remoteAreaEligible: boolean;
  economicStatus: string;
  balanced: Record<string, boolean>;
  clubSemesters: string;
  serviceHoursBySemester: string;
  serviceHoursByYear: string;
  serviceHours: string;
  leadershipSemesters: string;
  fitnessQualifiedItems: string;
  fitnessScore: string;
  fitnessTier: string;
  fitnessExempt: boolean;
  certificationScore: string;
  contestScore: string;
  languageCertified: boolean;
  graduationEligible: boolean;
  careerGoalMatches: boolean;
  warnings: string;
  minorDemerits: string;
  majorDemerits: string;
  majorMerits: string;
  minorMerits: string;
  commendations: string;
  manualPreferenceScore: string;
  manualMultipleLearningScore: string;
  manualExamScore: string;
};

type ScoreResult = {
  totalScore: number | null;
  status?: "complete" | "incomplete";
  missingFields?: string[];
  otherItems: Record<string, number>;
  exam: { examPerformanceScore: number; examTotalPoints: number; writingScore: number };
  rule: AdmissionRule;
};
type AdmissionFormField = NonNullable<AdmissionRule["fields"]>[number];
type AdmissionOption = NonNullable<AdmissionFormField["options"]>[number];

const emptyExam: ExamState = Object.fromEntries(subjects.map(([key]) => [key, ""])) as ExamState;
const defaultCriteria: CriteriaState = {
  choiceText: "", nearbyEligible: false, remoteAreaEligible: false, economicStatus: "NONE",
  balanced: { healthAndPE: false, arts: false, integrativeActivities: false, technology: false },
  clubSemesters: "0", serviceHoursBySemester: "0, 0, 0", serviceHoursByYear: "0, 0, 0", serviceHours: "0",
  leadershipSemesters: "0", fitnessQualifiedItems: "0", fitnessScore: "0", fitnessTier: "", fitnessExempt: false,
  certificationScore: "0", contestScore: "0", languageCertified: false, graduationEligible: false, careerGoalMatches: false,
  warnings: "0", minorDemerits: "0", majorDemerits: "0", majorMerits: "0", minorMerits: "0", commendations: "0",
  manualPreferenceScore: "0", manualMultipleLearningScore: "0", manualExamScore: "0",
};

export function AdmissionCalculator({ initialDistrict, isMember }: { initialDistrict?: string; isMember: boolean }) {
  const requestedDistrict = initialDistrict && isAdmissionDistrict(initialDistrict) ? initialDistrict : undefined;
  const [district, setDistrict] = useState<AdmissionDistrict>(requestedDistrict || "ct");
  const districtInitialized = useRef(Boolean(requestedDistrict));
  const [academicYear, setAcademicYear] = useState("115");
  const [step, setStep] = useState<StepId>("context");
  const [exam, setExam] = useState<ExamState>(emptyExam);
  const [writingLevel, setWritingLevel] = useState("");
  const [criteria, setCriteria] = useState<CriteriaState>(defaultCriteria);
  const [ruleValues, setRuleValues] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [status, setStatus] = useState("");
  const rule = getAdmissionRule(district);

  useEffect(() => {
    if (requestedDistrict && requestedDistrict !== district) {
      const timer = window.setTimeout(() => setDistrict(requestedDistrict), 0);
      districtInitialized.current = true;
      return () => window.clearTimeout(timer);
    }
    if (!districtInitialized.current) {
      districtInitialized.current = true;
      const storedDistrict = readStoredDistrict();
      if (isAdmissionDistrict(storedDistrict)) {
        const timer = window.setTimeout(() => setDistrict(storedDistrict), 0);
        return () => window.clearTimeout(timer);
      }
    }
    markProgress("district", district);
  }, [district, requestedDistrict]);

  const missing = useMemo(() => {
    const fields: string[] = [];
    if (academicYear !== "115") fields.push("目前只有 115 學年度規則");
    subjects.forEach(([key, label]) => { if (!exam[key]) fields.push(`${label}會考標示`); });
    if (writingLevel === "" || Number(writingLevel) < 0 || Number(writingLevel) > 6) fields.push("作文級分（0–6）");
    return fields;
  }, [academicYear, exam, writingLevel]);

  function updateCriteria<Key extends keyof CriteriaState>(key: Key, value: CriteriaState[Key]) {
    setCriteria((current) => ({ ...current, [key]: value }));
  }

  async function calculate() {
    if (missing.some((item) => item.includes("會考") || item.includes("作文"))) {
      setStatus("先補齊五科會考與作文級分，才能產生可解釋的結果。");
      setStep("exam");
      return;
    }
    setStatus("正在依規則計算…");
    const choiceList = criteria.choiceText.split(/[\s,、，]+/).filter(Boolean).map((value) => {
      const [schoolId, departmentId] = value.split(/[:/]/);
      return { schoolId, ...(departmentId ? { departmentId } : {}) };
    });
    const numberList = (value: string) => value.split(/[\s,、，]+/).map(Number).filter(Number.isFinite);
    const enrollmentStatus = district === "ct" ? "CT_MAIN_DISTRICT" : district === "tainan" ? "TAINAN_MAIN_DISTRICT" : district === "taoyuan-lienchiang" ? "TL_MAIN_DISTRICT" : "OTHER";
    const response = await fetch("/api/admission/calculate", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        district, choiceList,
        enrollmentDistrictStatus: criteria.nearbyEligible ? enrollmentStatus : "OTHER",
        remoteAreaEligible: criteria.remoteAreaEligible,
        economicStatus: criteria.economicStatus,
        balancedLearning: criteria.balanced,
        clubEligibleSemesters: Number(criteria.clubSemesters) || 0,
        serviceHoursBySemester: numberList(criteria.serviceHoursBySemester),
        serviceHoursByYear: numberList(criteria.serviceHoursByYear),
        serviceHours: Number(criteria.serviceHours) || 0,
        leadershipSemesters: Number(criteria.leadershipSemesters) || 0,
        fitnessQualifiedItems: Number(criteria.fitnessQualifiedItems) || 0,
        fitnessScore: Number(criteria.fitnessScore) || 0,
        fitnessTier: criteria.fitnessTier,
        fitnessExempt: criteria.fitnessExempt,
        certificationScore: Number(criteria.certificationScore) || 0,
        contestScore: Number(criteria.contestScore) || 0,
        languageCertified: criteria.languageCertified,
        graduationEligible: criteria.graduationEligible,
        careerGoalMatches: criteria.careerGoalMatches,
        disciplineAfterCancellation: { warnings: Number(criteria.warnings) || 0, minorDemerits: Number(criteria.minorDemerits) || 0, majorDemerits: Number(criteria.majorDemerits) || 0 },
        rewards: { majorMerits: Number(criteria.majorMerits) || 0, minorMerits: Number(criteria.minorMerits) || 0, commendations: Number(criteria.commendations) || 0 },
        manualCategoryScores: { preferenceScore: Number(criteria.manualPreferenceScore) || 0, multipleLearningScore: Number(criteria.manualMultipleLearningScore) || 0, examPerformanceScore: Number(criteria.manualExamScore) || 0 },
        exam: { ...exam, writingLevel: Number(writingLevel) },
        ruleValues: rule.sourceId ? { ...ruleValues, preference_choices: choiceList, chinese_exam_grade: exam.chineseGrade || undefined, math_exam_grade: exam.mathGrade || undefined, english_exam_grade: exam.englishGrade || undefined, social_exam_grade: exam.socialGrade || undefined, science_exam_grade: exam.scienceGrade || undefined, chinese_exam_level: exam.chineseGrade || undefined, math_exam_level: exam.mathGrade || undefined, english_exam_level: exam.englishGrade || undefined, social_exam_level: exam.socialGrade || undefined, science_exam_level: exam.scienceGrade || undefined, exam_full_marks: subjects.map(([key]) => exam[key]).filter(Boolean), writing_grade: writingLevel === "" ? undefined : Number(writingLevel) } : undefined,
      }),
    }).catch(() => null);
    const payload = (await response?.json().catch(() => ({})) ?? {}) as { result?: ScoreResult; error?: string };
    setResult(payload.result || null);
    setStatus(response?.ok ? `已依 115 學年度${rule.label}規則完成試算。` : payload.error || "試算失敗，請稍後重試。");
    if (response?.ok && payload.result) {
      const snapshot = { savedAt: new Date().toISOString(), district, academicYear, result: payload.result };
      const history = readScoreHistory();
      if (!isMember) {
        window.localStorage.setItem("jshs_score_latest", JSON.stringify(snapshot));
        window.localStorage.setItem("jshs_score_history", JSON.stringify([snapshot, ...history].slice(0, 20)));
      }
      markProgress("calculator", district);
      setStep("result");
    }
  }

  function nextStep() { if (step === "criteria") { void calculate(); return; } setStep(steps[Math.min(steps.findIndex(([id]) => id === step) + 1, steps.length - 1)][0]); }
  const stepNumber = steps.findIndex(([id]) => id === step) + 1;

  return <>
    <section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">試算工具中心 · 目前位於第 {stepNumber} 步／共 4 步 · {rule.label}</p><h1 className="mt-3 max-w-4xl">每一項輸入，都說清楚它怎麼影響分數。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">先確認適用規則，再輸入會考、志願與多元表現。這是規則試算，不是錄取保證；正式送出前請回到當年度官方簡章核對。</p></div></section>
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-6 md:py-8"><nav aria-label="試算步驟" className="grid grid-cols-2 gap-2 md:grid-cols-4">{steps.map(([id, number, label]) => <button key={id} type="button" onClick={() => setStep(id)} className={`flex items-center gap-3 p-3 text-left text-sm jshs-button ${step === id ? "jshs-button-primary" : "jshs-button-secondary"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 font-black">{number}</span><span>{label}</span></button>)}</nav></section>
    <section className="mx-auto grid w-[min(1120px,calc(100%-32px))] gap-5 pb-12 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="p-5 md:p-7 jshs-surface-card admission-rule-form">
      {step === "context" ? <ContextStep district={district} academicYear={academicYear} rule={rule} onDistrictChange={(value) => { setDistrict(value); setRuleValues({}); setResult(null); setStatus(""); }} onYearChange={setAcademicYear} /> : null}
      {step === "exam" ? <ExamStep district={district} exam={exam} writingLevel={writingLevel} onExamChange={(key, value) => setExam((current) => ({ ...current, [key]: value }))} onWritingChange={setWritingLevel} /> : null}
      {step === "criteria" ? <CriteriaStep district={district} rule={rule} criteria={criteria} updateCriteria={updateCriteria} ruleValues={ruleValues} setRuleValues={setRuleValues} /> : null}
      {step === "result" ? <ResultStep result={result} status={status} missing={missing} rule={rule} /> : null}
      {step !== "result" ? <p className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy"><strong className="text-[var(--jshs-primary)]">這一步會影響什麼？</strong> {step === "context" ? "它決定套用哪一套年度規則；五個就學區不能混算。" : step === "exam" ? "會考五科與作文會進入本區的總分或同分比序。" : "這些欄位會進入志願序、就近入學、多元學習或弱勢身分的計算；必填資料未完成時，系統會提醒你補齊，避免誤算。"}</p> : null}
      <div className="mt-7 flex flex-wrap justify-between gap-3"><button type="button" disabled={step === "context"} onClick={() => setStep(steps[Math.max(steps.findIndex(([id]) => id === step) - 1, 0)][0])} className="px-4 py-3 text-sm jshs-button-secondary">← 上一步</button><button type="button" onClick={() => step === "result" ? setStep("criteria") : nextStep()} className="px-5 py-3 text-sm jshs-button-primary">{step === "criteria" ? "產生個人積分摘要" : step === "result" ? "重新檢查資料" : "下一步 →"}</button></div>
    </div><RuleAside rule={rule} missing={result?.missingFields ?? missing} /></section>
  </>;
}

function readScoreHistory() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem("jshs_score_history") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ContextStep({ district, academicYear, rule, onDistrictChange, onYearChange }: { district: AdmissionDistrict; academicYear: string; rule: AdmissionRule; onDistrictChange: (value: AdmissionDistrict) => void; onYearChange: (value: string) => void }) {
  return <div><p className="jshs-eyebrow">先做這件事</p><h2 className="mt-2">確認就學區與學年度</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">每區的滿分、志願序、多元表現與會考折算都不一樣。這裡先把規則邊界固定下來。</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => onDistrictChange(event.target.value as AdmissionDistrict)}>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select><small className="font-normal leading-5 jshs-muted-copy">目前 15 個就學區都可進入試算流程。</small></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">學年度<select value={academicYear} onChange={(event) => onYearChange(event.target.value)}><option value="115">115 學年度</option><option value="114">114 學年度（不可試算）</option></select><small className="font-normal leading-5 jshs-muted-copy">結果會固定標示使用的年度。</small></label></div><RuleGuide rule={rule} /></div>;
}

function ExamStep({ district, exam, writingLevel, onExamChange, onWritingChange }: { district: AdmissionDistrict; exam: ExamState; writingLevel: string; onExamChange: (key: ExamStateKey, value: string) => void; onWritingChange: (value: string) => void }) {
  const writingNote = district === "kaohsiung" || district === "ct" ? "不加進第一階段總分，但會進入本區同分比序。" : "會依本區級分表折算進入會考表現。";
  return <div><p className="jshs-eyebrow">使用者輸入</p><h2 className="mt-2">輸入會考各科等級／標示</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">A++、A+、A、B++、B+、B、C 會依選定的 {districtOptions.find((item) => item.code === district)?.label} 規則折算；加號在部分區域只用於同分比序。</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{subjects.map(([key, label]) => <label key={key} className="admission-field-group grid gap-2 text-sm font-black text-[var(--jshs-primary)]"><span className="admission-field-label">{label}</span><select value={exam[key]} onChange={(event) => onExamChange(key, event.target.value)}><option value="">尚未填寫</option>{grades.map((grade) => <option key={grade}>{grade}</option>)}</select><small className="admission-field-helper">{exam[key] ? `${label}：${exam[key]}，會進入會考表現與本區同分比序資料。` : `尚缺${label}資料。`}</small></label>)}<label className="admission-field-group grid gap-2 text-sm font-black text-[var(--jshs-primary)]"><span className="admission-field-label">作文級分</span><select value={writingLevel} onChange={(event) => onWritingChange(event.target.value)}><option value="">尚未填寫</option>{Array.from({ length: 7 }, (_, value) => <option key={value} value={value}>{value} 級分</option>)}</select><small className="admission-field-helper">{writingNote}</small></label></div></div>;
}

function CriteriaStep({ district, rule, criteria, updateCriteria, ruleValues, setRuleValues }: { district: AdmissionDistrict; rule: AdmissionRule; criteria: CriteriaState; updateCriteria: <Key extends keyof CriteriaState>(key: Key, value: CriteriaState[Key]) => void; ruleValues: Record<string, unknown>; setRuleValues: (value: Record<string, unknown>) => void }) {
  const setBalanced = (key: string, value: boolean) => updateCriteria("balanced", { ...criteria.balanced, [key]: value });
  return <div><p className="jshs-eyebrow">比序補充</p><h2 className="mt-2">補上會影響結果的資料</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">欄位依本區 115 學年度規則整理；請輸入實際狀況，不要直接填換算後分數。</p>{rule.sourceId ? <ResearchRuleForm rule={rule} values={ruleValues} onChange={(key, value) => setRuleValues({ ...ruleValues, [key]: value })} /> : <><label className="admission-field-group mt-6 grid gap-2 text-sm font-black text-[var(--jshs-primary)]"><span className="admission-field-label">志願序（可稍後填寫）</span><input value={criteria.choiceText} onChange={(event) => updateCriteria("choiceText", event.target.value)} placeholder="可先留白，之後在我的志願排序" /></label><div className="mt-7">{renderDistrictFields(district, criteria, updateCriteria, setBalanced)}</div></>}<p className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-xs leading-6 jshs-muted-copy">本區總分：{rule.totalScore} 分。所有輸入只做規則試算，不等於正式審查認定。</p></div>;
}

function ResearchRuleForm({ rule, values, onChange }: { rule: AdmissionRule; values: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const fields = (rule.fields ?? []).filter((field) => field.input_type !== "calculated" && !field.field_id.includes("exam_grade") && !field.field_id.includes("exam_level") && field.field_id !== "writing_grade");
  const groups = [...new Set(fields.map((field) => field.category || "其他資料"))].map((category) => ({ category, fields: fields.filter((field) => (field.category || "其他資料") === category) }));
  return <div className="mt-6 grid gap-4">{groups.map(({ category, fields: categoryFields }) => { const cap = rule.categories.find((item) => item.label === category)?.max; const subgroups = [...new Set(categoryFields.map((field) => field.subcategory || "一般項目"))].map((subcategory) => ({ subcategory, fields: categoryFields.filter((field) => (field.subcategory || "一般項目") === subcategory) })); return <AdmissionSection key={category} title={category} cap={cap}>{subgroups.map(({ subcategory, fields: subgroupFields }) => <div key={subcategory} className="admission-subsection"><h4>{subcategory}</h4><div className="grid gap-4">{subgroupFields.map((field) => <AdmissionField key={field.field_id} field={field} value={values[field.field_id]} onChange={onChange} />)}</div></div>)}</AdmissionSection>; })}</div>;
}

function AdmissionSection({ title, cap, children }: { title: string; cap?: number; children: React.ReactNode }) { return <details className="admission-section" open><summary><span>{title}</span>{cap === undefined ? null : <span className="admission-section-cap">最高 {cap} 分</span>}</summary><div className="admission-section-body">{children}</div></details>; }
function LightbulbIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 16 14c-.7.5-1 1.3-1 2H9.5c0-.7-.3-1.1-1-1.5Z" /><path d="M9 10h.01M12 8v4M15 10h.01" /></svg>; }
function RuleHelpPopover({ field }: { field: AdmissionFormField }) { const details = [field.official_rule, field.conditions?.length ? `符合條件：${field.conditions.join("；")}` : "", field.adopted_period ? `採計期間：${field.adopted_period}` : "", field.score_cap !== undefined ? `最高採計：${field.score_cap} 分` : "", field.evidence_description ? `需要證明：${field.evidence_description}` : ""].filter(Boolean); return <details className="admission-rule-help"><summary aria-label="查看規則說明"><LightbulbIcon /></summary><div className="admission-rule-popover"><strong>規則說明</strong><p>{field.helper_text || "此細節目前研究資料尚未確認。"}</p>{details.map((detail) => <p key={detail}>{detail}</p>)}<small>官方資料依據：115 學年度本區免試入學規則資料</small></div></details>; }
function AdmissionField({ field, value, onChange }: { field: AdmissionFormField; value: unknown; onChange: (key: string, value: unknown) => void }) { const helper = field.helper_text || "此細節目前研究資料尚未確認。"; if (field.field_id === "preference_choices") return <PreferenceList value={value} onChange={onChange} field={field} />; if (field.field_id === "competition_results") return <CompetitionField value={value} onChange={onChange} helper={helper} />; if (field.field_id === "fitness_session_results") return <FitnessField value={value} onChange={onChange} helper={helper} options={field.options ?? []} />; if (field.field_id === "service_hours_by_semester") return <SemesterSelector value={value} onChange={onChange} field={field} />; if (["number", "integer", "decimal", "hours", "count"].includes(field.input_type)) return <div className="admission-field-row"><div className="admission-field-heading"><span className="admission-field-label">{field.label}</span><RuleHelpPopover field={field} /></div><input type="text" inputMode="decimal" value={value === undefined ? "" : String(value)} min={field.validation?.min} max={field.validation?.max} onChange={(event) => onChange(field.field_id, event.target.value === "" ? undefined : Number(event.target.value))} /><small className="admission-field-short-help">{helper}</small></div>; const options: readonly AdmissionOption[] = field.options?.length ? field.options : field.input_type === "semester_count" ? Array.from({ length: Math.min(10, (field.score_cap ?? 6) + 2) }, (_, index) => ({ label: index === 9 ? "9次以上" : `${index}學期`, value: index })) : []; const selected = Array.isArray(value) ? value : []; return <div className="admission-field-row"><div className="admission-field-heading"><span className="admission-field-label">{field.label}</span><RuleHelpPopover field={field} /></div>{field.input_type === "multi_select" ? <div className="grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={String(option.value)} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.some((item) => String(item) === String(option.value))} onChange={(event) => onChange(field.field_id, event.target.checked ? [...selected, option.value] : selected.filter((item) => String(item) !== String(option.value)))} />{option.label}</label>)}</div> : field.input_type === "boolean" ? <select value={value === undefined ? "" : String(value)} onChange={(event) => onChange(field.field_id, event.target.value === "true" ? true : event.target.value === "false" ? false : undefined)}><option value="">請選擇</option><option value="true">符合</option><option value="false">不符合</option><option value="unknown">不確定</option></select> : <select value={value === undefined ? "" : String(value)} onChange={(event) => onChange(field.field_id, options.find((option) => String(option.value) === event.target.value)?.value ?? event.target.value)}><option value="">請選擇</option>{options.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}</select>}<small className="admission-field-short-help">{helper}</small></div>; }
function SemesterSelector({ value, onChange, field }: { value: unknown; onChange: (key: string, value: unknown) => void; field: AdmissionFormField }) { const periods = ["七上", "七下", "八上", "八下", "九上"]; const selected = Array.isArray(value) ? value : []; return <div className="admission-field-row"><div className="admission-field-heading"><span className="admission-field-label">{field.label}</span><RuleHelpPopover field={field} /></div><div className="grid gap-2 sm:grid-cols-2">{periods.map((period, index) => <label key={period} className="admission-semester-row"><span>{period}</span><select value={String(selected[index] ?? "")} onChange={(event) => onChange(field.field_id, periods.map((_, i) => i === index ? Number(event.target.value) : Number(selected[i] ?? 0)))}><option value="">未達標</option><option value="0">未達 6 小時</option><option value="6">6 小時以上</option><option value="12">12 小時以上</option></select></label>)}</div><small className="admission-field-short-help">每學期達標才計分；{field.score_cap ? `最高採計 ${field.score_cap} 分` : "請依官方規則核對"}</small></div>; }
function PreferenceList({ value, onChange, field }: { value: unknown; onChange: (key: string, value: unknown) => void; field: AdmissionFormField }) { const choices = Array.isArray(value) ? value as Array<{ schoolId: string; departmentId?: string }> : []; const schools = schoolDirectory.filter((school) => school.districtCode === "ct" || school.districtCode === "changhua"); const add = () => onChange(field.field_id, [...choices, { schoolId: "" }]); return <div className="admission-field-row"><div className="admission-field-heading"><span className="admission-field-label">志願清單</span><RuleHelpPopover field={field} /></div><div className="grid gap-2">{choices.map((choice, index) => { const school = schools.find((item) => item.code === choice.schoolId); return <div className="preference-row" key={`${choice.schoolId}-${index}`}><strong>{index + 1}</strong><select value={choice.schoolId} onChange={(event) => onChange(field.field_id, choices.map((item, i) => i === index ? { ...item, schoolId: event.target.value, departmentId: undefined } : item))}><option value="">選擇學校</option>{schools.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select>{school?.departments.length ? <select aria-label="選擇科別" value={choice.departmentId || ""} onChange={(event) => onChange(field.field_id, choices.map((item, i) => i === index ? { ...item, departmentId: event.target.value || undefined } : item))}><option value="">選擇科別</option>{school.departments.map((department) => <option key={department.name} value={department.name}>{department.name}</option>)}</select> : null}<button type="button" onClick={() => onChange(field.field_id, choices.filter((_, i) => i !== index))}>刪除</button></div>; })}</div><button type="button" className="mt-3 px-3 py-2 text-sm jshs-button-secondary" onClick={add}>＋新增志願</button><small className="admission-field-short-help">同校不同科連續選填會由系統自動視為同一志願序。</small></div>; }

function CompetitionField({ value, onChange, helper }: { value: unknown; onChange: (key: string, value: unknown) => void; helper: string }) {
  const records = Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
  const update = (index: number, key: string, next: unknown) => onChange("competition_results", records.map((record, recordIndex) => recordIndex === index ? { ...record, [key]: next } : record));
  return <fieldset className="rounded-2xl border border-[var(--jshs-border)] p-4"><legend className="px-1 text-sm font-black text-[var(--jshs-primary)]">符合採計清單的競賽得獎紀錄</legend><p className="mb-4 text-xs leading-5 jshs-muted-copy">{helper}</p>{records.map((record, index) => <div key={index} className="mb-4 grid gap-3 rounded-xl bg-[var(--jshs-muted-surface)] p-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-bold">官方競賽<select value={String(record.catalog_id ?? "")} onChange={(event) => update(index, "catalog_id", event.target.value)}><option value="">請選擇</option>{CHANGHUA_COMPETITION_CATALOG.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="grid gap-1 text-xs font-bold">名次<select value={String(record.rank ?? "")} onChange={(event) => update(index, "rank", event.target.value)}><option value="">請選擇</option><option value="first">第1名</option><option value="second">第2名</option><option value="third">第3名</option><option value="other_official_award">其他正式獎次</option></select></label><label className="grid gap-1 text-xs font-bold">參賽人數<select value={String(record.participant_count ?? "")} onChange={(event) => update(index, "participant_count", Number(event.target.value))}><option value="">請選擇</option>{Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} 人</option>)}<option value="20">20 人以上</option></select></label><label className="grid gap-1 text-xs font-bold">成績公布日<input type="date" value={String(record.result_date ?? "")} onChange={(event) => update(index, "result_date", event.target.value)} /></label><label className="grid gap-1 text-xs font-bold">證明繳交日<input type="date" value={String(record.proof_submission_date ?? "")} onChange={(event) => update(index, "proof_submission_date", event.target.value)} /></label><button type="button" className="text-left text-xs font-black text-red-700" onClick={() => onChange("competition_results", records.filter((_, recordIndex) => recordIndex !== index))}>移除這筆</button></div>)}<button type="button" className="px-3 py-2 text-xs jshs-button-secondary" onClick={() => onChange("competition_results", [...records, { catalog_id: "", level: "", rank: "", participant_count: 1, result_date: "", proof_submission_date: "" }])}>＋新增競賽紀錄</button></fieldset>;
}

function FitnessField({ value, onChange, helper, options }: { value: unknown; onChange: (key: string, value: unknown) => void; helper: string; options: readonly { label: string; value: unknown }[] }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const update = (key: string, next: unknown) => onChange("fitness_session_results", { ...record, [key]: next });
  return <fieldset className="rounded-2xl border border-[var(--jshs-border)] p-4"><legend className="px-1 text-sm font-black text-[var(--jshs-primary)]">同一次體適能檢測四項結果</legend><p className="mb-4 text-xs leading-5 jshs-muted-copy">{helper}</p><label className="grid gap-1 text-xs font-bold">檢測日期<input type="date" value={String(record.test_date ?? "")} onChange={(event) => update("test_date", event.target.value)} /></label><div className="mt-3 grid gap-3 sm:grid-cols-2">{[["flexibility","柔軟度"],["muscular_endurance","肌力與肌耐力"],["explosive_power","瞬發力"],["cardiorespiratory","心肺耐力"]].map(([key, label]) => <label key={key} className="grid gap-1 text-xs font-bold">{label}<select value={String(record[key] ?? "")} onChange={(event) => update(key, event.target.value)}><option value="">請選擇</option>{options.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}</select></label>)}</div></fieldset>;
}

function renderDistrictFields(district: AdmissionDistrict, criteria: CriteriaState, updateCriteria: CriteriaStepProps["updateCriteria"], setBalanced: (key: string, value: boolean) => void) {
  if (district === "tp") return <><h3>均衡學習與服務學習</h3><BalancedFields balanced={criteria.balanced} setBalanced={setBalanced} helper="四領域每項 6 分，最多 24 分；每學期服務滿 6 小時得 4 分，最多 12 分。" /><NumberField label="每學期服務時數" value={criteria.serviceHoursBySemester} onChange={(value) => updateCriteria("serviceHoursBySemester", value)} helper="請依七上到九上輸入，例如 6, 6, 6。" /></>;
  if (district === "ct") return <><h3>就近、弱勢與多元學習</h3><CheckboxField label="符合就近入學" checked={criteria.nearbyEligible} onChange={(value) => updateCriteria("nearbyEligible", value)} helper="符合免試就學區或共同就學區，得 10 分。" /><CheckboxField label="偏遠地區國中三年就讀" checked={criteria.remoteAreaEligible} onChange={(value) => updateCriteria("remoteAreaEligible", value)} helper="扶助弱勢項目計 1 分；與收入身分合計最多 3 分。" /><SelectField label="經濟身分" value={criteria.economicStatus} onChange={(value) => updateCriteria("economicStatus", value)} options={[["NONE", "無"], ["LOWER_MIDDLE_INCOME", "中低收入戶（1 分）"], ["LOW_INCOME", "低收入戶（2 分）"]]} helper="請依可提出的證明文件選擇。" /><BalancedFields balanced={criteria.balanced} setBalanced={setBalanced} helper="四領域每項 3 分，最多 12 分。" /><NumberField label="社團符合學期數" value={criteria.clubSemesters} onChange={(value) => updateCriteria("clubSemesters", value)} helper="每學期 1 分，最多 2 分。" /><NumberField label="服務學習時數（各學期）" value={criteria.serviceHoursBySemester} onChange={(value) => updateCriteria("serviceHoursBySemester", value)} helper="每學期滿 6 小時得 1 分，最多 3 學期。" /><DisciplineFields criteria={criteria} updateCriteria={updateCriteria} helper="無處分 6 分；警告未滿 3 支 3 分；有小過以上 0 分。" /><RewardFields criteria={criteria} updateCriteria={updateCriteria} helper="大功 3、小功 1、嘉獎 0.5 分，最多 4 分。" /></>;
  if (district === "tainan") return <><h3>就近與多元學習</h3><CheckboxField label="符合就近入學／核准變更就學區" checked={criteria.nearbyEligible} onChange={(value) => updateCriteria("nearbyEligible", value)} helper="就近入學最多 10 分。" /><NumberField label="競賽成績分數" value={criteria.contestScore} onChange={(value) => updateCriteria("contestScore", value)} helper="請依競賽層級換算後輸入，最多 10 分。" /><RewardFields criteria={criteria} updateCriteria={updateCriteria} helper="無懲處基本 3 分，加獎勵最高 15 分；有懲處則此項為 0。" /><NumberField label="服務學習總時數" value={criteria.serviceHours} onChange={(value) => updateCriteria("serviceHours", value)} helper="每 1 小時 0.3 分，最多 15 分。" /><NumberField label="社團參與符合學期數" value={criteria.clubSemesters} onChange={(value) => updateCriteria("clubSemesters", value)} helper="每學期 3 分，前五學期最多 15 分。" /><SelectField label="體適能採計級距" value={criteria.fitnessTier} onChange={(value) => updateCriteria("fitnessTier", value)} options={[["", "未填寫"], ["PR85_TWO_OR_MORE", "同次任兩項 PR85 以上（10 分）"], ["PR75_TWO_OR_MORE", "同次任兩項 PR75 以上（9 分）"], ["PR50_TWO_OR_MORE", "同次任兩項 PR50 以上（8 分）"], ["PR25", "達基本門檻 PR25（6 分）"], ["BELOW", "未達標／僅一項達標（4 分）"]]} helper="身心障礙、重大傷病或體弱且有證明者，可勾選替代方案。" /><CheckboxField label="體適能特殊替代方案" checked={criteria.fitnessExempt} onChange={(value) => updateCriteria("fitnessExempt", value)} helper="符合文件條件時，比照基本門檻 6 分。" /><CheckboxField label="語言認證" checked={criteria.languageCertified} onChange={(value) => updateCriteria("languageCertified", value)} helper="閩南語、客家語、原住民族語基礎級以上或英語 CEFR A2 以上，5 分。" /></>;
  if (district === "kaohsiung") return <><h3>多元發展項目</h3><BalancedFields balanced={criteria.balanced} setBalanced={setBalanced} helper="四領域任三領域 10 分、任兩領域 6 分、任一領域 3 分。" /><NumberField label="每學年服務時數" value={criteria.serviceHoursByYear} onChange={(value) => updateCriteria("serviceHoursByYear", value)} helper="每 3 小時 1 分，每學年最多 4 分；例如 12, 12, 12。" /><NumberField label="體適能達 PR25 以上的單項數" value={criteria.fitnessQualifiedItems} onChange={(value) => updateCriteria("fitnessQualifiedItems", value)} helper="每單項 3 分，體適能最多 20 分。" /><NumberField label="檢定證照分數" value={criteria.certificationScore} onChange={(value) => updateCriteria("certificationScore", value)} helper="依政府機關主辦的合格檢定換算，最多 20 分。" /><NumberField label="競賽表現分數" value={criteria.contestScore} onChange={(value) => updateCriteria("contestScore", value)} helper="請依競賽層級換算後輸入，最多 20 分。" /><RewardFields criteria={criteria} updateCriteria={updateCriteria} helper="大功 4.5、小功 1.5、嘉獎 0.5 分，最多 10 分。" /><NumberField label="幹部任滿學期數" value={criteria.leadershipSemesters} onChange={(value) => updateCriteria("leadershipSemesters", value)} helper="每學期 2 分，最多 10 分。" /></>;
  if (!["taoyuan-lienchiang", "tp", "ct", "tainan", "kaohsiung"].includes(district)) return <><h3>依 Notebook 報告輸入本區小計</h3><p className="mt-2 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">本區已開放完整試算流程。請依右側 Notebook 的本區規則表，將各章節核對後的小計填入；系統會保存結果、顯示總分，並把五科標示留作同分比序參考。正式資格與分數仍以當年度官方簡章為準。</p><NumberField label="志願序小計" value={criteria.manualPreferenceScore} onChange={(value) => updateCriteria("manualPreferenceScore", value)} helper="上限依本區規則報告的志願序項目；請輸入核對後小計。" /><NumberField label="多元學習表現小計" value={criteria.manualMultipleLearningScore} onChange={(value) => updateCriteria("manualMultipleLearningScore", value)} helper="上限依本區規則報告的多元學習項目；請輸入核對後小計。" /><NumberField label="會考小計" value={criteria.manualExamScore} onChange={(value) => updateCriteria("manualExamScore", value)} helper="上限依本區規則報告的會考項目；請輸入核對後小計。" /></>;
  return <><h3>適性輔導與多元學習</h3><CheckboxField label="符合畢業資格" checked={criteria.graduationEligible} onChange={(value) => updateCriteria("graduationEligible", value)} helper="符合畢業資格得 6 分。" /><CheckboxField label="生涯目標與志願科群相符" checked={criteria.careerGoalMatches} onChange={(value) => updateCriteria("careerGoalMatches", value)} helper="生涯規劃導航得 6 分。" /><CheckboxField label="符合桃連區就近入學資格" checked={criteria.nearbyEligible} onChange={(value) => updateCriteria("nearbyEligible", value)} helper="就近入學得 5 分。" /><RewardFields criteria={criteria} updateCriteria={updateCriteria} helper="品德表現：無記過 6 分，加獎勵後最多 10 分。" /><NumberField label="幹部任滿學期數" value={criteria.leadershipSemesters} onChange={(value) => updateCriteria("leadershipSemesters", value)} helper="服務表現中的幹部最多 4 分。" /><NumberField label="志願服務總時數" value={criteria.serviceHours} onChange={(value) => updateCriteria("serviceHours", value)} helper="每 1 小時 0.3 分，與幹部合計最多 10 分。" /><NumberField label="才藝競賽分數" value={criteria.contestScore} onChange={(value) => updateCriteria("contestScore", value)} helper="依國際、全國、區域或縣市層級換算，最多 10 分。" /><NumberField label="體適能分數" value={criteria.fitnessScore} onChange={(value) => updateCriteria("fitnessScore", value)} helper="單項達標即核給，最多 6 分。" /><DisciplineFields criteria={criteria} updateCriteria={updateCriteria} helper="銷過後無記過處分得 6 分；有紀錄則依正式規則核對。" /></>;
}

type CriteriaStepProps = { updateCriteria: <Key extends keyof CriteriaState>(key: Key, value: CriteriaState[Key]) => void };
function BalancedFields({ balanced, setBalanced, helper }: { balanced: Record<string, boolean>; setBalanced: (key: string, value: boolean) => void; helper: string }) { return <div className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><p className="text-sm font-black">均衡學習</p><p className="mt-1 text-xs leading-5 jshs-muted-copy">{helper}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries({ healthAndPE: "健康與體育", arts: "藝術", integrativeActivities: "綜合活動", technology: "科技" }).map(([key, label]) => <label key={key} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={balanced[key]} onChange={(event) => setBalanced(key, event.target.checked)} />{label}</label>)}</div></div>; }
function CheckboxField({ label, checked, onChange, helper }: { label: string; checked: boolean; onChange: (value: boolean) => void; helper: string }) { return <label className="mt-3 flex items-start gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm"><input className="mt-1" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><strong>{label}</strong><small className="mt-1 block font-normal leading-5 jshs-muted-copy">{helper}</small></span></label>; }
function NumberField({ label, value, onChange, helper }: { label: string; value: string; onChange: (value: string) => void; helper: string }) { return <label className="mt-4 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{label}<input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" /><small className="font-normal leading-5 jshs-muted-copy">{helper}</small></label>; }
function SelectField({ label, value, onChange, options, helper }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[]; helper: string }) { return <label className="mt-4 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select><small className="font-normal leading-5 jshs-muted-copy">{helper}</small></label>; }
function DisciplineFields({ criteria, updateCriteria, helper }: { criteria: CriteriaState; updateCriteria: CriteriaStepProps["updateCriteria"]; helper: string }) { return <div className="mt-5 rounded-2xl border border-[var(--jshs-border)] p-4"><p className="text-sm font-black">處分／記過紀錄</p><p className="mt-1 text-xs leading-5 jshs-muted-copy">{helper}</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><NumberField label="警告" value={criteria.warnings} onChange={(value) => updateCriteria("warnings", value)} helper="次數" /><NumberField label="小過" value={criteria.minorDemerits} onChange={(value) => updateCriteria("minorDemerits", value)} helper="次數" /><NumberField label="大過" value={criteria.majorDemerits} onChange={(value) => updateCriteria("majorDemerits", value)} helper="次數" /></div></div>; }
function RewardFields({ criteria, updateCriteria, helper }: { criteria: CriteriaState; updateCriteria: CriteriaStepProps["updateCriteria"]; helper: string }) { return <div className="mt-5 rounded-2xl border border-[var(--jshs-border)] p-4"><p className="text-sm font-black">獎勵紀錄</p><p className="mt-1 text-xs leading-5 jshs-muted-copy">{helper}</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><NumberField label="大功" value={criteria.majorMerits} onChange={(value) => updateCriteria("majorMerits", value)} helper="次數" /><NumberField label="小功" value={criteria.minorMerits} onChange={(value) => updateCriteria("minorMerits", value)} helper="次數" /><NumberField label="嘉獎" value={criteria.commendations} onChange={(value) => updateCriteria("commendations", value)} helper="次數" /></div></div>; }

function RuleGuide({ rule }: { rule: AdmissionRule }) { return <div className="mt-8"><h3>本區規則骨架</h3><div className="mt-3 grid gap-3">{rule.categories.map((item) => <article key={item.key} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-center justify-between gap-3"><strong>{item.label}</strong><span className="jshs-chip">上限 {item.max} 分</span></div><p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.description}</p></article>)}</div></div>; }
function RuleAside({ rule, missing }: { rule: AdmissionRule; missing: readonly string[] }) {
  // 計算版本只保留在 source-level migration checks，不呈現在 Production UI。
  // 目前資料缺口改以各大類填寫狀態呈現。
  const tieBreakers = rule.tieBreakers.slice(0, 6).map((item) => resolveAdmissionMissingFieldLabels([item], rule)[0]);
  return <aside className="admission-summary p-5 md:sticky md:top-6 md:p-6 jshs-surface-card"><p className="jshs-eyebrow">目前進度</p><h2 className="mt-2">{rule.academicYear} 學年度・{rule.label}</h2><div className="mt-5 rounded-2xl bg-[var(--jshs-primary)] p-5 text-white"><span className="block text-sm text-white/75">目前積分</span><strong className="mt-1 block text-4xl font-black">尚未計算</strong><span className="mt-1 block text-sm text-white/75">滿分 {rule.totalScore} 分</span></div><div className="mt-5"><p className="jshs-info-group-title">填寫狀態</p><ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">{rule.categories.map((category) => <li key={category.key} className="flex items-center justify-between gap-3"><span>{category.label}</span><span className="text-slate-400">待填寫</span></li>)}</ul></div>{missing.length ? <p className="mt-5 rounded-xl bg-[var(--jshs-muted-surface)] p-3 text-sm leading-6 text-slate-600">還有 {missing.length} 項資料尚未填寫</p> : null}<div className="mt-6 border-t border-[var(--jshs-border)] pt-5"><p className="jshs-info-group-title">同分比序</p><ol className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">{tieBreakers.map((item, index) => <li key={`${item}-${index}`}>{index + 1}. {item}</li>)}</ol></div><details className="mt-6 border-t border-[var(--jshs-border)] pt-5"><summary className="cursor-pointer text-sm font-bold">官方資料依據</summary><p className="mt-2 text-sm leading-6 jshs-muted-copy">{rule.sourceNote}</p></details></aside>;
}
function ResultStep({ result, status, missing, rule }: { result: ScoreResult | null; status: string; missing: readonly string[]; rule: AdmissionRule }) { const displayedMissing = resolveAdmissionMissingFieldLabels(result?.missingFields ?? missing, rule); const rows = result ? [...rule.categories.filter((item) => item.key !== "examPerformanceScore").map((item) => [item.label, result.otherItems[item.key] ?? 0, item.max, item.description] as const), ["國中教育會考", result.exam.examPerformanceScore, rule.categories.find((item) => item.key === "examPerformanceScore")?.max ?? 0, "依五科等級與本區寫作測驗規則折算。" ] as const] : []; return <div><p className="jshs-eyebrow">結果摘要</p><h2 className="mt-2">這個結果可以怎麼用？</h2>{result?.status === "incomplete" ? <p className="mt-5 rounded-2xl border border-dashed border-[var(--jshs-border)] p-5 text-sm leading-7 text-slate-600">部分官方規則尚待確認，因此目前無法產生完整試算結果。</p> : result ? <><div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl bg-[var(--jshs-primary)] p-6 text-white"><div><span className="block text-sm text-white/70">目前總分</span><strong className="mt-1 block text-5xl font-black text-white">{result.totalScore}</strong></div><span className="pb-2 text-sm text-white/80">滿分 {rule.totalScore} · {rule.label}</span></div><div className="mt-6 overflow-x-auto"><table><thead><tr><th>項目</th><th>目前分數</th><th>上限</th><th>怎麼來的</th></tr></thead><tbody>{rows.map(([label, score, cap, explanation]) => <tr key={String(label)}><th>{label}</th><td>{score}</td><td>{cap}</td><td>{explanation}</td></tr>)}<tr><th>會考同分比序點</th><td>{result.exam.examTotalPoints || "—"}</td><td>依本區規則</td><td>第一階段不一定加總，但會幫助同分時排序。</td></tr></tbody></table></div></> : <p className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-5 text-sm leading-7 jshs-muted-copy">尚未產生結果。請回到前面補齊會考與志願序資料。</p>}<p className="mt-5 text-sm font-black text-[var(--jshs-primary)]" role="status">{status}</p><div className="mt-7 grid gap-4 md:grid-cols-2"><InfoCard title="可以用來做什麼" body="比較候選校科、看出哪一項仍可補強，並把結果帶到我的規劃。" /><InfoCard title="不能用來做什麼" body="不能當作正式錄取保證，也不能取代當年度簡章、名額、資格審查或招生委員會判定。" /></div>{displayedMissing.length ? <div className="mt-6 rounded-2xl border border-dashed border-[var(--jshs-border)] p-4 text-sm leading-6 text-slate-600"><strong>尚未完成／還有以下資料需要填寫：</strong>{displayedMissing.join("、")}</div> : null}<div className="mt-7 flex flex-wrap gap-3"><Link className="px-4 py-3 text-sm jshs-button-primary" href={`/schools?district=${districtCode(rule.code)}`}>下一步：找校科</Link><Link className="px-4 py-3 text-sm jshs-button-secondary" href={`/planner?district=${districtCode(rule.code)}`}>下一步：我的規劃</Link></div></div>; }
function districtCode(code: AdmissionDistrict) { return code; }
function InfoCard({ title, body }: { title: string; body: string }) { return <article className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h3 className="text-base">{title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p></article>; }
