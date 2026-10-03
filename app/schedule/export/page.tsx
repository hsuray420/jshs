import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "行事曆匯出｜升學日程｜全國國中升學資訊網", alternates: { canonical: "/schedule/export" }, robots: { index: false, follow: false } };
export default function ScheduleExportPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 行事曆匯出" title="把升學日期帶進自己的行事曆" description="下載 ICS，匯入手機或電腦行事曆；日期更新後請重新下載。" illustration="calendar-export" /><DistrictGate><ScheduleWorkspace view="export" /></DistrictGate><SiteFooter /></main>; }
// redirect("/schedule/timeline") was the old compatibility behavior; this route is now a complete workspace.
