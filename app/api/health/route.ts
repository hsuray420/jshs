import { ensureAdminSchema } from "../../../db/admin-store";

export async function GET() {
  const database = await checkDatabase();
  const checks = {
    database,
    storage: database,
  };
  const integrations = {
    line_login: Boolean(process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET),
    line_push: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
  };
  const coreOk = database;

  return Response.json({
    ok: coreOk,
    service: "jshs-admission-site",
    phase: "cloudflare-native",
    checks,
    integrations,
    checked_at: new Date().toISOString(),
  }, { status: coreOk ? 200 : 503 });
}

async function checkDatabase() {
  try {
    await ensureAdminSchema();
    return true;
  } catch {
    return false;
  }
}
