import { getPopularSchoolsMap } from "../../../../lib/popular-schools";

export const dynamic = "force-dynamic";

export async function GET() {
  const popular = await getPopularSchoolsMap();
  return Response.json(
    { ok: true, popular },
    { headers: { "cache-control": "public, max-age=60" } },
  );
}
