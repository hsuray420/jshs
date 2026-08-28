import type { Metadata } from "next";
import { SchoolAlumniExplorer } from "@/components/school-alumni-explorer";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDistrictOptions } from "@/lib/school-directory";

export const metadata: Metadata = {
  title: "學長姐分享｜找學校｜全國國中升學資訊網",
  description: "依學校與就學區查看社群分享；內容不代表校方立場。",
  alternates: { canonical: "/schools/alumni" },
};

export default async function AlumniRoute({ searchParams }: { searchParams: Promise<{ district?: string; schoolCode?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><DistrictGate initialDistrict={params.district}><SchoolAlumniExplorer districtOptions={schoolDistrictOptions} initialDistrict={params.district} initialSchoolCode={params.schoolCode} /></DistrictGate><SiteFooter /></main>;
}
