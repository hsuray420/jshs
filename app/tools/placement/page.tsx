import type { Metadata } from "next";
import { ScorePlacementWorkspace } from "@/components/score-workspaces";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "模擬考先估落點｜全國國中升學資訊網", alternates: { canonical: "/tools/placement" }, robots: { index: false, follow: false } };
export default async function ScorePlacementPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><FeatureHero theme="tools" eyebrow="算成績 · 模擬考落點" title="先用已完成的試算整理下一步" description="目前不提供不具可信依據的錄取預測；可回查歷史資料與志願選項。" illustration="placement" /><ScorePlacementWorkspace isMember={Boolean(await getMemberSession())} /><SiteFooter /></main>; }
