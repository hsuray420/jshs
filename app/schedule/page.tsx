import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "升學總覽｜升學日程｜全國國中升學資訊網", description: "查看 116 學年度階段、會考倒數、下一個重要日期、待辦與完成進度。", alternates: { canonical: "/schedule" } };

export default function SchedulePage() {
  return <main className="min-h-screen jshs-page-shell jshs-feature-guide"><SiteHeader activeHref="/schedule" /><DistrictGate><ScheduleWorkspace /></DistrictGate><SiteFooter /></main>;
}
