import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { InteractiveRuleTable } from "@/components/interactive-rule-table";

export const metadata: Metadata = { title: "積分規則｜算成績｜全國國中升學資訊網", description: "以互動規則表查看採計項目、上限、同分比序與官方來源。", alternates: { canonical: "/tools/rules" } };
export default function ScoreRulesPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/tools" /><header className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">算成績 · 積分規則</p><h1 className="mt-3 max-w-4xl">先看採計項目，再展開完整規則。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">規則由研究 JSON／MD 轉換，供試算器、欄位提示、結果與同分比序說明共用；116 正式規則待公告前，明確保留來源年度。</p></div></header><InteractiveRuleTable /><SiteFooter /></main>; }
