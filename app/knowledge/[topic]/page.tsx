import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { KnowledgeTopicWorkspace, type Topic } from "@/components/knowledge-topic-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CompactFeatureHero } from "@/components/feature-hero";

const pages: Record<Exclude<Topic, "groups">, { title: string; description: string }> = {
  "admission-basics": { title: "升學入門", description: "理解會考、積分、序位、志願到放榜的整體流程。" },
  rules: { title: "志願與積分", description: "用白話理解積分、志願序與同分比序，再回到精確規則核對。" },
  glossary: { title: "升學百科", description: "搜尋升學名詞、常見迷思與制度說明。" },
  "fit-quiz": { title: "生涯探索", description: "探索普通高中、技高與五專的學習方式與未來方向。" },
};

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
  return [...Object.keys(pages), ...Object.keys(legacyRedirects)].map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const page = pages[topic as Exclude<Topic, "groups">];
  if (page) return { title: page.title + "｜升學指南", description: page.description, alternates: { canonical: "/knowledge/" + topic } };
  return { title: "升學指南｜全國國中升學資訊網", robots: { index: false, follow: false } };
}

export default async function KnowledgeTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const destination = legacyRedirects[topic];
  if (destination) redirect(destination);
  if (!pages[topic as Exclude<Topic, "groups">]) notFound();
  const page = pages[topic as Exclude<Topic, "groups">];
  const illustration = topic === "admission-basics" ? "admission-basics" : topic === "rules" ? "choice-score" : topic === "glossary" ? "encyclopedia" : "career-explore" as const;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><CompactFeatureHero theme="guide" eyebrow="升學指南" title={page.title} description={page.description} illustration={illustration} /><KnowledgeTopicWorkspace topic={topic as Exclude<Topic, "groups">} /><SiteFooter /></main>;
}
