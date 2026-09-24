import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "升學總覽｜升學日程｜全國國中升學資訊網", description: "查看 116 學年度階段、會考倒數、下一個重要日期、待辦與完成進度。", alternates: { canonical: "/schedule" } };

export default function SchedulePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 全年總覽" title="把重要日期、倒數與待辦放在同一個時間軸" description="查看已公告、待公告與上年度參考時程，再安排自己的下一步。" illustration="schedule" /><DistrictGate><ScheduleWorkspace /></DistrictGate><SiteFooter /></main>;
}
