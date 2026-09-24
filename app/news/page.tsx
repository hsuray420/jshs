import type { Metadata } from "next";
import { OfficialInformationExplorer } from "@/components/official-information-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "官方資訊入口｜全國國中升學資訊網",
  description: "查看可驗證的官方資訊紀錄；未建立公告收錄時不把入口網站偽裝成最新公告。",
  alternates: { canonical: "/news" },
};

export default function OfficialAnnouncementsPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/admission-guides" /><OfficialInformationExplorer mode="news" /><SiteFooter /></main>;
}
