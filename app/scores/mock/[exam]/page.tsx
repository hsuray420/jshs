import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { MockScoreEmptyState } from "@/components/mock-score-empty-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "模擬考資料｜成績分析｜全國國中升學資訊網", robots: { index: false, follow: false } };
export default async function MockExamPage({ params }: { params: Promise<{ exam: string }> }) { const { exam } = await params; return <main className="min-h-screen jshs-page-shell jshs-feature-score"><SiteHeader activeHref="/scores" /><FeatureHero theme="tools" eyebrow="成績分析 · 模擬考" title="模擬考資料" description="本頁只承接指定模考入口；可驗證資料載入前不顯示答案或推估結果。" illustration="score-history" /><MockScoreEmptyState examName={decodeURIComponent(exam)} /><SiteFooter /></main>; }
