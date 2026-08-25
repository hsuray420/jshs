import { redirect } from "next/navigation";
import {
  isContentType,
  publishContentEntry,
  saveContentEntry,
  unpublishContentEntry,
} from "../../../../db/content-store";
import { syncContentToGitHub } from "../../../../lib/github-sync";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const form = await request.formData();
  const action = clean(form.get("action"), 30);
  const id = clean(form.get("id"), 80);

  if (action === "publish" && id) {
    const entry = await publishContentEntry(id, admin.user.lineUserId);
    return redirect(`/admin/content?updated=published&sync=${await syncState(entry)}`);
  }
  if (action === "unpublish" && id) {
    const entry = await unpublishContentEntry(id, admin.user.lineUserId);
    return redirect(`/admin/content?updated=unpublished&sync=${await syncState(entry)}`);
  }
  if (action !== "save") return redirect("/admin/content?updated=invalid");

  const contentType = clean(form.get("content_type"), 40);
  const slug = clean(form.get("slug"), 120);
  const title = clean(form.get("title"), 160);
  const summary = clean(form.get("summary"), 1000);
  const bodyJson = withTextStyle(clean(form.get("body_json"), 12000), clean(form.get("font_size"), 4), clean(form.get("text_color"), 7));
  const status = form.get("status") === "published" ? "published" : "draft";
  if (!isContentType(contentType) || !slug || !title || !isJsonObject(bodyJson)) {
    return redirect("/admin/content?updated=invalid");
  }
  const entry = await saveContentEntry({ id: id || undefined, contentType, slug, title, summary, bodyJson, status, updatedBy: admin.user.lineUserId });
  return redirect(`/admin/content?updated=${status}&sync=${await syncState(entry)}`);
}

async function syncState(entry: Awaited<ReturnType<typeof saveContentEntry>> | null) {
  if (!entry) return "failed";
  const result = await syncContentToGitHub(entry);
  return result.synced ? "ok" : result.configured ? "failed" : "pending";
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

function withTextStyle(value: string, requestedSize: string, requestedColor: string) {
  if (!isJsonObject(value)) return value;
  const parsed = JSON.parse(value) as Record<string, unknown>;
  const fontSize = ["14", "16", "18", "20", "24", "28", "32"].includes(requestedSize) ? requestedSize : "16";
  const color = /^#[0-9a-f]{6}$/i.test(requestedColor) ? requestedColor : "#1C1C1E";
  return JSON.stringify({ ...parsed, style: { ...(isRecord(parsed.style) ? parsed.style : {}), fontSize, color } });
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
