import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "各就學區時程比較｜全國國中升學資訊網", alternates: { canonical: "/schedule/compare" } };
export default function ScheduleComparePage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><ScheduleWorkspace view="compare" /><SiteFooter /></main>; }
