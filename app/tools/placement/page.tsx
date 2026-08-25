import type { Metadata } from "next";
import { ScorePlacementWorkspace } from "@/components/score-workspaces";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "模擬考先估落點｜全國國中升學資訊網", alternates: { canonical: "/tools/placement" }, robots: { index: false, follow: false } };
export default function ScorePlacementPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><ScorePlacementWorkspace /><SiteFooter /></main>; }
