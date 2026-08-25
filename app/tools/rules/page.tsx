import type { Metadata } from "next";
import { ScoreRulesWorkspace } from "@/components/score-workspaces";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "積分與序位換算說明｜全國國中升學資訊網", alternates: { canonical: "/tools/rules" } };
export default function ScoreRulesPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><ScoreRulesWorkspace /><SiteFooter /></main>; }
