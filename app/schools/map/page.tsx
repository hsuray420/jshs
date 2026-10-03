import type { Metadata } from "next";
import { SchoolMapExplorer } from "@/components/school-map-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "學校地圖｜全國國中升學資訊網", description: "依就學區探索有來源紀錄、已核對座標的學校位置。", alternates: { canonical: "/schools/map" } };

export default async function SchoolRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell jshs-feature-school"><SiteHeader activeHref="/schools" /><SchoolMapExplorer initialDistrict={params.district} /><SiteFooter /></main>;
}
