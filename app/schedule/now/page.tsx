import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "現在該做什麼｜升學日程｜全國國中升學資訊網", alternates: { canonical: "/schedule/now" } };
export default function ScheduleNowPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 現在該做什麼" title="依目前進度找到最需要先完成的一步" description="把時程、資料狀態與你的準備進度放在一起看。" illustration="schedule-now" /><DistrictGate><ScheduleWorkspace view="now" /></DistrictGate><SiteFooter /></main>; }
