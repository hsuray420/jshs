import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "我現在該做什麼｜全國國中升學資訊網", alternates: { canonical: "/schedule/now" } };
export default function ScheduleNowPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><ScheduleWorkspace view="now" /><SiteFooter /></main>; }
