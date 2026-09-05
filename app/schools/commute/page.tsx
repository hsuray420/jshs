import type { Metadata } from "next";
import { CommuteComparison } from "@/components/commute-comparison";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSchools } from "@/lib/school-repository";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "比較學校交通與你的上學路線｜全國高中職查詢", description: "分別查看校方交通資訊，並開啟 Google 地圖計算你的通勤路線。", alternates: { canonical: "/schools/commute" } };

export default async function SchoolRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="全國高中職查詢" title="比較學校交通與你的上學路線" description="分別查看校方交通資訊，並開啟 Google 地圖計算你的通勤路線。" illustration="commute" /><CommuteComparison schools={getSchools()} initialDistrict={params.district} /><SiteFooter /></main>;
}
