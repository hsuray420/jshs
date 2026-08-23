"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { markProgress } from "@/lib/progress";

const subjects = [
  ["chineseGrade", "國文"], ["mathGrade", "數學"], ["englishGrade", "英語"],
  ["socialGrade", "社會"], ["scienceGrade", "自然"],
] as const;
const grades = ["A++", "A+", "A", "B++", "B+", "B", "C"];
const steps = [["context", "1", "確認區域"], ["exam", "2", "輸入會考"], ["criteria", "3", "補充比序"], ["result", "4", "查看結果"]] as const;
const ruleMeta = { district: "中投區", academicYear: "115 學年度", version: "115-CT-v1", updatedAt: "2026-08-14", source: "中投區高級中等學校免試入學委員會" } as const;

type Result = { totalScore: number; otherItems: Record<string, number>; exam: { examPerformanceScore: number; examTotalPoints: number } };
type ExamState = Record<(typeof subjects)[number][0], string>;
type StepId = (typeof steps)[number][0];
type ExamStateKey = keyof ExamState;
const emptyExam: ExamState = Object.fromEntries(subjects.map(([key]) => [key, ""])) as ExamState;

export function AdmissionCalculator({ initialDistrict }: { initialDistrict: "ct" | "tp" }) {
  const [district, setDistrict] = useState(initialDistrict);
  const [academicYear, setAcademicYear] = useState("115");
  const [step, setStep] = useState<StepId>("context");
  const [exam, setExam] = useState<ExamState>(emptyExam);
  const [writingLevel, setWritingLevel] = useState("");
  const [choiceText, setChoiceText] = useState("");
  const [balanced, setBalanced] = useState<Record<string, boolean>>({ healthAndPE: false, arts: false, integrativeActivities: false, technology: false });
  const [clubSemesters, setClubSemesters] = useState("2");
  const [serviceHours, setServiceHours] = useState("6, 6, 6");
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => markProgress("district", initialDistrict), [initialDistrict]);

  const missing = useMemo(() => {
    const fields: string[] = [];
    if (district !== "ct") fields.push("基北區公式尚在校核");
    if (academicYear !== "115") fields.push("目前只有 115 學年度規則");
    subjects.forEach(([key, label]) => { if (!exam[key]) fields.push(`${label}會考標示`); });
    if (writingLevel === "" || Number(writingLevel) < 0 || Number(writingLevel) > 6) fields.push("作文級分（0–6）");
    if (!choiceText.trim()) fields.push("志願序（可先填校科代碼）");
    return fields;
  }, [academicYear, choiceText, district, exam, writingLevel]);

  async function calculate() {
    if (district !== "ct") { setStatus("基北區規則正在校核；目前不以未核定公式產生分數。可先使用找校科與我的規劃。"); setResult(null); return; }
    if (missing.some((item) => item.includes("會考") || item.includes("作文"))) { setStatus("先補齊會考五科與作文級分，才能產生可解釋的結果。"); setStep("exam"); return; }
    setStatus("正在依規則計算…");
    const choiceList = choiceText.split(/[\s,、，]+/).filter(Boolean).map((schoolId) => ({ schoolId }));
    const response = await fetch("/api/admission/calculate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      enrollmentDistrictStatus: "CT_MAIN_DISTRICT", choiceList, balancedLearning: balanced, clubEligibleSemesters: Number(clubSemesters) || 0,
      serviceHoursBySemester: serviceHours.split(/[\s,、，]+/).filter(Boolean).map(Number).filter(Number.isFinite), rewards: {},
      exam: { ...exam, writingLevel: Number(writingLevel), violationPoints: 0 },
    }) }).catch(() => null);
    const payload = await response?.json().catch(() => ({})) as { result?: Result };
    setResult(payload.result || null);
    setStatus(response?.ok ? "已依 115 學年度中投區規則完成試算。" : "試算失敗，請稍後重試。");
    if (response?.ok && payload.result) { markProgress("calculator", district); setStep("result"); }
  }

  function nextStep() {
    if (step === "criteria") { void calculate(); return; }
    setStep(steps[Math.min(steps.findIndex(([id]) => id === step) + 1, steps.length - 1)][0]);
  }
  const stepNumber = steps.findIndex(([id]) => id === step) + 1;

  return <>
    <section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">試算工具中心 · 目前位於第 {stepNumber} 步／共 4 步</p><h1 className="mt-3 max-w-4xl">填一項，解釋一項，看它如何影響結果。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">先確認適用規則，再輸入資料。每個分數都會標示上限、來源與限制，結果只用來協助規劃，不是錄取保證。</p></div></section>
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-6 md:py-8"><nav aria-label="試算步驟" className="grid grid-cols-2 gap-2 md:grid-cols-4">{steps.map(([id, number, label]) => <button key={id} type="button" onClick={() => setStep(id)} className={`flex items-center gap-3 p-3 text-left text-sm jshs-button ${step === id ? "jshs-button-primary" : "jshs-button-secondary"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 font-black">{number}</span><span>{label}</span></button>)}</nav></section>
    <section className="mx-auto grid w-[min(1120px,calc(100%-32px))] gap-5 pb-12 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="p-5 md:p-7 jshs-surface-card">
      {step === "context" ? <ContextStep district={district} academicYear={academicYear} onDistrictChange={setDistrict} onYearChange={setAcademicYear} /> : null}
      {step === "exam" ? <ExamStep exam={exam} writingLevel={writingLevel} onExamChange={(key, value) => setExam((current) => ({ ...current, [key]: value }))} onWritingChange={setWritingLevel} /> : null}
      {step === "criteria" ? <CriteriaStep choiceText={choiceText} balanced={balanced} clubSemesters={clubSemesters} serviceHours={serviceHours} onChoiceChange={setChoiceText} onBalancedChange={(key, value) => setBalanced((current) => ({ ...current, [key]: value }))} onClubChange={setClubSemesters} onServiceChange={setServiceHours} /> : null}
      {step === "result" ? <ResultStep result={result} status={status} missing={missing} ruleInfo={ruleMeta} /> : null}
      {step !== "result" ? <p className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy"><strong className="text-[var(--jshs-primary)]">這一項會影響什麼？</strong> {step === "context" ? "它決定套用哪一套年度規則；不同就學區不能混算。" : step === "exam" ? "會考五科與作文會影響會考表現積分與會考積點。" : "志願序與多元學習資料會影響比序項目；空白會保留為待補資料。"}</p> : null}
      <div className="mt-7 flex flex-wrap justify-between gap-3"><button type="button" disabled={step === "context"} onClick={() => setStep(steps[Math.max(steps.findIndex(([id]) => id === step) - 1, 0)][0])} className="px-4 py-3 text-sm jshs-button-secondary">← 上一步</button><button type="button" onClick={() => step === "result" ? setStep("exam") : nextStep()} className="px-5 py-3 text-sm jshs-button-primary">{step === "criteria" ? "產生個人積分摘要" : step === "result" ? "重新檢查資料" : "下一步 →"}</button></div>
    </div><aside className="p-5 md:p-6 jshs-surface-card"><p className="jshs-eyebrow">資料位置感</p><h2 className="mt-2">{ruleMeta.district} · {ruleMeta.academicYear}</h2><dl className="mt-5 grid gap-3 text-sm"><MetaItem label="計算版本" value={ruleMeta.version} /><MetaItem label="規則更新" value={ruleMeta.updatedAt} /><MetaItem label="目前狀態" value={district === "ct" ? "可試算" : "規則校核中"} /></dl><div className="mt-6 border-t border-[var(--jshs-border)] pt-5"><p className="jshs-info-group-title">目前資料缺口</p>{missing.length ? <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">{missing.slice(0, 6).map((item) => <li key={item}>• {item}</li>)}{missing.length > 6 ? <li>• 還有 {missing.length - 6} 項</li> : null}</ul> : <p className="mt-3 text-sm leading-6 text-[var(--jshs-success)]">必要欄位已補齊。</p>}</div><p className="mt-6 text-xs leading-6 jshs-muted-copy">來源：{ruleMeta.source}。正式規則、名額與報名資格請回到當年度官方公告核對。</p></aside></section>
  </>;
}

function ContextStep({ district, academicYear, onDistrictChange, onYearChange }: { district: string; academicYear: string; onDistrictChange: (value: "ct" | "tp") => void; onYearChange: (value: string) => void }) { return <div><p className="jshs-eyebrow">先做這件事</p><h2 className="mt-2">確認就學區與學年度</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">規則的適用範圍不同，請先選定再繼續。這是後面所有分數解釋的前提。</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => onDistrictChange(event.target.value as "ct" | "tp")}><option value="ct">中投區</option><option value="tp">基北區（校核中）</option></select><small className="font-normal leading-5 jshs-muted-copy">目前只有中投區可產生分數。</small></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">學年度<select value={academicYear} onChange={(event) => onYearChange(event.target.value)}><option value="115">115 學年度</option><option value="114">114 學年度（不可試算）</option></select><small className="font-normal leading-5 jshs-muted-copy">結果會固定標示使用的年度。</small></label></div></div>; }

function ExamStep({ exam, writingLevel, onExamChange, onWritingChange }: { exam: ExamState; writingLevel: string; onExamChange: (key: ExamStateKey, value: string) => void; onWritingChange: (value: string) => void }) { return <div><p className="jshs-eyebrow">使用者輸入</p><h2 className="mt-2">輸入會考各科等級／標示</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">每一科填完後，下方會說明這一科會進入哪一個計算項目。</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{subjects.map(([key, label]) => <label key={key} className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{label}<select value={exam[key]} onChange={(event) => onExamChange(key, event.target.value)}><option value="">尚未填寫</option>{grades.map((grade) => <option key={grade}>{grade}</option>)}</select><small className="font-normal leading-5 jshs-muted-copy">{exam[key] ? `${label}目前會考表現：${exam[key]}，會計入會考表現與會考積點。` : `尚缺${label}資料。`}</small></label>)}<label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">作文級分<input type="number" min="0" max="6" value={writingLevel} onChange={(event) => onWritingChange(event.target.value)} placeholder="0–6" /><small className="font-normal leading-5 jshs-muted-copy">作文級分會加到會考積點；不確定時先不要猜。</small></label></div></div>; }

function CriteriaStep({ choiceText, balanced, clubSemesters, serviceHours, onChoiceChange, onBalancedChange, onClubChange, onServiceChange }: { choiceText: string; balanced: Record<string, boolean>; clubSemesters: string; serviceHours: string; onChoiceChange: (value: string) => void; onBalancedChange: (key: string, value: boolean) => void; onClubChange: (value: string) => void; onServiceChange: (value: string) => void }) { return <div><p className="jshs-eyebrow">比序補充</p><h2 className="mt-2">輸入志願序與必要比序項目</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">先用校科代碼或暫時名稱建立順序；同校多科之後會在我的規劃中心處理，不會把不同學校誤合併。</p><label className="mt-6 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">志願序（以空格或頓號分隔）<input value={choiceText} onChange={(event) => onChoiceChange(event.target.value)} placeholder="例如：063C02、063C03、050314" /><small className="font-normal leading-5 jshs-muted-copy">目前使用者自行輸入；可完成試算後再到我的規劃整理正式順序。</small></label><h3 className="mt-7">多元學習表現</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries({ healthAndPE: "健康與體育", arts: "藝術", integrativeActivities: "綜合活動", technology: "科技" }).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm font-black"><input type="checkbox" checked={balanced[key]} onChange={(event) => onBalancedChange(key, event.target.checked)} />{label}<span className="ml-auto text-xs font-normal text-slate-500">每項影響均衡學習</span></label>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">社團符合學期數<input type="number" min="0" max="2" value={clubSemesters} onChange={(event) => onClubChange(event.target.value)} /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">服務學習時數（各學期）<input value={serviceHours} onChange={(event) => onServiceChange(event.target.value)} placeholder="例如：6, 6, 6" /></label></div></div>; }

function ResultStep({ result, status, missing, ruleInfo }: { result: Result | null; status: string; missing: readonly string[]; ruleInfo: typeof ruleMeta }) { const rows = result ? [["會考表現積分", result.exam.examPerformanceScore, "30", "五科等級與違規扣分後的結果"], ["會考積點", result.exam.examTotalPoints, "110", "五科標示與作文級分的點數"], ["志願序分數", result.otherItems.preferenceScore, "30", "依目前輸入的志願順序計算"], ["均衡學習", result.otherItems.balancedLearningScore, "12", "由勾選的學習項目帶入"], ["多元學習合計", result.otherItems.multipleLearningScore, "27", "均衡、社團、服務與獎懲的合計上限"], ["其他項目合計", result.otherItems.otherItemsTotal, "70", "比序相關項目合計"]] : []; return <div><p className="jshs-eyebrow">結果摘要</p><h2 className="mt-2">這個結果可以怎麼用？</h2>{result ? <><div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl bg-[var(--jshs-primary)] p-6 text-white"><div><span className="block text-sm text-white/70">目前總分</span><strong className="mt-1 block text-5xl font-black text-white">{result.totalScore}</strong></div><span className="pb-2 text-sm text-white/80">依 {ruleInfo.academicYear} {ruleInfo.district}規則</span></div><div className="mt-6 overflow-x-auto"><table><thead><tr><th>項目</th><th>目前分數</th><th>上限</th><th>怎麼來的</th></tr></thead><tbody>{rows.map(([label, score, cap, explanation]) => <tr key={String(label)}><th>{label}</th><td>{score}</td><td>{cap}</td><td>{explanation}</td></tr>)}</tbody></table></div></> : <p className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-5 text-sm leading-7 jshs-muted-copy">尚未產生結果。請回到前面補齊會考資料，再產生個人積分摘要。</p>}<p className="mt-5 text-sm font-black text-[var(--jshs-primary)]" role="status">{status}</p><div className="mt-7 grid gap-4 md:grid-cols-2"><InfoCard title="可以用來做什麼" body="比較候選校科、看資料缺口、建立挑戰／適中／穩定分層，並把結果帶到我的規劃。" /><InfoCard title="不能用來做什麼" body="不能當作正式錄取保證，也不能取代當年度簡章、委員會公告或學校通知。" /></div>{missing.length ? <div className="mt-6 rounded-2xl border border-dashed border-[var(--jshs-border)] p-4 text-sm leading-6 text-slate-600"><strong>仍有待補欄位：</strong>{missing.join("、")}</div> : null}<div className="mt-7 flex flex-wrap gap-3"><Link className="px-4 py-3 text-sm jshs-button-primary" href="/schools?district=ct">下一步：找校科</Link><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/planner">下一步：我的規劃</Link></div></div>; }

function MetaItem({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><dt className="jshs-muted-copy">{label}</dt><dd className="font-black text-[var(--jshs-primary)]">{value}</dd></div>; }
function InfoCard({ title, body }: { title: string; body: string }) { return <article className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h3 className="text-base">{title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p></article>; }
