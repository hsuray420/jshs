import { redirect } from "next/navigation";
import { createAdminFile, upsertSiteSetting } from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";
const MAX_D1_FILE_BYTES = 750_000;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const upload = formData.get("schools_csv");
  if (!(upload instanceof File)) {
    return Response.json({ ok: false, error: "csv_required" }, { status: 400 });
  }

  const fileName = upload.name || "schools.csv";
  if (!fileName.toLowerCase().endsWith(".csv")) {
    return Response.json({ ok: false, error: "csv_only" }, { status: 400 });
  }
  if (upload.size > MAX_D1_FILE_BYTES) {
    return Response.json({ ok: false, error: "file_too_large", maxBytes: MAX_D1_FILE_BYTES }, { status: 413 });
  }

  const csvText = await upload.text();
  if (!csvText.includes("學校名稱") || !csvText.includes("學校代碼")) {
    return Response.json(
      { ok: false, error: "invalid_school_csv" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const objectKey = `d1/schools/${now.slice(0, 10)}-${id}-${safeFileName(fileName)}`;
  await createAdminFile({
    id,
    object_key: objectKey,
    file_name: fileName,
    content_type: "text/csv; charset=utf-8",
    size: upload.size,
    category: "school",
    visibility: "private",
    description: "後台上傳的學校 CSV（Cloudflare D1）",
    uploaded_by: admin.user.displayName,
    created_at: now,
    file_blob: new TextEncoder().encode(csvText).buffer,
  });

  await upsertSiteSetting("schools_csv_file_id", id, admin.user.displayName);
  await upsertSiteSetting("schools_csv_file_name", fileName, admin.user.displayName);
  await upsertSiteSetting("schools_csv_updated_at", now, admin.user.displayName);

  redirect("/admin?updated=schools_csv");
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-\u4e00-\u9fff]/g, "_");
}
