import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SourceBadge } from "@/components/source-badge";
import districtMetadata from "../../public/it_hs/district-metadata.json";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR, VERIFICATION_STATUS } from "@/lib/trust";

export const metadata: Metadata = {
  title: "官方最新公告｜官方資訊｜全國國中升學資訊網",
  description: "查看各教育與招生單位的官方來源入口；116 學年度公告狀態與來源年度清楚分開。",
  alternates: { canonical: "/news" },
};

export default function OfficialAnnouncementsPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/admission-guides" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">官方資訊 · 官方最新公告</p><h1 className="mt-3 max-w-4xl">只看得到可回查的官方來源。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">本頁不放 JSHS 推估、社群內容或個人待辦。公告標題、發布日期與適用年度，請以各教育與招生單位的原始頁面為準。</p></div></section><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><div className="grid gap-4 md:grid-cols-3"><article className="p-6 jshs-surface-card"><SourceBadge sourceType="official" /><h2 className="mt-3 text-xl">{SERVICE_YEAR} 學年度</h2><p className="mt-2 text-sm leading-7 jshs-muted-copy">{VERIFICATION_STATUS === "awaiting_116_official_release" ? "目前尚未有可由本站確認的 116 正式公告彙整。" : "已完成來源校核。"}</p></article><article className="p-6 jshs-surface-card"><SourceBadge sourceType="official" /><h2 className="mt-3 text-xl">公告資料狀態</h2><p className="mt-2 text-sm leading-7 jshs-muted-copy">116 正式簡章與各區招生日期，請直接開啟下方官方網站查看最新版本。</p></article><article className="p-6 jshs-surface-card"><SourceBadge sourceType="official" /><h2 className="mt-3 text-xl">來源年度界線</h2><p className="mt-2 text-sm leading-7 jshs-muted-copy">頁面可查到的 {SOURCE_ACADEMIC_YEAR} 文件仍只標示為來源參考，不改名成 {SERVICE_YEAR}。</p></article></div><div className="mt-6 rounded-2xl border border-dashed border-[var(--jshs-border)] p-6 text-sm leading-7 text-slate-700" role="status"><strong>目前沒有本站可直接驗證的 116 最新公告。</strong><p className="mt-1">請依就學區開啟官方來源；看到新公告後，也可從資料與信任回報來源或資料版本。</p></div><div className="mt-8"><p className="jshs-eyebrow">各區官方公告入口</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(districtMetadata.districts).map(([code, district]) => <article key={code} className="p-5 jshs-surface-card"><div className="flex items-start justify-between gap-3"><h2 className="text-lg">{district.label}</h2><span className="jshs-chip">官方</span></div><p className="mt-2 text-sm leading-6 jshs-muted-copy">{district.sourceName}</p><p className="mt-2 text-xs text-slate-500">目前可查來源年度：{district.academicYear}</p><a href={district.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center px-4 py-3 text-sm jshs-button-primary">開啟官方公告 ↗</a></article>)}</div></div></section><SiteFooter /></main>;
}
