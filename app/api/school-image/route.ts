import cache from "@/content/schools/generated/school-image-cache.json";
import { getSchoolMediaOverride } from "@/db/admin-store";
import { getSchoolSearchIndex } from "@/lib/school-search-index";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() || "";
  if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return Response.json({ ok: false, error: "invalid_school_code" }, { status: 400 });
  const school = getSchoolSearchIndex().find((entry) => entry.code === code);
  if (!school) return Response.json({ ok: false, error: "school_not_found" }, { status: 404 });
  const record = (cache as Record<string, unknown>)[code] || null;
  let override = null;
  try {
    override = await getSchoolMediaOverride(code);
  } catch {
    // The static resolver remains usable in local preview environments without D1.
  }
  return Response.json({
    ok: true,
    schoolCode: code,
    image: record,
    adminMedia: override ? {
      coverImage: `/api/school-media?code=${encodeURIComponent(code)}`,
      source: override.source,
      sourceUrl: override.source_url,
      alt: override.alt,
      updatedAt: override.updated_at,
    } : null,
  }, { headers: { "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600" } });
}
