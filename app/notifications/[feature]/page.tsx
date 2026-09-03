import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { NotificationFeatureWorkspace } from "@/components/notification-feature-workspace";
import routePages from "@/content/features/route-pages.json";
import { getMemberSession } from "../../../lib/member-auth";

const pages = routePages.notifications as Record<string, SupportPage>;

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((feature) => ({ feature })); }
export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> { const { feature } = await params; const page = pages[feature]; return page ? { title: `${page.title}｜通知與提醒`, description: page.description, alternates: { canonical: `/notifications/${feature}` }, robots: { index: false, follow: false } } : {}; }
export default async function NotificationFeaturePage({ params }: { params: Promise<{ feature: string }> }) { const { feature } = await params; const page = pages[feature]; if (!page) return null; const member = await getMemberSession(); return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/notifications" /><IndependentSupportPage page={page} /><NotificationFeatureWorkspace feature={feature as "push" | "line" | "email" | "calendar"} isMember={Boolean(member)} /><SiteFooter /></main>; }
