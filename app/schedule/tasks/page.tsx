import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "升學待辦清單｜全國國中升學資訊網", alternates: { canonical: "/schedule/tasks" } };
export default function ScheduleTasksPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><ScheduleWorkspace view="tasks" /><SiteFooter /></main>; }
