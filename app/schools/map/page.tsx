import type { Metadata } from "next";
import { SchoolMapExplorer } from "@/components/school-map-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSchools } from "@/lib/school-repository";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "在地圖上查看學校與位置資訊｜全國高中職查詢", description: "查詢正式學校地址，並以 Google 地圖查看學校位置。", alternates: { canonical: "/schools/map" } };

export default async function SchoolRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="全國高中職查詢" title="在地圖上查看學校與位置資訊" description="查詢正式學校地址，並以 Google 地圖查看學校位置。" illustration="school-map" /><SchoolMapExplorer schools={getSchools()} initialDistrict={params.district} /><SiteFooter /></main>;
}
