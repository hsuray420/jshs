import { redirect } from "next/navigation";
import {
  createAdminFile,
  deleteAdminFile,
  deleteSchoolMediaOverride,
  getSchoolMediaOverride,
  upsertSchoolMediaOverride,
} from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";
import { getSchoolSearchIndex } from "../../../../lib/school-search-index";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 700_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SOURCES = new Set(["jshs-owned", "official-school-site", "licensed-public", "admin-provided"]);

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const schoolCode = clean(form.get("school_code"), 12);
  const school = getSchoolSearchIndex().find((entry) => entry.code === schoolCode);
  if (!school) return redirect("/admin/media?updated=school_image_invalid_school");

  if (form.get("action") === "remove") {
    const current = await getSchoolMediaOverride(schoolCode);
    await deleteSchoolMediaOverride(schoolCode);
    if (current) await deleteAdminFile(current.file_id);
    return redirect("/admin/media?updated=school_image_removed");
  }

  const upload = form.get("image");
  const source = clean(form.get("source"), 40);
  const sourceUrl = clean(form.get("source_url"), 500);
  const license = clean(form.get("license"), 160);
  const credit = clean(form.get("credit"), 160);
  const alt = clean(form.get("alt"), 160) || `${school.name}校園圖片`;
  if (!(upload instanceof File) || !upload.size || upload.size > MAX_IMAGE_BYTES || !ALLOWED_TYPES.has(upload.type)) {
    return redirect("/admin/media?updated=school_image_invalid_file");
  }
  if (!SOURCES.has(source) || !license || (source !== "jshs-owned" && !isHttpsUrl(sourceUrl))) {
    return redirect("/admin/media?updated=school_image_invalid_provenance");
  }

  const id = crypto.randomUUID();
  const safeName = upload.name.replace(/[^\w.\-\u4e00-\u9fff]/g, "_");
  const createdAt = new Date().toISOString();
  const objectKey = `public/school-images/${schoolCode}/${id}-${safeName}`;
  await createAdminFile({
    id,
    object_key: objectKey,
    file_name: upload.name,
    content_type: upload.type,
    size: upload.size,
    category: "school-image",
    visibility: "public",
    description: `${schoolCode} ${school.name} 校園圖片`,
    uploaded_by: admin.user.displayName,
    created_at: createdAt,
    file_blob: await upload.arrayBuffer(),
  });

  const current = await getSchoolMediaOverride(schoolCode);
  await upsertSchoolMediaOverride({
    school_code: schoolCode,
    file_id: id,
    source: source as "jshs-owned" | "official-school-site" | "licensed-public" | "admin-provided",
    source_url: sourceUrl,
    license,
    credit,
    alt,
    updated_by: admin.user.displayName,
    updated_at: createdAt,
  });
  if (current && current.file_id !== id) await deleteAdminFile(current.file_id);
  return redirect("/admin/media?updated=school_image_saved");
}

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
