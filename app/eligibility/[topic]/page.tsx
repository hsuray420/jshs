import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { EligibilityTopicWorkspace } from "@/components/eligibility-topic-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import routePages from "@/content/features/route-pages.json";

const pages = routePages.eligibility as Record<string, SupportPage>;

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((topic) => ({ topic })); }
export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> { const { topic } = await params; const page = pages[topic]; return page ? { title: `${page.title}｜特殊入學與資格`, description: page.description, alternates: { canonical: `/eligibility/${topic}` } } : {}; }
export default async function EligibilityTopicPage({ params }: { params: Promise<{ topic: string }> }) { const { topic } = await params; const page = pages[topic]; if (!page) return null; const interactiveTopic = ["special-admission", "gifted-special-education", "direct-selection"].includes(topic); return <><SiteHeader activeHref="/knowledge" /><DistrictGate><IndependentSupportPage page={page} />{interactiveTopic ? <EligibilityTopicWorkspace topic={topic as "special-admission" | "gifted-special-education" | "direct-selection"} /> : null}</DistrictGate><SiteFooter /></>; }
