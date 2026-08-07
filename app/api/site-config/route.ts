import { listPublicSiteSettings } from "../../../db/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await listPublicSiteSettings();
  const publicConfig = Object.fromEntries(
    settings.map((item) => [item.key, item.value]),
  );
  if (!publicConfig.official_line_url && process.env.LINE_OFFICIAL_ACCOUNT_URL) {
    publicConfig.official_line_url = process.env.LINE_OFFICIAL_ACCOUNT_URL;
  }
  return Response.json(
    publicConfig,
    { headers: { "cache-control": "public, max-age=60" } },
  );
}
