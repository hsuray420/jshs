import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "時間日程｜會考倒數、升學待辦與行事曆", description: "查看全國共通升學時程、就學區差異、待辦清單與個人化行事曆匯出。", alternates: { canonical: "/schedule" } };

export default function SchedulePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><DistrictGate><ScheduleWorkspace /></DistrictGate><SiteFooter /></main>;
}
