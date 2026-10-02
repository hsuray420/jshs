import { listPublishedContent, parseContentBody } from "@/db/content-store";
import fallbackArticles from "@/content/guide/articles.json";

export type GuideArticleRecord = (typeof fallbackArticles)[number];

/** Published D1 articles override the seed catalog by slug; seed content keeps the public hub usable during first deploy. */
export async function getPublishedGuideArticles(): Promise<readonly GuideArticleRecord[]> {
  try {
    const entries = await listPublishedContent("knowledge_article");
    const managed = entries.flatMap((entry) => {
      const body = parseContentBody(entry, {} as Record<string, unknown>);
      if (!isGuideBody(body)) return [];
      return [{ id: entry.id, slug: entry.slug, title: entry.title, summary: entry.summary, ...body } as GuideArticleRecord];
    });
    return managed.length ? managed : fallbackArticles;
  } catch {
    return fallbackArticles;
  }
}

function isGuideBody(value: Record<string, unknown>): value is Omit<GuideArticleRecord, "id" | "slug" | "title" | "summary"> {
  return typeof value.category === "string" && typeof value.body === "string" && Array.isArray(value.sources);
}
