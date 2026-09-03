import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PlannerVersions } from "@/components/planner-versions";
import routePages from "@/content/features/route-pages.json";
import { getMemberSession } from "../../../lib/member-auth";
import { OfficialPlatformLinks } from "@/components/official-platform-links";
import { PlannerExportWorkspace } from "@/components/planner-export-workspace";

const pages = routePages.planner as Record<string, SupportPage>;

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((feature) => ({ feature })); }
export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> { const { feature } = await params; const page = pages[feature]; return page ? { title: `${page.title}｜我的志願`, description: page.description, alternates: { canonical: `/planner/${feature}` }, robots: { index: false, follow: false } } : {}; }
export default async function PlannerFeaturePage({ params }: { params: Promise<{ feature: string }> }) { const { feature } = await params; const page = pages[feature]; if (!page) return null; const member = await getMemberSession(); return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/planner" />{feature === "versions" ? <><IndependentSupportPage page={page} /><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="p-6 jshs-surface-card"><PlannerVersions isMember={Boolean(member)} /></div></section></> : feature === "export" ? <><IndependentSupportPage page={page} /><PlannerExportWorkspace isMember={Boolean(member)} /></> : feature === "official-platform" ? <><IndependentSupportPage page={page} /><OfficialPlatformLinks /></> : <IndependentSupportPage page={page} />}<SiteFooter /></main>; }
