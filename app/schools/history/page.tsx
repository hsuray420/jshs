import type { Metadata } from "next";
import { AdmissionHistoryExplorer } from "@/components/admission-history-explorer";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDistrictOptions } from "@/lib/school-directory";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "歷年錄取參考｜找學校｜全國國中升學資訊網", description: "查看不同年度、學校與科別的錄取參考資料，並保留資料來源與樣本限制。", alternates: { canonical: "/schools/history" } };

export default async function SchoolHistoryRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="找學校 · 歷年錄取" title="把不同年度的錄取資料分開查" description="篩選學校、科別與年度，查看可回查的官方資料及明確標示的社群參考。" illustration="admissions-history" /><DistrictGate initialDistrict={params.district}><AdmissionHistoryExplorer districtOptions={schoolDistrictOptions} initialDistrict={params.district} /></DistrictGate><SiteFooter /></main>;
}
