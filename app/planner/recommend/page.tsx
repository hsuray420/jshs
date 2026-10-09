import type { Metadata } from "next";
import { PlannerModeWorkspace } from "@/components/planner-mode-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";
import { getMemberInterestProfile } from "@/db/interest-store";
import { getPlannerSchools } from "@/lib/planner-data";
import { FeatureHero } from "@/components/feature-hero";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "探索志願｜全國國中升學資訊網", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RecommendPlannerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const district = typeof params.district === "string" ? params.district : undefined;
  const scoreValue = typeof params.score === "string" ? Number(params.score) : NaN;
  const score = Number.isFinite(scoreValue) && scoreValue >= 0 ? scoreValue : undefined;
  const member = await getMemberSession();
  if (!member) redirect("/knowledge/fit-quiz?next=%2Fplanner%2Frecommend");
  const interestProfile = await getMemberInterestProfile(member.lineUserId);
  if (!interestProfile) redirect("/knowledge/fit-quiz?next=%2Fplanner%2Frecommend");
  return <main className="min-h-screen jshs-page-shell jshs-feature-planner"><SiteHeader activeHref="/planner" /><FeatureHero theme="planner" eyebrow="我的志願 · 探索志願" title="完成興趣測驗後探索適合的志願" description="先完成 Holland 興趣測驗，再用結果整理候選校科；推薦結果不代替資格審查或官方選填。" illustration="planner-recommendation" /><PlannerModeWorkspace mode="recommend" schools={getPlannerSchools()} isMember initialDistrict={district} initialScore={score} /><SiteFooter /></main>;
}
