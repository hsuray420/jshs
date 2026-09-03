import { redirect } from "next/navigation";
import { createAdminFile } from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";
const MAX_D1_FILE_BYTES = 750_000;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const upload = formData.get("file");
  if (!(upload instanceof File)) {
    return Response.json({ ok: false, error: "file_required" }, { status: 400 });
  }
  if (upload.size > MAX_D1_FILE_BYTES) {
    return Response.json({ ok: false, error: "file_too_large", maxBytes: MAX_D1_FILE_BYTES }, { status: 413 });
  }

  const category = String(formData.get("category") || "general").slice(0, 80);
  const visibility =
    String(formData.get("visibility") || "public") === "private"
      ? "private"
      : "public";
  const description = String(formData.get("description") || "").slice(0, 500);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const safeFileName = upload.name.replace(/[^\w.\-\u4e00-\u9fff]/g, "_");
  const objectKey = `${visibility}/${createdAt.slice(0, 10)}/${id}-${safeFileName}`;

  await createAdminFile({
    id,
    object_key: objectKey,
    file_name: upload.name,
    content_type: upload.type || "application/octet-stream",
    size: upload.size,
    category,
    visibility,
    description,
    uploaded_by: admin.user.displayName,
    created_at: createdAt,
    file_blob: await upload.arrayBuffer(),
  });

  redirect("/admin/media");
}
