import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SchoolExplorer } from "@/components/school-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSchoolSummaries } from "@/lib/school-summary-repository";
import { districtLabel } from "@/lib/school-districts";

export const metadata: Metadata = { title: "全國高中職查詢｜招生科別、交通、住宿與課程", description: "依學校正式公開資料，搜尋全國高中、高職、綜高與進修部的招生科別、課程、交通與住宿資訊。", alternates: { canonical: "/schools" } };
export default async function SchoolsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  if (p.view && ["map", "compare", "commute", "history", "alumni", "cost"].includes(p.view)) redirect(`/schools/${p.view}`);
  const clean = (value?: string) => value === "all" ? "" : value || "";
  return <main className="min-h-screen jshs-page-shell jshs-feature-school"><SiteHeader activeHref="/schools" /><SchoolExplorer schools={getSchoolSummaries()} initialFilters={{ query: p.q?.slice(0, 150), district: p.district ? districtLabel(clean(p.district)) : "", city: clean(p.city), area: clean(p.area), ownership: clean(p.ownership), program: clean(p.program), gender: clean(p.gender), department: clean(p.department) }} /><SiteFooter /></main>;
}
