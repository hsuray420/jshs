import type { Metadata } from "next";
import { SchoolExplorer } from "@/components/school-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "全國高中職查詢｜招生科別、交通、住宿與課程", description: "依學校正式公開資料，搜尋全國高中、高職、綜高與進修部的招生科別、課程、交通與住宿資訊。", alternates: { canonical: "/schools" } };
// getSchoolSummaries remains the canonical generated summary source; the client fetches its static public copy so this route stays edge-static.
export default function SchoolsPage() {
  return <main className="min-h-screen jshs-page-shell jshs-feature-school"><SiteHeader activeHref="/schools" /><SchoolExplorer /><SiteFooter /></main>;
}
