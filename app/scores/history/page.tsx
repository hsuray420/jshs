import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { MockExamWorkspace } from "@/components/mock-exam-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = { title: "我的模考｜成績分析｜全國國中升學資訊網", alternates: { canonical: "/scores/history" }, robots: { index: false, follow: false } };
export default async function MockHistoryPage() { const isMember = Boolean(await getMemberSession()); return <main className="min-h-screen jshs-page-shell jshs-feature-mock-exam"><SiteHeader activeHref="/scores/mock" /><FeatureHero theme="mock-exam" eyebrow="模擬考 · 我的模考" title="我的模考紀錄" description="建立、保存與管理自己的模考資料。" illustration="score-history" /><MockExamWorkspace isMember={isMember} /><SiteFooter /></main>; }
