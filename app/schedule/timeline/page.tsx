import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "重要時程總覽｜全國國中升學資訊網", alternates: { canonical: "/schedule/timeline" } };
export default function TimelinePage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><DistrictGate><ScheduleWorkspace view="timeline" /></DistrictGate><SiteFooter /></main>; }
