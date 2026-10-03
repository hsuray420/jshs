import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "就學區比較｜升學日程｜全國國中升學資訊網", alternates: { canonical: "/schedule/compare" } };
export default function ScheduleComparePage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 就學區比較" title="並排比較不同就學區的時間安排" description="選擇區域後查看資料年度、整理狀態與官方來源。" illustration="timeline" /><DistrictGate><ScheduleWorkspace view="compare" /></DistrictGate><SiteFooter /></main>; }
// redirect("/schedule/timeline") was the old compatibility behavior; this route is now a complete workspace.
