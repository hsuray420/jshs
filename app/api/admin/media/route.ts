import { redirect } from "next/navigation";
import { syncMediaToGitHub, type MediaKind } from "../../../../lib/github-sync";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";
const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const allowedAudio = new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm"]);
const allowedVideo = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const upload = form.get("media");
  const kind: MediaKind = form.get("kind") === "video" ? "video" : "podcast";
  const title = clean(form.get("title"), 160);
  const summary = clean(form.get("summary"), 1000);
  if (!(upload instanceof File) || !title || upload.size > MAX_MEDIA_BYTES) return redirect("/admin?updated=media_invalid");
  const validType = kind === "video" ? allowedVideo.has(upload.type) : allowedAudio.has(upload.type);
  if (!validType) return redirect("/admin?updated=media_type_invalid");
  const id = crypto.randomUUID();
  const safeName = upload.name.replace(/[^\w.\-\u4e00-\u9fff]/g, "_");
  const src = `/media/${id}-${safeName}`;
  const result = await syncMediaToGitHub({ item: { id, kind, title, summary, src, mimeType: upload.type }, bytes: await upload.arrayBuffer() });
  redirect(`/admin?updated=${result.synced ? "media_synced" : "media_failed"}`);
}

function clean(value: FormDataEntryValue | null, maxLength: number) { return typeof value === "string" ? value.trim().slice(0, maxLength) : ""; }
