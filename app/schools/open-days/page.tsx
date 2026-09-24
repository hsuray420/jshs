import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = {
  title: "校園開放日｜找學校｜全國國中升學資訊網",
  description: "依學校官方公告整理個人的校園開放日清單，並可加入行事曆。",
  alternates: { canonical: "/schools/open-days" },
};

export default function OpenDaysRoute() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="找學校 · 校園開放日" title="把想參加的校園開放日排進行事曆" description="依官方公告整理活動資訊，建立自己的參訪清單。" illustration="open-day" /><DistrictGate><ScheduleWorkspace view="open-days" /></DistrictGate><SiteFooter /></main>;
}
