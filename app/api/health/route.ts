import { ensureAdminSchema } from "../../../db/admin-store";

export async function GET() {
  const database = await checkDatabase();
  const checks = {
    database,
    storage: database,
    line_login: Boolean(process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET),
    line_push: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
  };
  const ok = Object.values(checks).every(Boolean);

  return Response.json({
    ok,
    service: "jshs-admission-site",
    phase: "cloudflare-native",
    checks,
    checked_at: new Date().toISOString(),
  }, { status: ok ? 200 : 503 });
}

async function checkDatabase() {
  try {
    await ensureAdminSchema();
    return true;
  } catch {
    return false;
  }
}
