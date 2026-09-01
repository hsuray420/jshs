import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { InteractiveRuleTable } from "@/components/interactive-rule-table";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "積分規則｜算成績｜全國國中升學資訊網", description: "以互動規則表查看採計項目、上限、同分比序與官方來源。", alternates: { canonical: "/tools/rules" } };
export default function ScoreRulesPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><FeatureHero theme="tools" eyebrow="算成績 · 積分規則" title="先看採計項目，再展開完整規則" description="規則保留來源年度與核對狀態，讓試算結果可以回查。" illustration="score-rules" /><InteractiveRuleTable /><SiteFooter /></main>; }
