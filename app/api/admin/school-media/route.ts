import { redirect } from "next/navigation";
import {
  consumeAdminRateLimit,
  deleteAdminFile,
  enqueueExternalMediaCleanup,
} from "../../../../db/admin-store";
import { deleteSchoolMediaMetadata, getSchoolMediaMetadata, saveSchoolMediaMetadata } from "../../../../db/school-media-store";
import { requireAdminRole } from "../../../admin/auth";
import { getSchoolSearchIndex } from "../../../../lib/school-search-index";
import { deleteImageKitFile, getImageKitConfig, uploadSchoolImageToImageKit } from "../../../../lib/imagekit-server";
import { assertSameOrigin } from "../../../../lib/admin-security";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const SOURCES = new Set(["jshs-owned", "official-school-site", "licensed-public", "admin-provided"]);

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ ok: false, error: "cross_origin_request" }, { status: 403 }); }
  const admin = await requireAdminRole("editor");
  const limit = await consumeAdminRateLimit({ key: `school-media:${admin.user.lineUserId}`, limit: 12, windowSeconds: 60 });
  if (!limit.allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });

  const form = await request.formData();
  const schoolCode = clean(form.get("school_code"), 12);
  const school = getSchoolSearchIndex().find((entry) => entry.code === schoolCode);
  if (!school) return redirect("/admin/media?updated=school_image_invalid_school");

  if (form.get("action") === "remove") {
    const current = await getSchoolMediaMetadata(schoolCode);
    if (current?.storage_provider === "imagekit") {
      try { await deleteImageKitFile(current.file_id); }
      catch { return redirect("/admin/media?updated=school_image_delete_failed"); }
    }
    await deleteSchoolMediaMetadata(schoolCode);
    if (current?.storage_provider !== "imagekit" && current) await deleteAdminFile(current.file_id);
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

  const createdAt = new Date().toISOString();
  const current = await getSchoolMediaMetadata(schoolCode);
  const imageKitConfigured = Boolean(getImageKitConfig());
  let fileId = crypto.randomUUID();
  let imageUrl = "";
  let thumbnailUrl = "";
  if (imageKitConfigured) {
    try {
      const image = await uploadSchoolImageToImageKit({ file: upload, schoolCode });
      fileId = image.fileId;
      imageUrl = image.url;
      thumbnailUrl = image.thumbnailUrl;
    } catch { return redirect("/admin/media?updated=school_image_upload_failed"); }
  } else {
    return redirect("/admin/media?updated=school_image_not_configured");
  }
  try {
    await saveSchoolMediaMetadata({
      school_code: schoolCode,
      file_id: fileId,
      storage_provider: "imagekit",
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      source: source as "jshs-owned" | "official-school-site" | "licensed-public" | "admin-provided",
      source_url: sourceUrl,
      license,
      credit,
      alt,
      sort_order: current?.sort_order ?? 0,
      is_cover: current?.is_cover ?? true,
      updated_by: admin.user.displayName,
      updated_at: createdAt,
    });
  } catch (error) {
    console.error("School image metadata persistence failed", error);
    try {
      await deleteImageKitFile(fileId);
    } catch (cleanupError) {
      console.error("New ImageKit file cleanup failed", cleanupError);
      await enqueueExternalMediaCleanup({ provider: "imagekit", fileId, error: "metadata_persist_failed" });
    }
    return redirect("/admin/media?updated=school_image_metadata_failed");
  }
  if (current && current.file_id !== fileId) {
    if (current.storage_provider === "imagekit") {
      try { await deleteImageKitFile(current.file_id); }
      catch { await enqueueExternalMediaCleanup({ provider: "imagekit", fileId: current.file_id, error: "replace_cleanup_failed" }); }
    } else await deleteAdminFile(current.file_id);
  }
  return redirect("/admin/media?updated=school_image_saved");
}

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
