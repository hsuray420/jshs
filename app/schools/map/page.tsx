import type { Metadata } from "next";
import { SchoolMapExplorer } from "@/components/school-map-explorer";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDistrictOptions } from "@/lib/school-directory";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "學校地圖｜找學校｜全國國中升學資訊網", description: "先選就學區，再查看該區學校位置與通勤估算。", alternates: { canonical: "/schools/map" } };

export default async function SchoolMapRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="找學校 · 學校地圖" title="在地圖上查看學校與位置資訊" description="選擇就學區後定位學校；只有路線服務成功時才顯示通勤時間。" illustration="school-map" /><DistrictGate initialDistrict={params.district}><SchoolMapExplorer districtOptions={schoolDistrictOptions} initialDistrict={params.district} /></DistrictGate><SiteFooter /></main>;
}
