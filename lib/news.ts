import newsCatalog from "@/content/news.json";

export type NewsSection = Readonly<{
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}>;

export type NewsSource = Readonly<{
  label: string;
  url: string;
  note: string;
}>;

export type NewsArticle = Readonly<{
  slug: string;
  category: string;
  kicker: string;
  title: string;
  description: string;
  audience: string;
  academicYear: string;
  districtScope: string;
  oneLineConclusion: string;
  preparation: readonly string[];
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  featured: boolean;
  keywords: readonly string[];
  summary: readonly string[];
  sections: readonly NewsSection[];
  misconceptions: readonly string[];
  sources: readonly NewsSource[];
  cta: Readonly<{
    label: string;
    href: string;
    detail: string;
  }>;
  relatedSlugs: readonly string[];
}>;

type NewsCatalog = Readonly<{
  updatedAt: string;
  articles: readonly NewsArticle[];
}>;

const catalog = newsCatalog as NewsCatalog;

export const newsUpdatedAt = catalog.updatedAt;
export const newsArticles: readonly NewsArticle[] = Object.freeze([...catalog.articles]);

export function getNewsArticle(slug: string): NewsArticle | undefined {
  return newsArticles.find((article) => article.slug === slug);
}

export function getFeaturedNews(limit = 3): readonly NewsArticle[] {
  return newsArticles.filter((article) => article.featured).slice(0, limit);
}

export function getRelatedNews(article: NewsArticle, limit = 3): readonly NewsArticle[] {
  const explicit = article.relatedSlugs
    .map((slug) => getNewsArticle(slug))
    .filter((candidate): candidate is NewsArticle => Boolean(candidate));
  const fallback = newsArticles.filter(
    (candidate) => candidate.slug !== article.slug && candidate.category === article.category,
  );

  return [...explicit, ...fallback]
    .filter((candidate, index, articles) => articles.findIndex((item) => item.slug === candidate.slug) === index)
    .slice(0, limit);
}

export const newsCategoryLabels = [
  "會考準備",
  "入學規則",
  "志願策略",
  "校科探索",
  "生涯選擇",
  "家長與新生",
] as const;

export function getNewsCategories(): readonly string[] {
  return [...newsCategoryLabels];
}

export function formatNewsDate(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Taipei",
  }).format(new Date(`${value}T00:00:00+08:00`));
}
