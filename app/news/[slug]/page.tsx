import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { newsArticles } from "@/lib/news";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return newsArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  await params;
  return { title: "升學指南｜全國國中升學資訊網", robots: { index: false, follow: false }, alternates: { canonical: "/knowledge" } };
}

export default async function LegacyNewsArticleRoute({ params }: ArticlePageProps) {
  const { slug } = await params;
  redirect(destinationFor(slug));
}

function destinationFor(slug: string) {
  if (slug.includes("score-ranking") || slug.includes("wish-list")) return "/knowledge/rules";
  if (slug.includes("general-vocational")) return "/knowledge/fit-quiz";
  if (slug.includes("parent-student")) return "/knowledge/admission-basics";
  if (slug.includes("school")) return "/schools";
  return "/knowledge/admission-basics";
}
