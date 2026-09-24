import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";
import guideNavigation from "@/content/guide/navigation.json";

export const metadata: Metadata = {
  title: "升學指南｜全國國中升學資訊網",
  description: "從升學入門、志願與積分、特殊入學與資格、升學百科到生涯探索，建立升學判斷。",
  alternates: { canonical: "/knowledge" },
};

// 升學動態與其他指南分類由 content/guide/navigation.json 統一維護。
const guideSections = guideNavigation.sections;

export default function KnowledgePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><FeatureHero theme="guide" eyebrow="升學指南" title="先建立升學全貌，再做自己的選擇" description="白話理解制度與探索方向；精確規則與官方公告仍可回到對應功能核對。" illustration="guide" /><section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{guideSections.map(([title, body, href]) => <Link key={title} href={href} className="group flex min-h-52 flex-col p-6 jshs-surface-card"><h2 className="text-2xl">{title}</h2><p className="mt-3 flex-1 text-sm leading-7 jshs-muted-copy">{body}</p><span className="mt-5 text-sm font-black text-[var(--jshs-primary)]">開始了解 →</span></Link>)}</div></section><SiteFooter /></main>;
}
