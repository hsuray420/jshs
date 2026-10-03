import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "會考倒數｜升學日程｜全國國中升學資訊網", alternates: { canonical: "/schedule/countdown" } };
export default function CountdownPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 會考倒數" title="知道離下一個關鍵日還有多久" description="用倒數安排讀書與準備節奏，正式日期仍以官方公告為準。" illustration="schedule" /><DistrictGate><ScheduleWorkspace view="countdown" /></DistrictGate><SiteFooter /></main>; }
// redirect("/schedule") was the old compatibility behavior; this route is now a complete workspace.
