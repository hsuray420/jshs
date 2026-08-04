import { redirect } from "next/navigation";
import { getR2, upsertSiteSetting } from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

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

  const csvText = await upload.text();
  if (!csvText.includes("學校名稱") || !csvText.includes("學校代碼")) {
    return Response.json(
      { ok: false, error: "invalid_school_csv" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const objectKey = `managed/schools/${now.slice(0, 10)}-${crypto.randomUUID()}-${safeFileName(fileName)}`;
  await getR2().put(objectKey, csvText, {
    httpMetadata: { contentType: "text/csv; charset=utf-8" },
  });

  await upsertSiteSetting("schools_csv_object_key", objectKey, admin.user.displayName);
  await upsertSiteSetting("schools_csv_file_name", fileName, admin.user.displayName);
  await upsertSiteSetting("schools_csv_updated_at", now, admin.user.displayName);

  redirect("/admin?updated=schools_csv");
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-\u4e00-\u9fff]/g, "_");
}
