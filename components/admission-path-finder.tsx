"use client";

import { useEffect, useMemo, useState } from "react";
import districtMetadata from "../public/it_hs/district-metadata.json" with { type: "json" };
import { readStoredDistrict } from "@/lib/district-context";
import { evaluateAdmissionEligibility, type AdmissionPathInput, type AdmissionPathResult, type AdmissionPathRoute, type Identity, type SpecialNeed, type StudentType } from "@/lib/admission-path-engine";

const STORAGE_KEY = "jshs_admission_path_finder";
const academicYears = [{ value: "115", label: "115 學年度" }] as const;

const studentTypes: readonly { value: StudentType; label: string; description: string }[] = [
  { value: "current_graduate", label: "國中應屆畢業生", description: "今年完成國中畢業，準備參加高中職升學。" },
  { value: "non_current_graduate", label: "非應屆畢業生", description: "已畢業、重讀、休學或其他非一般應屆狀況。" },
  { value: "transfer_student", label: "轉學生", description: "曾轉學或目前學籍異動，需要個案確認。" },
  { value: "overseas_returning", label: "境外／海外返臺學生", description: "有境外就學或返臺學歷資料需要核對。" },
  { value: "overseas_student", label: "僑生／境外學生", description: "身分或學歷可能涉及特殊申請管道。" },
  { value: "other", label: "其他情況", description: "不確定時先選這裡，結果會安排人工確認。" },
];

const identities: readonly { value: Identity; label: string }[] = [
  { value: "none", label: "無以上身分" },
  { value: "indigenous", label: "原住民" }, { value: "disability", label: "身心障礙" }, { value: "overseas_chinese", label: "僑生" },
  { value: "mongolian_tibetan", label: "蒙藏生" }, { value: "government_assigned_child", label: "政府派外人員子女" },
  { value: "overseas_science_child", label: "境外優秀科學技術人才子女" }, { value: "veteran", label: "退伍軍人相關身分" },
  { value: "unknown", label: "我不確定" },
];

const needs: readonly { value: SpecialNeed; label: string; description: string }[] = [
  { value: "none", label: "沒有／不知道", description: "先以一般免試入學路徑整理，之後仍可重新檢測。" },
  { value: "special_admission", label: "特色招生／特色班", description: "學校特色、專長、面試或作品甄選。" },
  { value: "gifted", label: "資優班", description: "資優鑑定、安置或相關升學需求。" },
  { value: "arts", label: "藝才班", description: "音樂、美術、舞蹈或其他藝術才能管道。" },
  { value: "sports", label: "體育班", description: "體育專長、術科或運動績優管道。" },
  { value: "direct_selection", label: "直升／甄選", description: "完全中學直升或學校甄選入學。" },
  { value: "cross_zone", label: "跨區就學", description: "希望到原就讀區以外的就學區升學。" },
  { value: "special_education", label: "特殊教育", description: "特殊教育安置、IEP 或學習支持。" },
];

const countyOptions = [...new Set(Object.values(districtMetadata.districts).flatMap((district) => district.areas.split("、")))].sort((a, b) => a.localeCompare(b, "zh-TW"));
const districtOptions = Object.entries(districtMetadata.districts).map(([code, district]) => ({ code, label: district.label, areas: district.areas }));

type FinderState = {
  academicYear: string;
  zone: string;
  studentType: StudentType | "";
  schoolCounty: string;
  schoolCode: string;
  identities: Identity[];
  specialNeeds: SpecialNeed[];
  answers: Record<string, string | boolean>;
  currentStep: number;
  completed: boolean;
  started: boolean;
};

const defaultState: FinderState = { academicYear: "115", zone: "", studentType: "", schoolCounty: "", schoolCode: "", identities: [], specialNeeds: [], answers: {}, currentStep: 0, completed: false, started: false };

export function AdmissionPathFinder() {
  const [state, setState] = useState<FinderState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [result, setResult] = useState<AdmissionPathResult | null>(null);
  const [schools, setSchools] = useState<readonly { code: string; name: string; districtCode: string }[]>([]);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [dataError, setDataError] = useState("");

  const conditionalSteps = useMemo(() => [
    ...(state.specialNeeds.includes("cross_zone") ? ["cross_zone"] : []),
    ...(state.specialNeeds.some((need) => ["special_admission", "arts", "sports"].includes(need)) ? ["special_admission"] : []),
    ...(state.specialNeeds.includes("direct_selection") ? ["direct_selection"] : []),
    ...(state.specialNeeds.includes("gifted") || state.specialNeeds.includes("special_education") ? ["special_education"] : []),
  ], [state.specialNeeds]);
  const steps = useMemo(() => ["student", "school", "zone", "identity", "needs", ...conditionalSteps], [conditionalSteps]);
  const currentStep = Math.min(state.currentStep, steps.length - 1);
  const selectedZone = districtOptions.find((district) => district.code === state.zone);
  const inferredZones = districtOptions.filter((district) => district.areas.split("、").includes(state.schoolCounty));
  const filteredSchools = schools.filter((school) => !state.zone || school.districtCode === state.zone).filter((school) => !schoolQuery || school.name.includes(schoolQuery)).slice(0, 80);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as Partial<FinderState> | null;
        const storedZone = readStoredDistrict();
        if (saved) setState({ ...defaultState, ...saved, zone: saved.zone || storedZone, started: saved.started ?? Boolean(saved.currentStep), identities: saved.identities || [], specialNeeds: saved.specialNeeds || [], answers: saved.answers || {} });
        else if (storedZone) setState((current) => ({ ...current, zone: storedZone }));
      } catch { setDataError("目前無法讀取上次的檢測進度，已從新檢測開始。"); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || !state.completed || result) return;
    const timer = window.setTimeout(() => setResult(evaluateAdmissionEligibility({
      academicYear: state.academicYear,
      zone: state.zone,
      studentType: state.studentType,
      schoolCounty: state.schoolCounty,
      schoolCode: state.schoolCode,
      identities: state.identities,
      specialNeeds: state.specialNeeds,
      answers: state.answers,
    })), 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, result, state]);

  useEffect(() => {
    if (!hydrated || currentStep !== 1 || schools.length) return;
    fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } })
      .then((response) => { if (!response.ok) throw new Error("school_directory_unavailable"); return response.json() as Promise<{ schools?: { code: string; name: string; districtCode: string }[] }>; })
      .then((payload) => setSchools(payload.schools || []))
      .catch(() => setDataError("目前無法載入學校選單；你仍可先選擇縣市與就學區完成檢測。"));
  }, [currentStep, hydrated, schools.length]);

  function update(patch: Partial<FinderState>) { setState((current) => ({ ...current, ...patch, completed: false })); setResult(null); }
  function chooseCounty(county: string) {
    const inferred = districtOptions.find((district) => district.areas.split("、").includes(county));
    update({ schoolCounty: county, schoolCode: "", zone: inferred?.code || state.zone });
  }
  function toggleIdentity(value: Identity) {
    if (value === "unknown" || value === "none") return update({ identities: [value] });
    const next = state.identities.filter((identity) => identity !== "none" && identity !== "unknown");
    update({ identities: next.includes(value) ? next.filter((identity) => identity !== value) : [...next, value] });
  }
  function toggleNeed(value: SpecialNeed) {
    if (value === "none") return update({ specialNeeds: [value] });
    const next = state.specialNeeds.filter((need) => need !== "none");
    update({ specialNeeds: next.includes(value) ? next.filter((need) => need !== value) : [...next, value] });
  }
  function next() {
    if (currentStep >= steps.length - 1) {
      const input: AdmissionPathInput = { academicYear: state.academicYear, zone: state.zone, studentType: state.studentType, schoolCounty: state.schoolCounty, schoolCode: state.schoolCode, identities: state.identities, specialNeeds: state.specialNeeds, answers: state.answers };
      const nextResult = evaluateAdmissionEligibility(input);
      setResult(nextResult); setState((current) => ({ ...current, currentStep, completed: true }));
      return;
    }
    setState((current) => ({ ...current, currentStep: currentStep + 1 }));
  }
  function back() { setState((current) => ({ ...current, currentStep: Math.max(0, currentStep - 1), completed: false })); setResult(null); }
  function reset() { setState(defaultState); setResult(null); setSchoolQuery(""); window.localStorage.removeItem(STORAGE_KEY); }
  function start() { setState((current) => ({ ...current, started: true })); }
  function canContinue() { if (steps[currentStep] === "student") return Boolean(state.studentType); if (steps[currentStep] === "school") return Boolean(state.schoolCounty); if (steps[currentStep] === "zone") return Boolean(state.zone); return true; }

  // localStorage is only available after hydration. Render the actionable empty state first.
  if (!hydrated) return <WelcomeView onStart={start} />;
  if (state.completed && result) return <ResultView result={result} zone={selectedZone?.label || state.zone} onReset={reset} />;
  if (!state.started) return <WelcomeView onStart={start} />;

  return <section id="admission-path-finder" aria-labelledby="admission-path-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8 md:py-12">
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <div className="p-6 md:p-8 jshs-surface-card">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="jshs-eyebrow">升學路徑與資格判定中心</p><h1 id="admission-path-title" className="mt-2 max-w-3xl">回答幾個問題，找出可能適用的升學方式。</h1><p className="mt-3 max-w-2xl text-base leading-7 jshs-muted-copy">系統依目前已核對的規則資料整理結果；資料不足的路徑會標示需要人工／官方確認。</p></div><label className="grid gap-1 text-sm font-black text-[var(--jshs-primary)]">學年度<select aria-label="選擇學年度" value={state.academicYear} onChange={(event) => update({ academicYear: event.target.value })} className="min-w-32"><option value="">請選擇</option>{academicYears.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}</select></label></div>
        {dataError ? <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert"><p>{dataError}</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-white px-4 py-2 font-black">重新載入</button><a href="/admission-guides" className="rounded-xl px-4 py-2 font-black underline">查看官方規定 ↗</a></div></div> : null}
        <WizardProgress steps={steps} currentStep={currentStep} />
        <WizardStep kind={steps[currentStep]} state={state} update={update} chooseCounty={chooseCounty} toggleIdentity={toggleIdentity} toggleNeed={toggleNeed} countyOptions={countyOptions} inferredZones={inferredZones} selectedZone={selectedZone?.label} schoolQuery={schoolQuery} setSchoolQuery={setSchoolQuery} schools={filteredSchools} />
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--jshs-border)] pt-5 sm:flex-row sm:justify-between"><button type="button" onClick={back} disabled={currentStep === 0} className="px-4 py-3 text-sm jshs-button-secondary">← 上一步</button><button type="button" onClick={next} disabled={!canContinue()} className="px-5 py-3 text-sm jshs-button-primary">{currentStep === steps.length - 1 ? "查看判定結果 →" : "下一步 →"}</button></div>
      </div>
      <aside className="p-6 jshs-surface-card md:p-8"><p className="jshs-eyebrow">你會得到什麼</p><div className="mt-4 grid gap-3">{[["多條路徑", "不只選一個答案，同時列出一般入學與可能的特殊管道。"], ["判定理由", "每張結果卡都會說明符合、可能符合或需要確認的原因。"], ["下一步與文件", "直接連到試算、查學校、志願模擬與應備文件。"], ["官方依據", "每項結果都帶有來源、頁面／章節與最後核對日期。"]].map(([title, body]) => <div key={title} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><strong className="block">{title}</strong><p className="mt-1 text-sm leading-6 jshs-muted-copy">{body}</p></div>)}</div><details className="mt-5 rounded-2xl border border-[var(--jshs-border)] p-4"><summary className="cursor-pointer font-black text-[var(--jshs-primary)]">已經知道要查哪個管道？</summary><div className="mt-3 grid gap-2 text-sm">{[["特殊招生／特色班", "special-admission"], ["跨區就學", "cross-district"], ["直升與甄選", "direct-selection"], ["特殊身分與外加名額", "extra-quota"]].map(([label, topic]) => <a key={topic} href={`/eligibility/${topic}`} className="rounded-xl bg-[var(--jshs-muted-surface)] p-3 font-black text-[var(--jshs-primary)]">{label} ↗</a>)}</div></details></aside>
    </div>
  </section>;
}

function WelcomeView({ onStart }: { onStart: () => void }) { return <section id="admission-path-finder" aria-labelledby="admission-path-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8 md:py-12"><div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="p-6 md:p-10 jshs-surface-card"><p className="jshs-eyebrow">升學路徑與資格判定中心</p><h1 id="admission-path-title" className="mt-3 max-w-3xl text-4xl md:text-5xl">先回答幾個問題，再決定要走哪條路。</h1><p className="mt-5 max-w-2xl text-base leading-8 jshs-muted-copy">不需要先懂「跨區」、「外加名額」或「特色招生」的差別。系統會依你的學籍、所在地、身分與需求，整理多條可能適用的升學方式。</p><button type="button" onClick={onStart} className="mt-7 px-5 py-3 text-sm jshs-button-primary">開始資格檢測 →</button><p className="mt-4 text-sm leading-6 jshs-muted-copy">檢測約需 2–3 分鐘；答案會保存在這台裝置，之後可以繼續。</p></div><div className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">完成後你會看到</p><div className="mt-4 grid gap-3">{[["多條升學路徑", "一般免試、特殊招生、跨區與特殊身分可以同時比較。"], ["清楚的判定狀態", "符合、可能符合、目前不符合、需要人工／官方確認。"], ["下一步與文件", "直接知道要準備什麼，以及要前往哪個網站功能。"], ["官方依據", "每個結果附來源、頁面／章節、核對日期與驗證狀態。"]].map(([title, body]) => <div key={title} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><strong className="block">{title}</strong><p className="mt-1 text-sm leading-6 jshs-muted-copy">{body}</p></div>)}</div></div></div></section>; }

function WizardProgress({ steps, currentStep }: { steps: readonly string[]; currentStep: number }) { return <div className="mt-7" aria-label={`檢測進度，第${currentStep + 1}步，共${steps.length}步`}><div className="flex items-center gap-1">{steps.map((step, index) => <div key={`${step}-${index}`} className={`h-2 flex-1 rounded-full ${index <= currentStep ? "bg-[var(--jshs-primary)]" : "bg-[var(--jshs-muted-surface)]"}`} />)}</div><p className="mt-2 text-sm font-black text-[var(--jshs-primary)]">第 {currentStep + 1} 步／共 {steps.length} 步</p></div>; }

function WizardStep({ kind, state, update, chooseCounty, toggleIdentity, toggleNeed, countyOptions, inferredZones, selectedZone, schoolQuery, setSchoolQuery, schools }: { kind: string; state: FinderState; update: (patch: Partial<FinderState>) => void; chooseCounty: (county: string) => void; toggleIdentity: (value: Identity) => void; toggleNeed: (value: SpecialNeed) => void; countyOptions: readonly string[]; inferredZones: readonly { code: string; label: string }[]; selectedZone?: string; schoolQuery: string; setSchoolQuery: (value: string) => void; schools: readonly { code: string; name: string; districtCode: string }[] }) {
  if (kind === "student") return <StepShell eyebrow="Step 1" title="你目前是哪一種學生？" help="先確認學籍狀態，系統才知道哪些規則可能適用。"><div className="grid gap-3 sm:grid-cols-2">{studentTypes.map((item) => <OptionCard key={item.value} selected={state.studentType === item.value} onClick={() => update({ studentType: item.value })} title={item.label} body={item.description} />)}</div></StepShell>;
  if (kind === "school") return <StepShell eyebrow="Step 2" title="你目前／原就讀學校在哪裡？" help="縣市可以協助系統先推測免試就學區；學校名稱只需從選單選取，不用自行輸入。"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">縣市<select value={state.schoolCounty} onChange={(event) => chooseCounty(event.target.value)}><option value="">請選擇縣市</option>{countyOptions.map((county) => <option key={county} value={county}>{county}</option>)}</select></label><label className="mt-5 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校（選填）<input value={schoolQuery} onChange={(event) => setSchoolQuery(event.target.value)} placeholder="輸入關鍵字篩選學校選單" aria-describedby="school-select-help" /><select className="mt-1" value={state.schoolCode} onChange={(event) => update({ schoolCode: event.target.value })}><option value="">先不選學校</option>{schools.map((school) => <option key={`${school.districtCode}-${school.code}`} value={school.code}>{school.name}</option>)}</select><span id="school-select-help" className="font-normal text-sm leading-6 text-[var(--jshs-muted)]">學校選單載入失敗時，可以先用縣市完成檢測，結果會保守標示。</span></label></StepShell>;
  if (kind === "zone") return <StepShell eyebrow="Step 3" title="你準備參加哪一個免試就學區？" help="系統會依學校所在地先帶入推測值；你可以更改，因為共同就學區與核准變更就學區仍要看正式對照。"><div className="rounded-2xl bg-[var(--jshs-brand-tint)] p-4"><strong>目前推測：{selectedZone || "尚未推測"}</strong><p className="mt-1 text-sm leading-6 jshs-muted-copy">{state.schoolCounty ? `依${state.schoolCounty}的學校所在地推測。` : "請先回到上一步選擇縣市。"}</p></div><label className="mt-5 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">免試就學區<select value={state.zone} onChange={(event) => update({ zone: event.target.value })}><option value="">請選擇就學區</option>{districtOptions.map((district) => <option key={district.code} value={district.code}>{district.label}</option>)}</select></label>{inferredZones.length ? <p className="mt-3 text-sm leading-6 jshs-muted-copy">系統依所在地找到：{inferredZones.map((zone) => zone.label).join("、")}。若你要跨區，下一步可以勾選跨區就學。</p> : null}</StepShell>;
  if (kind === "identity") return <StepShell eyebrow="Step 4" title="你有下列特殊身分嗎？" help="請用選項勾選，不需要自己輸入身分類型；不確定可以直接選「我不確定」。"><div className="grid gap-3 sm:grid-cols-2">{identities.map((item) => <ChipOption key={item.value} selected={state.identities.includes(item.value)} onClick={() => toggleIdentity(item.value)} label={item.label} />)}</div><p className="mt-4 text-sm leading-6 jshs-muted-copy">可選「無以上身分」；未勾選也會依一般身分路徑判定。</p></StepShell>;
  if (kind === "needs") return <StepShell eyebrow="Step 5" title="你有特殊升學需求嗎？" help="只選你想了解的管道；後續只會出現相關問題，不會把所有規定一次塞給你。"><div className="grid gap-3 sm:grid-cols-2">{needs.map((item) => <OptionCard key={item.value} selected={state.specialNeeds.includes(item.value)} onClick={() => toggleNeed(item.value)} title={item.label} body={item.description} />)}</div><p className="mt-4 text-sm leading-6 jshs-muted-copy">可選「沒有／不知道」，系統會先判定一般免試入學。</p></StepShell>;
  if (kind === "cross_zone") return <ConditionalStep title="你為什麼想跨區就學？" help="跨區原因會影響要核對的文件，但是否符合仍由各區招生委員會審查。" options={[["move", "搬家"], ["parent_work", "父母工作地"], ["special_school", "特殊學校／課程"], ["identity", "特殊身分"], ["official_reason", "其他官方允許原因"], ["unknown", "不確定"]]} value={String(state.answers.crossZoneReason || "")} onChange={(value) => update({ answers: { ...state.answers, crossZoneReason: value } })} />;
  if (kind === "special_admission") return <ConditionalStep title="你想了解哪一種特殊招生？" help="這些管道需要對照目標學校的當年度招生簡章；系統不會把一般免試分數當成特色招生資格。" options={[["specialized", "特色招生／特色班"], ["arts", "藝才班"], ["sports", "體育班"], ["skill", "術科／專長甄選"], ["portfolio", "作品／面試甄選"], ["unknown", "不確定"]]} value={String(state.answers.specialAdmissionType || "")} onChange={(value) => update({ answers: { ...state.answers, specialAdmissionType: value } })} />;
  if (kind === "direct_selection") return <ConditionalStep title="直升或甄選需要確認什麼？" help="先回答你是否就讀可能辦理直升的完全中學；正式資格仍須向學校確認。" options={[["yes", "是，可能是完全中學"], ["no", "不是"], ["unknown", "不確定"]]} value={String(state.answers.directSchoolType || "")} onChange={(value) => update({ answers: { ...state.answers, directSchoolType: value } })} />;
  return <ConditionalStep title="你需要哪一類特殊教育支持？" help="資優、特殊教育安置與 IEP 是不同程序，系統會把資料不足的部分交由校內承辦人確認。" options={[["gifted_identification", "資優鑑定／安置"], ["special_placement", "特殊教育安置"], ["iep", "IEP 或學習支持"], ["exam_support", "考試與學習支持"], ["unknown", "不確定"]]} value={String(state.answers.specialEducationNeed || "")} onChange={(value) => update({ answers: { ...state.answers, specialEducationNeed: value } })} />;
}

function StepShell({ eyebrow, title, help, children }: { eyebrow: string; title: string; help: string; children: React.ReactNode }) { return <div className="mt-7"><p className="jshs-eyebrow">{eyebrow}</p><h2 className="mt-1 text-2xl">{title}</h2><div className="mt-3 rounded-2xl border border-[var(--jshs-border)] p-4 text-sm leading-6 text-[var(--jshs-ink)]"><strong>ⓘ 怎麼判斷？</strong><span className="ml-2">{help}</span></div><div className="mt-5">{children}</div></div>; }
function OptionCard({ selected, onClick, title, body }: { selected: boolean; onClick: () => void; title: string; body: string }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-20 rounded-2xl border p-4 text-left ${selected ? "border-[var(--jshs-primary)] bg-[var(--jshs-brand-tint)]" : "border-[var(--jshs-border)] bg-white"}`}><span className="flex items-start gap-3"><span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? "border-[var(--jshs-primary)] bg-[var(--jshs-primary)] text-white" : "border-[var(--jshs-border)]"}`}>{selected ? "✓" : ""}</span><span><strong className="block">{title}</strong><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{body}</span></span></span></button>; }
function ChipOption({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-black ${selected ? "border-[var(--jshs-primary)] bg-[var(--jshs-brand-tint)] text-[var(--jshs-primary)]" : "border-[var(--jshs-border)] bg-white"}`}><span aria-hidden="true">{selected ? "☑" : "□"}</span><span className="ml-2">{label}</span></button>; }
function ConditionalStep({ title, help, options, value, onChange }: { title: string; help: string; options: readonly [string, string][]; value: string; onChange: (value: string) => void }) { return <StepShell eyebrow="條件式問題" title={title} help={help}><div className="grid gap-3 sm:grid-cols-2">{options.map(([option, label]) => <ChipOption key={option} selected={value === option} onClick={() => onChange(option)} label={label} />)}</div></StepShell>; }

const statusCopy: Record<AdmissionPathRoute["status"], { label: string; icon: string; className: string }> = { eligible: { label: "符合", icon: "✓", className: "text-emerald-700" }, possibly_eligible: { label: "可能符合", icon: "△", className: "text-amber-700" }, ineligible: { label: "目前不符合", icon: "✕", className: "text-rose-700" }, needs_confirmation: { label: "需要人工／官方確認", icon: "？", className: "text-slate-700" } };

function ResultView({ result, zone, onReset }: { result: AdmissionPathResult; zone: string; onReset: () => void }) {
  if (result.error) return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="p-6 jshs-surface-card" role="alert"><p className="jshs-eyebrow">檢測無法完成</p><h1 className="mt-2">{result.error.message}</h1><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={onReset} className="px-4 py-3 text-sm jshs-button-primary">重新檢測</button><a href="/admission-guides" className="px-4 py-3 text-sm jshs-button-secondary">查看官方規定 ↗</a></div></div></section>;
  const eligible = result.routes.filter((route) => route.status === "eligible");
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-8 md:py-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="jshs-eyebrow">判定結果 · {zone}</p><h1 className="mt-2">你目前可能適用 {result.routes.length} 種升學方式</h1><p className="mt-3 text-base leading-7 jshs-muted-copy">{eligible.length ? "最主要路徑已符合基本條件；其他結果仍依你勾選的需求一併列出。" : "目前沒有足夠資料直接核定，請依各卡片的下一步確認。"}</p></div><button type="button" onClick={onReset} className="px-4 py-3 text-sm jshs-button-secondary">重新檢測</button></div><div className="mt-7 grid gap-5 lg:grid-cols-2">{result.routes.map((route, index) => <RouteResultCard key={route.routeId} route={route} primary={index === 0} />)}</div><div className="mt-6 rounded-2xl border border-[var(--jshs-border)] p-5 text-sm leading-7 jshs-muted-copy">這是依你提供的資料與本站目前規則資料產生的整理結果，不是招生委員會的正式資格核定。重要事項請以卡片中的官方文件與學校／招生委員會確認。</div></section>;
}

function RouteResultCard({ route, primary }: { route: AdmissionPathRoute; primary: boolean }) { const status = statusCopy[route.status]; return <article className={`p-5 md:p-6 jshs-surface-card ${primary ? "ring-2 ring-[var(--jshs-primary)]/20" : ""}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-[var(--jshs-primary)]">{primary ? "最主要路徑" : route.category}</p><h2 className="mt-1">{route.title}</h2></div><span className={`rounded-full bg-[var(--jshs-muted-surface)] px-3 py-2 text-sm font-black ${status.className}`}>{status.icon} {status.label}</span></div><p className="mt-3 text-sm leading-6 jshs-muted-copy">{route.status === "needs_confirmation" ? "目前資料不足以自動判定，請依下方缺口完成確認。" : route.status === "possibly_eligible" ? "符合部分條件，但仍需核對正式身分、名額或文件。" : route.status === "eligible" ? "目前提供的資料符合本站已核對的基本條件。" : "目前提供的資料不符合這條路徑的基本條件。"}</p><ResultList title="判定原因" items={route.reasons} /><ResultList title="還要確認" items={route.missingInformation} emptyLabel="目前沒有額外缺口" /><ResultList title="應備文件" items={route.requiredDocuments} /><ResultList title="下一步" items={route.nextSteps} /><div className="mt-5 grid gap-2 border-t border-[var(--jshs-border)] pt-4">{route.nextActions.map((action) => <a key={`${action.href}-${action.label}`} href={action.href} className="rounded-xl bg-[var(--jshs-brand-tint)] px-4 py-3 text-sm font-black text-[var(--jshs-primary)]">{action.label} ↗</a>)}</div><div className="mt-5 grid gap-3">{route.officialSources.map((source) => <SourceCard key={`${source.officialSourceUrl}-${source.officialSourcePage}`} source={source} />)}</div></article>; }
function ResultList({ title, items, emptyLabel }: { title: string; items: readonly string[]; emptyLabel?: string }) { return <section className="mt-5"><h3 className="text-base">{title}</h3>{items.length ? <ul className="mt-2 grid gap-2 text-sm leading-6 text-[var(--jshs-muted)]">{items.map((item) => <li key={item} className="rounded-xl bg-[var(--jshs-muted-surface)] p-3">{item}</li>)}</ul> : <p className="mt-2 text-sm text-[var(--jshs-muted)]">{emptyLabel || "目前沒有列出項目"}</p>}</section>; }
function SourceCard({ source }: { source: AdmissionPathRoute["officialSources"][number] }) { return <div className="rounded-xl border border-[var(--jshs-border)] p-3 text-sm"><strong className="block">判定依據</strong><p className="mt-1 leading-6 jshs-muted-copy">{source.officialSourceTitle}</p><p className="mt-1 text-xs leading-5 jshs-muted-copy">頁面／章節：{source.officialSourcePage} · 最後核對：{source.lastVerifiedAt} · 狀態：{source.verificationStatus}</p><div className="mt-2 flex flex-wrap gap-3"><a href={source.officialSourceUrl} target="_blank" rel="noreferrer" className="font-black text-[var(--jshs-primary)]">開啟對應簡章 ↗</a><a href={source.officialWebsiteUrl} target="_blank" rel="noreferrer" className="font-black text-[var(--jshs-primary)]">前往官方網站 ↗</a></div></div>; }
