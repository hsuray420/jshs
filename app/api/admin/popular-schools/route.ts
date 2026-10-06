import { redirect } from "next/navigation";
import { getPopularSchoolsMap, savePopularSchoolsMap } from "../../../../lib/popular-schools";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  let district = "tp";
  let codes: string[] = [];

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      district?: string;
      codes?: string[];
      fullMap?: Record<string, string[]>;
    } | null;

    if (body?.fullMap) {
      await savePopularSchoolsMap(body.fullMap, admin.user.displayName);
      return Response.json({ ok: true });
    }

    district = body?.district || "tp";
    codes = body?.codes || [];
  } else {
    const formData = await request.formData();
    district = String(formData.get("district") || "tp").trim();
    const rawCodes = String(formData.get("codes") || "");
    codes = rawCodes
      .split(/[\n,;，、\s]+/u)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const currentMap = await getPopularSchoolsMap();
  currentMap[district] = codes;

  await savePopularSchoolsMap(currentMap, admin.user.displayName);

  if (contentType.includes("application/json")) {
    return Response.json({ ok: true, district, codes });
  }

  redirect(`/admin/schools/popular?updated=ok&district=${encodeURIComponent(district)}`);
}
