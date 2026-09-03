import { getContentCollectionSync } from "./content";

export type NewsSection = Readonly<{ heading: string; paragraphs: readonly string[]; bullets?: readonly string[] }>;
export type NewsSource = Readonly<{ label: string; url: string; note: string }>;
export type NewsArticle = Readonly<{
  slug: string; category: string; kicker: string; title: string; description: string; audience: string;
  academicYear: string; districtScope: string; oneLineConclusion: string; preparation: readonly string[];
  publishedAt: string; updatedAt: string; readMinutes: number; featured: boolean; keywords: readonly string[];
  summary: readonly string[]; sections: readonly NewsSection[]; misconceptions: readonly string[];
  sources: readonly NewsSource[]; cta: Readonly<{ label: string; href: string; detail: string }>;
  relatedSlugs: readonly string[]; content: string;
}>;

function toSections(markdown: string): readonly NewsSection[] {
  return markdown.split(/^## /gimu).filter(Boolean).map((part) => {
    const [heading, ...lines] = part.split(/\r?\n/u);
    const bullets = lines.filter((line) => /^- /u.test(line)).map((line) => line.slice(2));
    const paragraphs = lines.filter((line) => line.trim() && !line.startsWith("- "));
    return { heading: heading.trim(), paragraphs, ...(bullets.length ? { bullets } : {}) };
  });
}

const documents = getContentCollectionSync("news");
export const newsArticles: readonly NewsArticle[] = Object.freeze(documents.map(({ metadata, content }) => ({
  ...metadata,
  slug: String(metadata.slug), category: String(metadata.category), kicker: String(metadata.kicker || "升學情報"),
  title: String(metadata.title), description: String(metadata.description), audience: String(metadata.audience || ""),
  academicYear: String(metadata.academicYear || ""), districtScope: String(metadata.districtScope || "全國"),
  oneLineConclusion: String(metadata.oneLineConclusion || ""), preparation: (metadata.preparation || []) as readonly string[],
  publishedAt: String(metadata.publishedAt || ""), updatedAt: String(metadata.updatedAt || metadata.publishedAt || ""),
  readMinutes: Number(metadata.readMinutes || 1), featured: Boolean(metadata.featured), keywords: (metadata.keywords || []) as readonly string[],
  summary: (metadata.summary || []) as readonly string[], sections: toSections(content), misconceptions: (metadata.misconceptions || []) as readonly string[],
  sources: (metadata.sources || []) as readonly NewsSource[], cta: (metadata.cta || { label: "查看相關功能", href: "/knowledge", detail: "回到升學指南查看相關工具。" }) as NewsArticle["cta"],
  relatedSlugs: (metadata.relatedSlugs || []) as readonly string[], content,
})));
export const newsUpdatedAt = newsArticles.reduce((latest, article) => article.updatedAt > latest ? article.updatedAt : latest, "");
export function getNewsArticle(slug: string) { return newsArticles.find((article) => article.slug === slug); }
export function getFeaturedNews(limit = 3) { return newsArticles.filter((article) => article.featured).slice(0, limit); }
export function getRelatedNews(article: NewsArticle, limit = 3) {
  const explicit = article.relatedSlugs.map(getNewsArticle).filter((candidate): candidate is NewsArticle => Boolean(candidate));
  const fallback = newsArticles.filter((candidate) => candidate.slug !== article.slug && candidate.category === article.category);
  return [...explicit, ...fallback].filter((candidate, index, all) => all.findIndex((item) => item.slug === candidate.slug) === index).slice(0, limit);
}
export const newsCategoryLabels = ["會考準備", "入學規則", "志願策略", "校科探索", "生涯選擇", "家長與新生"] as const;
export function getNewsCategories() { return [...newsCategoryLabels]; }
export function formatNewsDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Taipei" }).format(new Date(`${value}T00:00:00+08:00`)); }
