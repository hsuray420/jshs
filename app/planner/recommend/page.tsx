import type { Metadata } from "next";
import { PlannerModeWorkspace } from "@/components/planner-mode-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";
import { getPlannerSchools } from "@/lib/planner-data";

export const metadata: Metadata = { title: "系統推薦志願｜我的志願", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RecommendPlannerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const district = typeof params.district === "string" ? params.district : undefined;
  const scoreValue = typeof params.score === "string" ? Number(params.score) : NaN;
  const score = Number.isFinite(scoreValue) && scoreValue >= 0 ? scoreValue : undefined;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/planner" /><PlannerModeWorkspace mode="recommend" schools={getPlannerSchools()} isMember={Boolean(await getMemberSession())} initialDistrict={district} initialScore={score} /><SiteFooter /></main>;
}
