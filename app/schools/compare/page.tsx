import type { Metadata } from "next";
import { SchoolComparisonExplorer } from "@/components/school-comparison-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSchools } from "@/lib/school-repository";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "並排比較你正在考慮的學校｜全國高中職查詢", description: "選擇 2 至 4 所學校，比較招生、課程、交通與住宿資訊。", alternates: { canonical: "/schools/compare" } };

export default async function SchoolRoute({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><FeatureHero theme="schools" eyebrow="全國高中職查詢" title="並排比較你正在考慮的學校" description="選擇 2 至 4 所學校，比較招生、課程、交通與住宿資訊。" illustration="school-compare" /><SchoolComparisonExplorer schools={getSchools()} initialDistrict={params.district} /><SiteFooter /></main>;
}
