import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SourceBadge } from "@/components/source-badge";
import districtMetadata from "../../../public/it_hs/district-metadata.json";
import { getDistrictAdmissionSchedule, type AdmissionScheduleStatus } from "@/lib/admission-schedules";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR } from "@/lib/trust";

export const metadata: Metadata = {
  title: "官方招生時程｜官方資訊｜全國國中升學資訊網",
  description: "查看各就學區官方招生時程的公告狀態、來源年度與原始官方來源。",
  alternates: { canonical: "/admission-guides/schedule" },
};

const labels: Record<AdmissionScheduleStatus, string> = {
  confirmed: "已公告",
  pending: "待公告",
  previous_year_reference: "上年度參考",
  provisional: "暫定，請再核對",
};

export default function OfficialSchedulePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/admission-guides" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">官方資訊 · 官方招生時程</p><h1 className="mt-3 max-w-4xl">各區正式日期，只按官方狀態呈現。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">本頁只呈現官方原始資料與公告狀態，不提供 JSHS 建議或推估。{SERVICE_YEAR} 正式公告尚未確認時，{SOURCE_ACADEMIC_YEAR} 日期會保留為上年度參考。</p></div></section><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><div className="flex items-center gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><SourceBadge sourceType="official" /><p className="text-sm leading-6 text-slate-700">請以各區官方網站的最新公告、正式簡章與平台通知為準。</p></div><div className="mt-6 grid gap-4">{Object.entries(districtMetadata.districts).map(([code, district]) => <DistrictSchedule key={code} code={code} district={district} />)}</div></section><SiteFooter /></main>;
}

function DistrictSchedule({ code, district }: { code: string; district: { label: string; sourceName: string; sourceUrl: string; academicYear: string } }) {
  const schedule = getDistrictAdmissionSchedule(code);
  return <article className="p-6 jshs-surface-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="jshs-eyebrow">{district.sourceName}</p><h2 className="mt-2 text-2xl">{district.label}</h2></div><SourceBadge sourceType="official" /></div><div className="mt-5 grid gap-2">{schedule.length ? schedule.map((item) => <div key={item.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap items-center gap-3"><strong className="text-[var(--jshs-primary)]">{item.eventDate}</strong><span className="jshs-chip">{labels[item.status]}</span><h3 className="text-base">{item.title}</h3></div><p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.description}</p><p className="mt-1 text-xs text-slate-500">來源頁碼：{item.sourcePages} · {district.academicYear} 學年度</p></div>) : <div className="rounded-2xl border border-dashed border-[var(--jshs-border)] p-5"><span className="jshs-chip">待公告</span><h3 className="mt-3 text-lg">{SERVICE_YEAR} 正式招生時程待公告</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前沒有可由本站確認的正式日期，請開啟官方網站查看最新公告。</p></div>}</div><a href={district.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center px-4 py-3 text-sm jshs-button-secondary">開啟 {district.label} 官方來源 ↗</a></article>;
}
