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

    // If published, optionally append to local senior_shares.csv if filesystem is available
    if (status === "published" && typeof process !== "undefined" && process.cwd) {
      try {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const filePath = path.join(process.cwd(), "data/senior_shares.csv");
        const customRow = form.get("csvRow");
        if (customRow && typeof customRow === "string" && fs.existsSync(filePath)) {
          fs.appendFileSync(filePath, customRow + "\r\n", "utf8");
        }
      } catch (e) {
        // Safe to ignore on edge environments
      }
    }

    if (request.headers.get("accept")?.includes("application/json") || request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ ok: true, updated, status });
    }

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
