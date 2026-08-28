import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "校園開放日｜找學校｜全國國中升學資訊網",
  description: "依學校官方公告整理個人的校園開放日清單，並可加入行事曆。",
  alternates: { canonical: "/schools/open-days" },
};

export default function OpenDaysRoute() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><DistrictGate><ScheduleWorkspace view="open-days" /></DistrictGate><SiteFooter /></main>;
}
