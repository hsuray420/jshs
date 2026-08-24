import { getAdminSession } from "../../../admin/auth";
import { moderateSchoolReview } from "../../../../db/school-review-store";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return Response.json({ ok: false, error: "admin_required" }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ ok: false, error: "same_origin_required" }, { status: 403 });
  const form = await request.formData();
  const id = clean(form.get("id"), 80);
  const status = form.get("status");
  if (!id || (status !== "published" && status !== "rejected")) return Response.json({ ok: false, error: "invalid_moderation" }, { status: 400 });
  try {
    const updated = await moderateSchoolReview(id, status);
    return Response.redirect(new URL(`/admin?updated=review_${updated ? status : "not_found"}`, request.url), 303);
  } catch {
    return Response.json({ ok: false, error: "review_service_unavailable" }, { status: 503 });
  }
}

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
