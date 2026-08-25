import type { Metadata } from "next";
import { ScoreSummaryWorkspace } from "@/components/score-workspaces";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "個人積分摘要｜全國國中升學資訊網", alternates: { canonical: "/tools/summary" }, robots: { index: false, follow: false } };
export default function ScoreSummaryPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><ScoreSummaryWorkspace /><SiteFooter /></main>; }
