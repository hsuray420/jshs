import { redirect } from "next/navigation";
import {
  consumeAdminRateLimit,
  deleteAdminFile,
  enqueueExternalMediaCleanup,
  createSchoolDataAuditEntries,
} from "../../../../db/admin-store";
import {
  deleteSchoolMediaDraft,
  deleteSchoolMediaMetadata,
  getSchoolMediaDraft,
  getSchoolMediaDraftForUser,
  getSchoolMediaMetadata,
  getPendingSchoolMediaDraft,
  markSchoolMediaDraftPublished,
  saveSchoolMediaDraft,
  saveSchoolMediaMetadata,
  type SchoolMediaDraft,
} from "../../../../db/school-media-store";
import { AdminAuthorizationError, requireAdminRole } from "../../../admin/auth";
import { getSchoolSearchIndex } from "../../../../lib/school-search-index";
import { deleteImageKitFile, getImageKitConfig, uploadSchoolImageToImageKit } from "../../../../lib/imagekit-server";
import { assertSameOrigin } from "../../../../lib/admin-security";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const SOURCES = new Set(["jshs-owned", "official-school-site", "licensed-public", "admin-provided"]);

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ ok: false, error: "cross_origin_request" }, { status: 403 }); }
  const form = await request.formData();
  const action = clean(form.get("action"), 32);
  let admin;
  try {
    admin = await requireAdminRole(action === "publish-draft" || action === "remove" ? "administrator" : "editor");
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return Response.json({ ok: false, error: "admin_role_forbidden" }, { status: 403 });
    throw error;
  }
  const limit = await consumeAdminRateLimit({ key: `school-media:${admin.user.lineUserId}`, limit: 12, windowSeconds: 60 });
  if (!limit.allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });

  if (action === "publish-draft") return publishDraft(form, admin.user.lineUserId, admin.user.displayName);
  if (action === "discard-draft") return discardDraft(form, admin.user.lineUserId, admin.user.displayName, admin.user.role);

  const schoolCode = clean(form.get("school_code"), 12);
  const school = getSchoolSearchIndex().find((entry) => entry.code === schoolCode);
  if (!school) return redirect("/admin/media?updated=school_image_invalid_school");

  if (action === "remove") {
    const current = await getSchoolMediaMetadata(schoolCode);
    if (current?.storage_provider === "imagekit") {
      try { await deleteImageKitFile(current.file_id); }
      catch { return redirect("/admin/media?updated=school_image_delete_failed"); }
    }
    await deleteSchoolMediaMetadata(schoolCode);
    if (current?.storage_provider !== "imagekit" && current) await deleteAdminFile(current.file_id);
    if (current) await writeMediaAudit(admin.user.lineUserId, admin.user.displayName, "publish", schoolCode, school.name, current.file_id, "");
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
  if (!getImageKitConfig()) return redirect("/admin/media?updated=school_image_not_configured");
  const pendingDraft = await getPendingSchoolMediaDraft(schoolCode);
  if (pendingDraft && pendingDraft.created_by !== admin.user.lineUserId) {
    return redirect("/admin/media?updated=school_image_draft_conflict");
  }

  const previousDraft = await getSchoolMediaDraftForUser(schoolCode, admin.user.lineUserId);
  const createdAt = new Date().toISOString();
  let image;
  try {
    image = await uploadSchoolImageToImageKit({ file: upload, schoolCode });
  } catch {
    return redirect("/admin/media?updated=school_image_upload_failed");
  }
  let draft: SchoolMediaDraft | null;
  try {
    draft = await saveSchoolMediaDraft({
      school_code: schoolCode,
      file_id: image.fileId,
      storage_provider: "imagekit",
      image_url: image.url,
      thumbnail_url: image.thumbnailUrl,
      source: source as "jshs-owned" | "official-school-site" | "licensed-public" | "admin-provided",
      source_url: sourceUrl,
      license,
      credit,
      alt,
      sort_order: 0,
      is_cover: true,
      updated_by: admin.user.displayName,
      updated_at: createdAt,
      created_by: admin.user.lineUserId,
    });
  } catch (error) {
    console.error("School image draft persistence failed", error);
    await cleanUpUnpersistedImage(image.fileId, "draft_persist_failed");
    return redirect("/admin/media?updated=school_image_draft_failed");
  }
  if (!draft) {
    await cleanUpUnpersistedImage(image.fileId, "draft_persist_failed");
    return redirect("/admin/media?updated=school_image_draft_failed");
  }
  await writeMediaAudit(admin.user.lineUserId, admin.user.displayName, "draft", schoolCode, school.name, previousDraft?.file_id || "", image.fileId);
  if (previousDraft && previousDraft.file_id !== image.fileId) {
    await cleanUpUnpersistedImage(previousDraft.file_id, "replaced_image_draft");
  }
  return redirect("/admin/media?updated=school_image_draft_saved");
}

async function publishDraft(form: FormData, adminId: string, adminName: string) {
  const draftId = clean(form.get("draft_id"), 80);
  const draft = await getSchoolMediaDraft(draftId);
  if (!draft || draft.status !== "draft") return redirect("/admin/media?updated=school_image_draft_missing");
  const school = getSchoolSearchIndex().find((entry) => entry.code === draft.school_code);
  if (!school) return redirect("/admin/media?updated=school_image_invalid_school");
  const current = await getSchoolMediaMetadata(draft.school_code);
  const publishedAt = new Date().toISOString();
  await saveSchoolMediaMetadata({
    school_code: draft.school_code,
    file_id: draft.file_id,
    storage_provider: "imagekit",
    image_url: draft.image_url,
    thumbnail_url: draft.thumbnail_url,
    source: draft.source,
    source_url: draft.source_url,
    license: draft.license,
    credit: draft.credit,
    alt: draft.alt,
    sort_order: current?.sort_order ?? 0,
    is_cover: current?.is_cover ?? true,
    updated_by: adminName,
    updated_at: publishedAt,
  });
  await markSchoolMediaDraftPublished(draftId, adminId);
  await writeMediaAudit(adminId, adminName, "publish", draft.school_code, school.name, current?.file_id || "", draft.file_id);
  if (current && current.file_id !== draft.file_id) await cleanUpUnpersistedImage(current.file_id, "replaced_published_image");
  return redirect("/admin/media?updated=school_image_published");
}

async function discardDraft(form: FormData, adminId: string, adminName: string, role: string) {
  const draftId = clean(form.get("draft_id"), 80);
  const draft = await getSchoolMediaDraft(draftId);
  if (!draft || draft.status !== "draft") return redirect("/admin/media?updated=school_image_draft_missing");
  if (draft.created_by !== adminId && role !== "owner" && role !== "administrator") {
    return Response.json({ ok: false, error: "admin_role_forbidden" }, { status: 403 });
  }
  const deleted = await deleteSchoolMediaDraft(draftId, draft.created_by);
  if (!deleted) return redirect("/admin/media?updated=school_image_draft_missing");
  const schoolName = getSchoolSearchIndex().find((entry) => entry.code === draft.school_code)?.name || draft.school_code;
  await writeMediaAudit(adminId, adminName, "draft", draft.school_code, schoolName, draft.file_id, "", "draft_discarded");
  await cleanUpUnpersistedImage(draft.file_id, "discarded_image_draft");
  return redirect("/admin/media?updated=school_image_draft_discarded");
}

async function writeMediaAudit(adminId: string, adminName: string, action: "draft" | "publish", schoolCode: string, schoolName: string, oldFileId: string, newFileId: string, errorMessage = "") {
  await createSchoolDataAuditEntries([{
    admin_id: adminId,
    admin_name: adminName,
    action,
    status: errorMessage ? "failed" : "success",
    school_code: schoolCode,
    school_name: schoolName,
    region_code: "media",
    source_file: "ImageKit metadata",
    field: "校園圖片",
    old_value: oldFileId,
    new_value: newFileId,
    commit_sha: "",
    error_message: errorMessage,
  }]);
}

async function cleanUpUnpersistedImage(fileId: string, reason: string) {
  try { await deleteImageKitFile(fileId); }
  catch (error) {
    console.error("ImageKit cleanup failed", error);
    await enqueueExternalMediaCleanup({ provider: "imagekit", fileId, error: reason });
  }
}

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
