import { addFavorite, listFavorites, removeFavorite } from "../../../db/favorite-store";
import { getMemberSession, getMemberUserId } from "../../../lib/member-auth";
import { getSchoolSearchIndex } from "../../../lib/school-search-index";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required" }, { status: 401 });
  const favorites = await listFavorites(await getMemberUserId(member));
  return Response.json({ ok: true, favorites }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  return updateFavorite(request, true);
}

export async function DELETE(request: Request) {
  return updateFavorite(request, false);
}

async function updateFavorite(request: Request, add: boolean) {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { schoolCode?: unknown } | null;
  if (typeof body?.schoolCode !== "string" || !getSchoolSearchIndex().some((school) => school.code === body.schoolCode)) {
    return Response.json({ ok: false, error: "school_not_found" }, { status: 400 });
  }
  const userId = await getMemberUserId(member);
  if (add) await addFavorite(userId, body.schoolCode);
  else await removeFavorite(userId, body.schoolCode);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
