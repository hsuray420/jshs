import { createDataReport, consumeDataReportRateLimit, type DataReport } from "../../../db/data-report-store";
import { normalizeDataReportInput } from "../../../lib/data-report.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false, error: "same_origin_required" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_000) return Response.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  const body = await request.json().catch(() => null);
  const normalized = normalizeDataReportInput(body);
  if (!normalized.ok || !normalized.value) return Response.json(normalized, { status: normalized.error === "invalid_json" ? 400 : 422 });

  try {
    if (!await consumeDataReportRateLimit(await clientFingerprint(request))) {
      return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }
    const value = normalized.value;
    const report: DataReport = {
      id: crypto.randomUUID(),
      page_url: value.pageUrl,
      category: value.category,
      dataset: value.dataset,
      academic_year: value.academicYear,
      field: value.field,
      current_value: value.currentValue,
      suggested_value: value.suggestedValue,
      source_url: value.sourceUrl,
      note: value.note,
      contact: value.contact,
      status: "pending",
      review_note: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await createDataReport(report);
    return Response.json({ ok: true, status: "pending", message: "已收到回報，確認後會更新資料。" }, { status: 202, headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "report_service_unavailable" }, { status: 503 });
  }
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || ["same-origin", "same-site", "none"].includes(fetchSite);
}

async function clientFingerprint(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`jshs-data-report:${forwarded}`));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}
