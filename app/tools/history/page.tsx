import type { Metadata } from "next";
import { ScoreHistoryWorkspace } from "@/components/score-workspaces";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "成績歷史紀錄｜全國國中升學資訊網", alternates: { canonical: "/tools/history" }, robots: { index: false, follow: false } };
export default async function ScoreHistoryPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><FeatureHero theme="tools" eyebrow="算成績 · 成績歷史" title="回看每一次試算採用的規則與年度" description="歷史紀錄會保留來源年度與就學區；未登入資料只留在此裝置。" illustration="score-history" /><ScoreHistoryWorkspace isMember={Boolean(await getMemberSession())} /><SiteFooter /></main>; }
