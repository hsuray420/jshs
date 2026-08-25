import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "校園開放日行事曆｜全國國中升學資訊網", alternates: { canonical: "/schedule/open-days" } };
export default function OpenDaysPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><ScheduleWorkspace view="open-days" /><SiteFooter /></main>; }
