import type { Metadata } from "next";
import { SchoolExplorer } from "@/components/school-explorer";
import { SiteHeader } from "@/components/site-header";
import { getSchoolSearchIndex } from "@/lib/school-search-index";

export const metadata: Metadata = { title: "全國高中職查詢｜全國國中升學資訊網", description: "依學校正式公開資料，搜尋全國高中、高職、綜高與進修部的招生科別、課程、交通與住宿資訊。", alternates: { canonical: "/schools" } };

export default async function SchoolsPage({ searchParams }: { searchParams: Promise<{ q?: string; district?: string }> }) {
  const params = await searchParams;
  const schools = getSchoolSearchIndex();
  return <main className="min-h-screen jshs-page-shell jshs-feature-school"><SiteHeader activeHref="/schools" /><SchoolExplorer schools={schools} initialFilters={{ query: params.q || "", district: params.district }} /></main>;
}
