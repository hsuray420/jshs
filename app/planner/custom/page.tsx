import type { Metadata } from "next";
import { PlannerModeWorkspace } from "@/components/planner-mode-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";
import { getPlannerSchools } from "@/lib/planner-data";

export const metadata: Metadata = { title: "自選排序志願｜我的志願", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CustomPlannerPage() { return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/planner" /><PlannerModeWorkspace mode="custom" schools={getPlannerSchools()} isMember={Boolean(await getMemberSession())} /><SiteFooter /></main>; }
