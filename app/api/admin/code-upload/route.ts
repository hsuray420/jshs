import { redirect } from "next/navigation";
import { createAdminFile, getR2 } from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = /\.(zip|tar|tgz|gz|js|ts|tsx|html|css|json|md)$/i;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const upload = formData.get("program");
  if (!(upload instanceof File)) {
    return Response.json({ ok: false, error: "file_required" }, { status: 400 });
  }
  if (!ALLOWED_EXTENSIONS.test(upload.name)) {
    return Response.json(
      { ok: false, error: "unsupported_program_file" },
      { status: 400 },
    );
  }

  const runNote = String(formData.get("run_note") || "").slice(0, 700);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const safeFileName = upload.name.replace(/[^\w.\-\u4e00-\u9fff]/g, "_");
  const objectKey = `private/code-upload/${createdAt.slice(0, 10)}/${id}-${safeFileName}`;
  const description = [
    "程式包已上傳，狀態：待人工部署/執行。",
    runNote ? `修改說明：${runNote}` : "",
  ].filter(Boolean).join(" ");

  await getR2().put(objectKey, upload.stream(), {
    httpMetadata: { contentType: upload.type || "application/octet-stream" },
  });
  await createAdminFile({
    id,
    object_key: objectKey,
    file_name: upload.name,
    content_type: upload.type || "application/octet-stream",
    size: upload.size,
    category: "code-deploy",
    visibility: "private",
    description,
    uploaded_by: admin.user.displayName,
    created_at: createdAt,
  });

  redirect("/admin?updated=code_upload");
}
