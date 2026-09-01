import type { Metadata } from "next";
import { PlannerModeWorkspace } from "@/components/planner-mode-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";
import { getPlannerSchools } from "@/lib/planner-data";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "志願探索｜我的志願", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RecommendPlannerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const district = typeof params.district === "string" ? params.district : undefined;
  const scoreValue = typeof params.score === "string" ? Number(params.score) : NaN;
  const score = Number.isFinite(scoreValue) && scoreValue >= 0 ? scoreValue : undefined;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/planner" /><FeatureHero theme="planner" eyebrow="我的志願 · 系統推薦" title="用條件整理可探索的志願選項" description="推薦結果不代替資格審查或官方選填；每項資料仍可回查。" illustration="planner-recommendation" /><PlannerModeWorkspace mode="recommend" schools={getPlannerSchools()} isMember={Boolean(await getMemberSession())} initialDistrict={district} initialScore={score} /><SiteFooter /></main>;
}
