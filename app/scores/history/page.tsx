import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { MockScoreEmptyState } from "@/components/mock-score-empty-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "我的模考｜成績分析｜全國國中升學資訊網", alternates: { canonical: "/scores/history" }, robots: { index: false, follow: false } };
export default function MockHistoryPage() { return <main className="min-h-screen jshs-page-shell jshs-feature-score"><SiteHeader activeHref="/scores/mock" /><FeatureHero theme="tools" eyebrow="成績分析 · 我的模考" title="我的模考紀錄" description="這裡會顯示已保存的模擬考紀錄；目前不以空資料產生假紀錄。" illustration="score-history" /><MockScoreEmptyState /><SiteFooter /></main>; }
