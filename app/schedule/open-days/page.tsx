import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "校園開放日｜升學日程｜全國國中升學資訊網", alternates: { canonical: "/schedule/open-days" }, robots: { index: false, follow: false } };
export default function ScheduleOpenDaysPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 校園開放日" title="把想參訪的學校排進自己的時間線" description="新增、編輯、完成或刪除個人活動；每筆資料都請回查學校官方公告。" illustration="calendar-export" /><DistrictGate><ScheduleWorkspace view="open-days" /></DistrictGate><SiteFooter /></main>; }
// redirect("/schools/open-days") was the old compatibility behavior; this route is now a complete workspace.
