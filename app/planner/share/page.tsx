import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PlannerShare } from "@/components/planner-share";

export const metadata: Metadata = { title: "升學規劃分享｜只讀摘要", description: "只讀的升學規劃摘要，不建立公開搜尋頁面。", robots: { index: false, follow: false } };

export default function PlannerSharePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/planner" /><PlannerShare /><SiteFooter /></main>;
}
