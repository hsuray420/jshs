import type { Metadata } from "next";
import { SchoolExplorer } from "@/components/school-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "全國高中職查詢｜全國國中生升學資訊網", description: "依學校正式公開資料，搜尋全國高中、高職、綜高與進修部的招生科別、課程、交通與住宿資訊。", alternates: { canonical: "/schools" } };
// The client fetches the build-time search index as a static asset so this route stays edge-static.
export default function SchoolsPage() {
  return <main className="min-h-screen jshs-page-shell jshs-feature-school"><SiteHeader activeHref="/schools" /><SchoolExplorer /><SiteFooter /></main>;
}
