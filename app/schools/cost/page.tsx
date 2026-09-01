import type { Metadata } from "next";
import { SchoolCostPlanner } from "@/components/school-cost-planner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "費用試算｜找學校｜全國國中升學資訊網", description: "區分官方金額、JSHS 估算與自行輸入的升學費用。", alternates: { canonical: "/schools/cost" } };

export default function CostRoute() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="找學校 · 費用試算" title="先把就讀期間的費用假設攤開來看" description="依你的學雜費、交通、住宿與生活費設定，得到可調整的估算。" illustration="cost-calculator" /><SchoolCostPlanner /><SiteFooter /></main>;
}
