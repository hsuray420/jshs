import type { Metadata } from "next";
import { ScoreSummaryWorkspace } from "@/components/score-workspaces";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "個人積分摘要｜全國國中升學資訊網", alternates: { canonical: "/tools/summary" }, robots: { index: false, follow: false } };
export default async function ScoreSummaryPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><FeatureHero theme="tools" eyebrow="算成績 · 個人積分摘要" title="把最近一次試算整理成可核對的摘要" description="保留就學區、年度與規則來源，方便下一步選填前再次確認。" illustration="score-summary" /><ScoreSummaryWorkspace isMember={Boolean(await getMemberSession())} /><SiteFooter /></main>; }
