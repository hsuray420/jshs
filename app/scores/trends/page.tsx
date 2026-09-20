import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { MockScoreEmptyState } from "@/components/mock-score-empty-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "成績趨勢｜成績分析｜全國國中升學資訊網", alternates: { canonical: "/scores/trends" }, robots: { index: false, follow: false } };
export default function ScoreTrendsPage() { return <main className="min-h-screen jshs-page-shell jshs-feature-score"><SiteHeader activeHref="/scores/mock" /><FeatureHero theme="tools" eyebrow="成績分析 · 成績趨勢" title="用已保存成績查看變化" description="趨勢需要真實保存的模考資料；資料不足時只顯示空狀態，不產生推估線。" illustration="score-summary" /><MockScoreEmptyState /><SiteFooter /></main>; }
