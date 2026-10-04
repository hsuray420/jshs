import { consumeAdminRateLimit } from "../../../../../db/admin-store";
import { requireAdminRole } from "../../../../admin/auth";
import { assertSameOrigin } from "../../../../../lib/admin-security";
import { runImageKitStorageSmokeTest } from "../../../../../lib/imagekit-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return Response.json({ ok: false, error: "cross_origin_request" }, { status: 403 });
  }

  const admin = await requireAdminRole("editor");
  const limit = await consumeAdminRateLimit({
    key: `imagekit-smoke:${admin.user.lineUserId}`,
    limit: 2,
    windowSeconds: 600,
  });
  if (!limit.allowed) {
    return Response.json({ ok: false, error: "rate_limited" }, {
      status: 429,
      headers: { "retry-after": String(limit.retryAfterSeconds) },
    });
  }

  try {
    const result = await runImageKitStorageSmokeTest();
    return Response.json({ ok: true, result }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Admin ImageKit smoke test failed", error instanceof Error ? error.message : "unknown_error");
    return Response.json({ ok: false, error: "imagekit_smoke_failed" }, { status: 502 });
  }
}
