import cache from "@/content/schools/generated/school-image-cache.json";
import { getSchoolSearchIndex } from "@/lib/school-search-index";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() || "";
  if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return Response.json({ ok: false, error: "invalid_school_code" }, { status: 400 });
  const school = getSchoolSearchIndex().find((entry) => entry.code === code);
  if (!school) return Response.json({ ok: false, error: "school_not_found" }, { status: 404 });
  const record = (cache as Record<string, unknown>)[code] || null;
  return Response.json({ ok: true, schoolCode: code, image: record }, { headers: { "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } });
}
