import { requireAdminRole } from "../../../../../app/admin/auth";
import { assertSameOrigin } from "../../../../../lib/admin-security";
import { createImageKitUploadSignature } from "../../../../../lib/imagekit-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAdminRole("editor");
    const signature = await createImageKitUploadSignature();
    return Response.json({ ok: true, ...signature }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "imagekit_auth_failed";
    const status = code === "admin_role_forbidden" ? 403 : code === "cross_origin_request" ? 403 : code === "imagekit_not_configured" ? 503 : 500;
    return Response.json({ ok: false, error: status === 500 ? "imagekit_auth_failed" : code }, { status });
  }
}
