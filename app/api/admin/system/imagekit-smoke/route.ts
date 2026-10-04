import { consumeAdminRateLimit, upsertSiteSetting } from "../../../../../db/admin-store";
import { requireAdminRole } from "../../../../admin/auth";
import { assertSameOrigin } from "../../../../../lib/admin-security";
import { runImageKitStorageSmokeTest } from "../../../../../lib/imagekit-server";
import { getCommunityDatabase, getCoreDatabase, getLearningDatabase } from "../../../../../db/bindings";

export const dynamic = "force-dynamic";
const MIGRATION_KEY = "STORAGE_MIGRATION_IMAGEKIT_SMOKE";

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ ok: false, error: "cross_origin_request" }, { status: 403 }); }
  const admin = await requireAdminRole("editor");
  const body = await request.json().catch(() => null) as { nonce?: unknown; mode?: unknown } | null;
  const mode = body?.mode;
  if (mode !== "imagekit" && mode !== "cutover") {
    return Response.json({ ok: false, error: "invalid_smoke_mode" }, { status: 400 });
  }
  const limit = await consumeAdminRateLimit({ key: `storage-${mode}-smoke:${admin.user.lineUserId}`, limit: mode === "imagekit" ? 2 : 60, windowSeconds: 600 });
  if (!limit.allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  if (typeof body?.nonce !== "string" || !/^[a-f0-9-]{36}$/.test(body.nonce)) {
    return Response.json({ ok: false, error: "invalid_smoke_nonce" }, { status: 400 });
  }

  try {
    const result = mode === "imagekit" ? await runImageKitStorageSmokeTest() : await verifySplitDatabaseBindings();
    await upsertSiteSetting(MIGRATION_KEY, `${body.nonce}:PASS`, "storage-migration-smoke");
    return Response.json({ ok: true, result }, { headers: { "cache-control": "no-store" } });
  } catch {
    try { await upsertSiteSetting(MIGRATION_KEY, `${body.nonce}:FAIL`, "storage-migration-smoke"); }
    catch { return Response.json({ ok: false, error: "imagekit_smoke_failed_and_status_unrecorded" }, { status: 502 }); }
    return Response.json({ ok: false, error: `${mode}_smoke_failed` }, { status: 502 });
  }
}

async function verifySplitDatabaseBindings() {
  const databases = [
    ["core", getCoreDatabase()],
    ["learning", getLearningDatabase()],
    ["community", getCommunityDatabase()],
  ] as const;
  for (const [domain, connection] of databases) {
    if (connection.mode !== "split") throw new Error(`${domain}_database_binding_not_cut_over`);
    const result = await connection.db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    if (result?.ok !== 1) throw new Error(`${domain}_database_query_failed`);
  }
  return { passed: true, splitBindingsVerified: true };
}
