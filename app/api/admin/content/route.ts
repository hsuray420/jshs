import { redirect } from "next/navigation";
import {
  isContentType,
  publishContentEntry,
  saveContentEntry,
  unpublishContentEntry,
} from "../../../../db/content-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const form = await request.formData();
  const action = clean(form.get("action"), 30);
  const id = clean(form.get("id"), 80);

  if (action === "publish" && id) {
    await publishContentEntry(id, admin.user.lineUserId);
    return redirect("/admin/content?updated=published");
  }
  if (action === "unpublish" && id) {
    await unpublishContentEntry(id, admin.user.lineUserId);
    return redirect("/admin/content?updated=unpublished");
  }
  if (action !== "save") return redirect("/admin/content?updated=invalid");

  const contentType = clean(form.get("content_type"), 40);
  const slug = clean(form.get("slug"), 120);
  const title = clean(form.get("title"), 160);
  const summary = clean(form.get("summary"), 1000);
  const bodyJson = clean(form.get("body_json"), 12000);
  const status = form.get("status") === "published" ? "published" : "draft";
  if (!isContentType(contentType) || !slug || !title || !isJsonObject(bodyJson)) {
    return redirect("/admin/content?updated=invalid");
  }
  await saveContentEntry({ id: id || undefined, contentType, slug, title, summary, bodyJson, status, updatedBy: admin.user.lineUserId });
  return redirect(`/admin/content?updated=${status}`);
}

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Boolean(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  } catch {
    return false;
  }
}
