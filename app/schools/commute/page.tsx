import type { Metadata } from "next";
import { CommuteComparison } from "@/components/commute-comparison";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDistrictOptions } from "@/lib/school-directory";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "通勤比較｜找學校｜全國國中升學資訊網", description: "設定出發地與學校，並排比較距離與通勤估算。", alternates: { canonical: "/schools/commute" } };

export default async function CommuteRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="找學校 · 通勤比較" title="比較每天上學需要花多少移動成本" description="設定出發地並加入學校；沒有可靠道路路線時，只顯示直線距離參考。" illustration="commute" /><DistrictGate initialDistrict={params.district}><CommuteComparison districtOptions={schoolDistrictOptions} initialDistrict={params.district} /></DistrictGate><SiteFooter /></main>;
}
