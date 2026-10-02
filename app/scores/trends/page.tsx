import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { MockExamWorkspace } from "@/components/mock-exam-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "成績趨勢｜成績分析｜全國國中升學資訊網", alternates: { canonical: "/scores/trends" }, robots: { index: false, follow: false } };
export default function ScoreTrendsPage() { return <main className="min-h-screen jshs-page-shell jshs-feature-mock-exam"><SiteHeader activeHref="/scores/mock" /><FeatureHero theme="mock-exam" eyebrow="模擬考 · 成績趨勢" title="用已保存成績查看變化" description="只根據你保存的模考資料分析科目變化。" illustration="score-summary" /><MockExamWorkspace mode="trends" /><SiteFooter /></main>; }
