import type { Metadata } from "next";
import { SchoolComparisonExplorer } from "@/components/school-comparison-explorer";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDistrictOptions } from "@/lib/school-directory";

export const metadata: Metadata = { title: "學校比較｜找學校｜全國國中升學資訊網", description: "選擇 2 至 4 所學校或校科，並排比較招生與學校資料。", alternates: { canonical: "/schools/compare" } };

export default async function SchoolCompareRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><DistrictGate initialDistrict={params.district}><SchoolComparisonExplorer districtOptions={schoolDistrictOptions} initialDistrict={params.district || "all"} /></DistrictGate><SiteFooter /></main>;
}
