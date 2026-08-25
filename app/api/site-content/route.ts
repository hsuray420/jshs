import { listPublishedContent, parseContentBody, type ContentType } from "../../../db/content-store";

export const dynamic = "force-dynamic";

const publicTypes: readonly ContentType[] = ["knowledge_term", "knowledge_card", "schedule_task", "site_notice"];

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("type") as ContentType | null;
  const type = requested && publicTypes.includes(requested) ? requested : "site_notice";
  const entries = await listPublishedContent(type);
  return Response.json({
    ok: true,
    type,
    entries: entries.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
      body: parseContentBody(entry, {}),
      publishedAt: entry.published_at,
      updatedAt: entry.updated_at,
    })),
  }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
}
