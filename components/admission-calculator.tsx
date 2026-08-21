"use client";

import { useState } from "react";

const subjects = [
  ["chineseGrade", "國文"], ["mathGrade", "數學"], ["englishGrade", "英語"],
  ["socialGrade", "社會"], ["scienceGrade", "自然"],
] as const;
const grades = ["A++", "A+", "A", "B++", "B+", "B", "C"];

type Result = {
  totalScore: number;
  otherItems: { otherItemsTotal: number; multipleLearningScore: number };
  exam: { examPerformanceScore: number; examTotalPoints: number };
};

export function AdmissionCalculator({ initialDistrict }: { initialDistrict: "ct" | "tp" }) {
  const [district, setDistrict] = useState(initialDistrict);
  const [exam, setExam] = useState<Record<string, string>>(Object.fromEntries(subjects.map(([key]) => [key, "B"])));
  const [writingLevel, setWritingLevel] = useState(4);
  const [balanced, setBalanced] = useState<Record<string, boolean>>({ healthAndPE: true, arts: true, integrativeActivities: true, technology: true });
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState("");

  async function calculate() {
    if (district !== "ct") { setStatus("基北區規則正在校核；目前不以未核定公式產生分數。可先使用找學校與我的規劃。"); setResult(null); return; }
    setStatus("計算中…");
    const response = await fetch("/api/admission/calculate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        enrollmentDistrictStatus: "CT_MAIN_DISTRICT",
        balancedLearning: balanced,
        clubEligibleSemesters: 2,
        serviceHoursBySemester: [6, 6, 6],
        rewards: {},
        exam: { ...exam, writingLevel, violationPoints: 0 },
      }),
    });
    const payload = await response.json() as { result?: Result };
    setResult(payload.result || null);
    setStatus(response.ok ? "依 115 學年度中投區已建置規則完成試算。" : "試算失敗，請稍後重試。");
  }

  return (
    <>
      <section className="border-b jshs-hero-section">
        <div className="mx-auto w-[min(1040px,calc(100%-32px))] py-10 md:py-12">
          <p className="jshs-eyebrow">試算工具</p>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">輸入會考資料，先估算中投區積分。</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">試算只作為規劃輔助，正式結果仍以當年度招生委員會資料為準。</p>
        </div>
      </section>
      <section className="mx-auto grid w-[min(1040px,calc(100%-32px))] gap-5 py-8 lg:grid-cols-[1fr_320px]">
        <div className="p-5 jshs-surface-card md:p-6">
          <label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select className="h-12 rounded-full border border-[var(--jshs-border)] bg-white/70 px-4 text-base" value={district} onChange={(event) => setDistrict(event.target.value as "ct" | "tp")}><option value="ct">中投區（115 已建置）</option><option value="tp">基北區（規則校核中）</option></select></label>
          <h2 className="mt-8 text-2xl font-black">會考成績</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {subjects.map(([key, label]) => <label key={key} className="grid gap-2 text-sm font-bold text-[var(--jshs-muted)]">{label}<select className="h-12 rounded-full border border-[var(--jshs-border)] bg-white/70 px-4 text-base text-[var(--jshs-ink)]" value={exam[key]} onChange={(event) => setExam((current) => ({ ...current, [key]: event.target.value }))}>{grades.map((grade) => <option key={grade}>{grade}</option>)}</select></label>)}
            <label className="grid gap-2 text-sm font-bold text-[var(--jshs-muted)]">作文級分<input className="h-12 rounded-full border border-[var(--jshs-border)] bg-white/70 px-4 text-base" type="number" min="0" max="6" value={writingLevel} onChange={(event) => setWritingLevel(Number(event.target.value))} /></label>
          </div>
          <h2 className="mt-8 text-2xl font-black">均衡學習</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries({ healthAndPE: "健康與體育", arts: "藝術", integrativeActivities: "綜合活動", technology: "科技" }).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-[1.5rem] bg-[var(--jshs-muted-surface)] p-4 font-bold"><input type="checkbox" checked={balanced[key]} onChange={(event) => setBalanced((current) => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div>
          <button type="button" onClick={calculate} className="mt-8 w-full px-5 py-4 jshs-button-primary">開始試算</button>
        </div>
        <aside className="bg-[var(--jshs-primary)] p-6 text-white jshs-surface-card">
          <p className="text-xs font-black tracking-[.16em] text-[var(--jshs-accent)]">RESULT</p>
          {result ? <><strong className="mt-5 block text-6xl font-black">{result.totalScore}</strong><span className="text-sm text-[var(--jshs-primary-foreground)]">總積分／100</span><dl className="mt-8 grid gap-4 text-sm"><div><dt className="text-[var(--jshs-accent)]">會考表現積分</dt><dd className="mt-1 text-xl font-black">{result.exam.examPerformanceScore}</dd></div><div><dt className="text-[var(--jshs-accent)]">會考積點</dt><dd className="mt-1 text-xl font-black">{result.exam.examTotalPoints}</dd></div><div><dt className="text-[var(--jshs-accent)]">其他項目</dt><dd className="mt-1 text-xl font-black">{result.otherItems.otherItemsTotal}</dd></div></dl></> : <p className="mt-5 leading-7 text-[var(--jshs-primary-foreground)]">填寫左側資料後開始試算。這裡不會引用第三方落點資料，也不宣稱保證錄取。</p>}
          {status ? <p className="mt-7 rounded-[1.5rem] bg-white/10 p-4 text-sm leading-6 text-[var(--jshs-primary-foreground)]">{status}</p> : null}
          <a className="mt-6 inline-block text-sm font-black text-white underline" href="/planner">前往我的規劃 →</a>
        </aside>
      </section>
    </>
  );
}
