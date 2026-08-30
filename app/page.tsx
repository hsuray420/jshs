import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import { SourceBadge } from "@/components/source-badge";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { PageContainer } from "@/components/ui/layout";
import { HomeProgress } from "@/components/home-progress";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR, VERIFICATION_STATUS } from "@/lib/trust";

const homeTitle = "116 學年度升學 Dashboard｜全國國中升學資訊網";
const homeDescription = "從就學區、成績試算、校科探索到志願規劃，沿著一條清楚的升學流程前進。";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "zh_TW", url: "/", siteName: "全國國中升學資訊網", title: homeTitle, description: homeDescription },
  twitter: { card: "summary", title: homeTitle, description: homeDescription },
};

const officialDistricts = Object.entries(districtMetadata.districts).slice(0, 3);

export default function HomePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader /><section className="border-b jshs-hero-section"><PageContainer size="wide" className="pb-10 pt-12 md:pb-16 md:pt-20"><p className="jshs-eyebrow">{SERVICE_YEAR} 學年度升學 Dashboard</p><h1 className="mt-3 max-w-4xl text-4xl leading-tight md:text-6xl">先知道下一步，再開始做決定。</h1><p className="mt-5 max-w-3xl text-base leading-8 jshs-muted-copy">用同一個就學區情境，完成規則理解、成績試算、校科比較與志願健檢；官方資料、JSHS 計算與推估會清楚分開。</p><div className="mt-8 grid gap-4 md:grid-cols-3"><TaskCard icon="calculator" tone="blue" title="算我的積分" body="先確認就學區，再依目前可用規則完成試算。" href="/tools" action="開始試算" /><TaskCard icon="school" tone="green" title="找學校" body="用就學區、縣市、學制、群科與科別找校科。" href="/schools" action="開始查詢" /><TaskCard icon="planner" tone="blue" title="規劃志願" body="把校科加入同一份清單，自己排或查看系統推薦。" href="/planner" action="開始規劃" /></div></PageContainer></section><HomeProgress /><PageContainer as="section" aria-labelledby="status-title" className="py-8"><SectionHeading eyebrow="116 學年度狀態" id="status-title" title="目前服務年度與資料邊界" body="115 官方資料不會被改名成 116；正式公告後再重新校核。"/><div className="mt-6 grid gap-3 md:grid-cols-3"><article className="p-5 jshs-surface-card"><SourceBadge sourceType="jshs_curated" /><h3 className="mt-3 text-xl">{SERVICE_YEAR} 學年度服務</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前狀態：{VERIFICATION_STATUS === "awaiting_116_official_release" ? "116 正式規則待公告" : "已完成校核"}。</p></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="official_based_calculation" /><h3 className="mt-3 text-xl">試算規則來源</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前暫依 {SOURCE_ACADEMIC_YEAR} 學年度官方規則，結果不是官方試算結果。</p><Link href="/tools/rules" className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]">查看積分規則 →</Link></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="jshs_estimated" /><h3 className="mt-3 text-xl">目前可用試算</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">15 個就學區皆已接入規則，可直接試算並規劃志願。</p><Link href="/trust/progress" className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]">查看建置進度 →</Link></article></div></PageContainer><section aria-labelledby="dates-title" className="border-y border-[var(--jshs-border)] py-8 jshs-section-subtle"><PageContainer><SectionHeading eyebrow="近期重要時間" id="dates-title" title="正式日期按公告狀態呈現" body="目前沒有本站可直接確認的 116 學年度正式日期。"/><div className="mt-6 grid gap-3 md:grid-cols-2"><article className="p-5 jshs-surface-card"><span className="jshs-chip">待公告</span><h3 className="mt-3 text-xl">116 學年度國中教育會考</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">正式日期尚待官方發布；不使用推估日期做倒數。</p></article><article className="p-5 jshs-surface-card"><span className="jshs-chip">官方資訊</span><h3 className="mt-3 text-xl">各區招生時程</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">各區簡章、報名、選填與放榜日期請以官方來源為準。</p><Link href="/admission-guides/schedule" className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]">查看官方招生時程 →</Link></article></div></PageContainer></section><PageContainer as="section" aria-labelledby="official-title" className="py-8"><SectionHeading eyebrow="官方最新更新" id="official-title" title="從官方來源查看最新公告" body="本站不把 JSHS 編輯內容混進官方資訊。"/><div className="mt-6 grid gap-3 md:grid-cols-3">{officialDistricts.map(([code, district]) => <article key={code} className="p-5 jshs-surface-card"><SourceBadge sourceType="official" /><h3 className="mt-3 text-xl">{district.label}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{district.sourceName}</p><p className="mt-2 text-xs text-slate-500">目前可查來源年度：{district.academicYear}</p><a href={district.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]">開啟官方公告 ↗</a></article>)}</div><Link href="/news" className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]">查看全部官方公告入口 →</Link></PageContainer><SiteFooter /></main>;
}

function SectionHeading({ eyebrow, id, title, body }: { eyebrow: string; id: string; title: string; body: string }) {
  return <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="jshs-eyebrow">{eyebrow}</p><h2 id={id} className="mt-2 text-2xl font-black md:text-3xl">{title}</h2></div><p className="max-w-md text-sm leading-6 jshs-muted-copy">{body}</p></div>;
}

function TaskCard({ icon, tone, title, body, href, action }: { icon: SiteIconName; tone: "blue" | "green"; title: string; body: string; href: string; action: string }) {
  return <Link href={href} className="group p-[14px] jshs-surface-card"><span className={"jshs-icon-tile jshs-task-icon " + (tone === "green" ? "is-success" : "")} aria-hidden="true"><SiteIcon name={icon} size={18} /></span><h2 className="mt-4">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><b className="mt-4 block text-sm text-[var(--jshs-primary)]">{action} <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}
