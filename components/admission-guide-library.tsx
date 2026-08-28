"use client";

import { useMemo, useState } from "react";
import guideCatalog from "@/data/admission-guides.json";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR } from "@/lib/trust";
import { SourceBadge } from "@/components/source-badge";

type Guide = (typeof guideCatalog.guides)[number];

export function AdmissionGuideLibrary() {
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState("all");
  const guides = useMemo(() => guideCatalog.guides.filter((guide) => selectedCode === "all" || guide.code === selectedCode).filter((guide) => guide.label.includes(query.trim())), [query, selectedCode]);

  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-8 md:py-12" aria-labelledby="guide-library-title">
    <div className="p-6 md:p-8 jshs-surface-card">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="jshs-eyebrow">官方簡章資料庫 · {SERVICE_YEAR} 學年度服務</p><h1 id="guide-library-title" className="mt-2">{SERVICE_YEAR} 學年度各區官方資訊</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">目前可查閱 {guideCatalog.guides.length} 區官方原始簡章。{SOURCE_ACADEMIC_YEAR} 學年度文件僅作來源參考，不冒充 {SERVICE_YEAR} 正式簡章。</p></div><div className="flex flex-wrap items-center gap-2"><SourceBadge sourceType="official" /><span className="jshs-chip">來源年度 {SOURCE_ACADEMIC_YEAR}</span></div></div>
      <div className="mt-6 rounded-2xl bg-[var(--jshs-brand-tint)] p-4 text-sm leading-7 text-[var(--jshs-primary)]"><strong>年度狀態：116 正式簡章待公告</strong><p className="mt-1">以下 PDF 與官方網站是官方原始資料；服務年度為 116，已標示的 115 文件只供核對制度與等待新公告期間參考。</p></div>
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋就學區<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：中投、基北、花蓮" /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">快速篩選<select value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)}><option value="all">全部 15 區</option>{guideCatalog.guides.map((guide) => <option key={guide.code} value={guide.code}>{guide.label}</option>)}</select></label></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{guides.map((guide) => <GuideCard key={guide.code} guide={guide} />)}</div>
      {!guides.length ? <div className="mt-6 rounded-2xl border border-dashed border-[var(--jshs-border)] p-8 text-center text-sm leading-6 jshs-muted-copy">找不到相符的就學區，請改用區名搜尋。</div> : null}
    </div>
  </section>;
}

function GuideCard({ guide }: { guide: Guide }) {
  return <article className="flex min-h-52 flex-col p-5 jshs-surface-card"><div className="flex items-start justify-between gap-3"><div><p className="jshs-eyebrow">免試就學區</p><h2 className="mt-1 text-xl">{guide.label}</h2></div><span className="jshs-chip">{guide.pages} 頁</span></div><div className="mt-3 flex items-center gap-2"><SourceBadge sourceType="official" /><span className="text-xs text-slate-500">來源年度 {SOURCE_ACADEMIC_YEAR}</span></div><p className="mt-3 text-sm leading-6 jshs-muted-copy">{SOURCE_ACADEMIC_YEAR} 學年度官方免試入學簡章；{SERVICE_YEAR} 正式版本待各區公告。</p><div className="mt-auto flex flex-wrap gap-2 pt-5"><a href={guide.file} target="_blank" rel="noreferrer" className="px-3 py-2 text-sm jshs-button-primary">開啟閱讀 ↗</a><a href={guide.file} download className="px-3 py-2 text-sm jshs-button-secondary">下載 PDF</a><a href={guide.sourceUrl} target="_blank" rel="noreferrer" className="px-3 py-2 text-sm jshs-button-secondary">官方網站 ↗</a></div></article>;
}
