import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { KnowledgeTopicWorkspace, type Topic } from "@/components/knowledge-topic-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CompactFeatureHero } from "@/components/feature-hero";
import { getGuideTopic, getGuideTopics } from "@/lib/content";
import guideArticles from "@/content/guide/articles.json";
import { GuideArticleDetail } from "@/components/guide-article-detail";
import { getPublishedGuideArticles } from "@/lib/guide-center-server";
import { getMemberSession } from "@/lib/member-auth";
import { listPublishedContent } from "@/db/content-store";

const legacyRedirects: Record<string, string> = {
  misconceptions: "/knowledge/glossary",
  "alumni-stories": "/schools/alumni",
  videos: "/knowledge/admission-basics",
  podcast: "/knowledge/admission-basics",
  "career-map": "/knowledge/fit-quiz",
  groups: "/schools/groups",
};

export const dynamicParams = true;

export function generateStaticParams() {
  return [...new Set([...getGuideTopics(), ...guideArticles.map((article) => article.slug), ...Object.keys(legacyRedirects)])].map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const article = (await getPublishedGuideArticles()).find((item) => item.slug === topic) || guideArticles.find((item) => item.slug === topic);
  if (article) return { title: article.title + "｜升學指南", description: article.summary, alternates: { canonical: "/knowledge/" + topic } };
  const page = getGuideTopic(topic);
  if (page) return { title: page.title + "｜升學指南", description: page.description, alternates: { canonical: "/knowledge/" + topic } };
  return { title: "升學指南｜全國國中升學資訊網", robots: { index: false, follow: false } };
}

export default async function KnowledgeTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const article = (await getPublishedGuideArticles()).find((item) => item.slug === topic) || guideArticles.find((item) => item.slug === topic);
  if (article) return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><CompactFeatureHero theme="guide" eyebrow={article.category} title={article.title} description={article.summary} illustration="admission-basics" /><GuideArticleDetail article={article} /><SiteFooter /></main>;
  const destination = legacyRedirects[topic];
  if (destination) redirect(destination);
  const page = getGuideTopic(topic);
  if (!page) notFound();
  const illustration = topic === "admission-basics" ? "admission-basics" : topic === "rules" ? "choice-score" : topic === "glossary" ? "encyclopedia" : "career-explore" as const;
  const interestEntry = topic === "fit-quiz" ? (await listPublishedContent("interest_quiz")).find((entry) => entry.slug === "holland-interest") : undefined;
  let interestQuiz: { questions: readonly [string, readonly [string, string][]][] } | undefined;
  if (interestEntry) {
    try {
      const parsed = JSON.parse(interestEntry.body_json) as { questions?: unknown };
      if (Array.isArray(parsed.questions)) interestQuiz = { questions: parsed.questions.filter((question): question is [string, readonly [string, string][]] => Array.isArray(question) && typeof question[0] === "string" && Array.isArray(question[1])) };
    } catch {
      interestQuiz = undefined;
    }
  }
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><CompactFeatureHero theme="guide" eyebrow="升學指南" title={page.title} description={page.description} illustration={illustration} /><KnowledgeTopicWorkspace topic={topic as Exclude<Topic, "groups">} isMember={Boolean(await getMemberSession())} interestQuiz={interestQuiz} /><SiteFooter /></main>;
}
