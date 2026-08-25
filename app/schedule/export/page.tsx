import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "個人化行事曆匯出｜全國國中升學資訊網", alternates: { canonical: "/schedule/export" } };
export default function ScheduleExportPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><ScheduleWorkspace view="export" /><SiteFooter /></main>; }
