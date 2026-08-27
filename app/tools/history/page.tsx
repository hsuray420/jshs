import type { Metadata } from "next";
import { ScoreHistoryWorkspace } from "@/components/score-workspaces";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = { title: "成績歷史紀錄｜全國國中升學資訊網", alternates: { canonical: "/tools/history" }, robots: { index: false, follow: false } };
export default async function ScoreHistoryPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><ScoreHistoryWorkspace isMember={Boolean(await getMemberSession())} /><SiteFooter /></main>; }
