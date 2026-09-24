import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "我的待辦｜升學日程｜全國國中升學資訊網", alternates: { canonical: "/schedule/tasks" }, robots: { index: false, follow: false } };
export default function ScheduleTasksPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 我的待辦" title="把升學準備拆成可完成的待辦" description="在同一個清單追蹤系統建議與自己的準備事項。" illustration="todo" /><DistrictGate><ScheduleWorkspace view="tasks" /></DistrictGate><SiteFooter /></main>; }
