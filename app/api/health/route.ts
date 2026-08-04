import { ensureAdminSchema, getR2 } from "../../../db/admin-store";

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    storage: checkStorage(),
    line_login: Boolean(process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET),
    line_push: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
  };
  const ok = Object.values(checks).every(Boolean);

  return Response.json({
    ok,
    service: "jshs-admission-site",
    phase: "line-admin-and-file-backend",
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

function checkStorage() {
  try {
    getR2();
    return true;
  } catch {
    return false;
  }
}
