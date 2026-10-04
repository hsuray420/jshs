import { redirect } from "next/navigation";
import { deleteAdminFile, enqueueExternalMediaCleanup, getAdminFile } from "../../../../../db/admin-store";
import { deleteImageKitFile } from "../../../../../lib/imagekit-server";
import { requireAdmin } from "../../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const file = await getAdminFile(id);
  if (file?.storage_provider === "imagekit" && file.external_file_id) {
    try {
      await deleteImageKitFile(file.external_file_id);
    } catch (error) {
      console.error("Admin ImageKit file deletion failed", error instanceof Error ? error.message : "unknown_error");
      await enqueueExternalMediaCleanup({ provider: "imagekit", fileId: file.external_file_id, error: "admin_file_delete_failed" });
    }
  }
  await deleteAdminFile(id);
  redirect("/admin/media");
}
