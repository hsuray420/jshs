import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { KnowledgeTopicWorkspace, type Topic } from "@/components/knowledge-topic-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CompactFeatureHero } from "@/components/feature-hero";
import { getGuideTopic, getGuideTopics } from "@/lib/content";

const legacyRedirects: Record<string, string> = {
  misconceptions: "/knowledge/glossary",
  "alumni-stories": "/schools/alumni",
  videos: "/knowledge/admission-basics",
  podcast: "/knowledge/admission-basics",
  "career-map": "/knowledge/fit-quiz",
  groups: "/schools/groups",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getGuideTopics(), ...Object.keys(legacyRedirects)].map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const page = getGuideTopic(topic);
  if (page) return { title: page.title + "｜升學指南", description: page.description, alternates: { canonical: "/knowledge/" + topic } };
  return { title: "升學指南｜全國國中升學資訊網", robots: { index: false, follow: false } };
}

export default async function KnowledgeTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const destination = legacyRedirects[topic];
  if (destination) redirect(destination);
  const page = getGuideTopic(topic);
  if (!page) notFound();
  const illustration = topic === "admission-basics" ? "admission-basics" : topic === "rules" ? "choice-score" : topic === "glossary" ? "encyclopedia" : "career-explore" as const;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><CompactFeatureHero theme="guide" eyebrow="升學指南" title={page.title} description={page.description} illustration={illustration} /><KnowledgeTopicWorkspace topic={topic as Exclude<Topic, "groups">} /><SiteFooter /></main>;
}
