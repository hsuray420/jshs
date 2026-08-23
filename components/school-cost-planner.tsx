"use client";

import { useMemo, useState } from "react";

type CostState = Readonly<{ tuition: number; supplies: number; learning: number; transport: number; housing: number; other: number }>;
const initialCost: CostState = { tuition: 0, supplies: 0, learning: 0, transport: 0, housing: 0, other: 0 };

export function SchoolCostPlanner() {
  const [cost, setCost] = useState<CostState>(initialCost);
  const [years, setYears] = useState(3);
  const semesterTotal = cost.tuition + cost.supplies + cost.learning;
  const monthlyTotal = cost.transport + cost.housing + cost.other;
  const estimate = useMemo(() => ({ perYear: semesterTotal * 2 + monthlyTotal * 12, total: (semesterTotal * 2 + monthlyTotal * 12) * years }), [monthlyTotal, semesterTotal, years]);

  function setValue(key: keyof CostState, value: string) {
    const next = Math.max(0, Number(value) || 0);
    setCost((current) => ({ ...current, [key]: next }));
  }

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">費用試算</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">把三年可能的支出，先攤開來看。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">輸入你自己的學雜費、用品、交通與住宿假設，得到一個可調整的估算。這不是官方收費，也不會自動推測補助或家庭支出。</p></div></section>
    <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-6 py-8 md:grid-cols-[1.2fr_.8fr] md:py-12"><div className="p-5 jshs-surface-card md:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">輸入假設</p><h2 className="mt-2 text-2xl font-black">每學期與每月費用</h2></div><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就讀年數<select value={years} onChange={(event) => setYears(Number(event.target.value))}><option value="3">3 年</option><option value="2">2 年</option><option value="4">4 年</option></select></label></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><CostInput label="每學期學雜費" value={cost.tuition} onChange={(value) => setValue("tuition", value)} /><CostInput label="制服與用品／每學期" value={cost.supplies} onChange={(value) => setValue("supplies", value)} /><CostInput label="教材與學習／每學期" value={cost.learning} onChange={(value) => setValue("learning", value)} /><CostInput label="交通費／每月" value={cost.transport} onChange={(value) => setValue("transport", value)} /><CostInput label="住宿費／每月" value={cost.housing} onChange={(value) => setValue("housing", value)} /><CostInput label="其他生活費／每月" value={cost.other} onChange={(value) => setValue("other", value)} /></div><button type="button" className="mt-5 text-sm font-black text-[var(--jshs-primary)]" onClick={() => setCost(initialCost)}>清除估算</button></div><aside className="p-5 jshs-surface-card md:p-7"><p className="jshs-eyebrow">估算結果</p><h2 className="mt-2 text-2xl font-black">{years} 年約</h2><p className="mt-5 text-4xl font-black text-[var(--jshs-primary)]">{formatMoney(estimate.total)}</p><dl className="mt-6 grid gap-3 text-sm"><div className="flex justify-between gap-4"><dt className="jshs-muted-copy">每年估算</dt><dd className="font-black">{formatMoney(estimate.perYear)}</dd></div><div className="flex justify-between gap-4"><dt className="jshs-muted-copy">每學期項目</dt><dd className="font-black">{formatMoney(semesterTotal)}</dd></div><div className="flex justify-between gap-4"><dt className="jshs-muted-copy">每月項目</dt><dd className="font-black">{formatMoney(monthlyTotal)}</dd></div></dl><p className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-xs leading-6 text-slate-600">公式：每學期項目 × 2 ＋ 每月項目 × 12，再乘以就讀年數。正式收費、減免、補助與住宿規定請回到學校或政府公告核對。</p></aside></section>
  </>;
}

function CostInput({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{label}<div className="flex items-center gap-2"><input type="number" min="0" step="100" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="0" /><span className="text-xs font-bold text-slate-400">元</span></div></label>;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("zh-TW").format(value)} 元`;
}
