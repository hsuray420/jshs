import { listPublicSiteSettings } from "../../../db/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await listPublicSiteSettings();
  return Response.json(
    Object.fromEntries(settings.map((item) => [item.key, item.value])),
    { headers: { "cache-control": "public, max-age=60" } },
  );
}
