import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SourceBadge } from "@/components/source-badge";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR, VERIFICATION_STATUS } from "@/lib/trust";

export const metadata: Metadata = { title: "資料與信任", description: "查看 JSHS 的資料來源、更新狀態、試算方法、版本與更正機制。", alternates: { canonical: "/trust" } };

const sections = [
  ["sources", "資料來源", "查看官方來源、JSHS 整理方式，以及官方、計算、推估與社群資料的界線。"],
  ["status", "資料更新狀態", "查看最後更新、最後校核、資料年度、服務年度與 116 公告狀態。"],
  ["progress", "15 區建置進度", "15 個就學區皆已接入規則、試算與志願規劃流程。"],
  ["methodology", "試算與分析方法", "說明規則資料、試算引擎、推薦分層與推估限制。"],
  ["versions", "資料版本紀錄", "查看目前資料版本、來源更新與規則校核事件。"],
  ["report", "錯誤回報", "回報學校、科別、名額、規則、日期、來源或功能問題。"],
  ["credibility", "平台可信度說明", "了解 JSHS 的角色、校核方式、官方界線與更正機制。"],
] as const;

export default function TrustPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/trust" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">資料與信任</p><h1 className="mt-3 max-w-4xl">資料越多，越需要知道它的邊界。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">這些頁面是升學決策的一部分：告訴你資料如何整理、何時更新、可以怎麼使用，以及什麼情況仍要回到官方核對。</p></div></section><TrustStatus /><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sections.map(([slug, title, body]) => <Link key={slug} href={`/trust/${slug}`} className="p-5 jshs-surface-card"><span className="jshs-chip">信任說明</span><h2 className="mt-3 text-lg">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><span className="mt-4 block text-sm text-[var(--jshs-primary)]">前往說明 →</span></Link>)}</div></section><SiteFooter /></main>;
}

function TrustStatus() {
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pt-8"><div className="grid gap-3 md:grid-cols-3"><article className="p-5 jshs-surface-card"><SourceBadge sourceType="jshs_curated" /><h2 className="mt-3 text-lg">{SERVICE_YEAR} 服務年度</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前狀態：{VERIFICATION_STATUS === "awaiting_116_official_release" ? "116 正式規則待公告" : "已校核"}。</p></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="official_based_calculation" /><h2 className="mt-3 text-lg">規則來源年度</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前試算暫依 {SOURCE_ACADEMIC_YEAR} 學年度官方規則，不將來源年度改寫成 116。</p></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="jshs_estimated" /><h2 className="mt-3 text-lg">15 區皆可使用</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">每個就學區都能試算、填志願並查看規則來源。</p></article></div></section>;
}
