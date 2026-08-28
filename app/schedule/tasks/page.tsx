import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "我的待辦｜升學日程｜全國國中升學資訊網", alternates: { canonical: "/schedule/tasks" } };
export default function ScheduleTasksPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><DistrictGate><ScheduleWorkspace view="tasks" /></DistrictGate><SiteFooter /></main>; }
