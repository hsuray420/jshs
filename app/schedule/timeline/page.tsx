import type { Metadata } from "next";
import { ScheduleWorkspace } from "@/components/schedule-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "重要時程｜升學日程｜全國國中升學資訊網", description: "以 Timeline 查看已公告、待公告與上年度參考的升學日期，並在頁內比較就學區與匯出 ICS。", alternates: { canonical: "/schedule/timeline" } };
export default function TimelinePage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schedule" /><FeatureHero theme="schedule" eyebrow="升學日程 · 重要時程" title="沿著時間軸查看每個升學里程碑" description="比較就學區，清楚區分已公告、待公告與上年度參考資料。" illustration="timeline" /><DistrictGate><ScheduleWorkspace view="timeline" /></DistrictGate><SiteFooter /></main>; }
