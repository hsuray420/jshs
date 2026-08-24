import { getSchoolDirectoryRecord } from "../../../lib/school-directory";
import { consumeSchoolReviewRateLimit, createSchoolReview, listRecentSchoolReviews, listSchoolReviews, type SchoolReview } from "../../../db/school-review-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { district, schoolCode } = readTarget(request);
  if ((district && !schoolCode) || (!district && schoolCode)) return Response.json({ ok: false, error: "school_required" }, { status: 400 });
  try {
    const reviews = district && schoolCode ? await listSchoolReviews(district, schoolCode) : await listRecentSchoolReviews();
    return Response.json({ ok: true, reviews }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "review_service_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false, error: "same_origin_required" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return Response.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });

  const district = clean(body.district, 40);
  const schoolCode = clean(body.schoolCode, 40);
  const nickname = clean(body.nickname, 40) || "匿名學長姐";
  const graduationYear = clean(body.graduationYear, 8);
  const examScore = clean(body.examScore, 120);
  const admissionScore = clean(body.admissionScore, 120);
  const admissionResult = clean(body.admissionResult, 160);
  const content = clean(body.content, 1000);
  if (!district || !schoolCode || !content) return Response.json({ ok: false, error: "review_required" }, { status: 400 });
  if (content.length < 10) return Response.json({ ok: false, error: "review_too_short" }, { status: 400 });
  if (graduationYear && !/^\d{2,4}$/.test(graduationYear)) return Response.json({ ok: false, error: "invalid_graduation_year" }, { status: 400 });
  if (body.consent !== true) return Response.json({ ok: false, error: "consent_required" }, { status: 400 });

  const school = getSchoolDirectoryRecord(district, schoolCode);
  if (!school) return Response.json({ ok: false, error: "school_not_found" }, { status: 404 });

  let allowed = false;
  try {
    allowed = await consumeSchoolReviewRateLimit(await clientFingerprint(request));
  } catch {
    return Response.json({ ok: false, error: "review_service_unavailable" }, { status: 503 });
  }
  if (!allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const review: SchoolReview = {
    id: crypto.randomUUID(),
    district,
    school_code: schoolCode,
    school_name: school.name,
    nickname,
    graduation_year: graduationYear,
    exam_score: examScore,
    admission_score: admissionScore,
    admission_result: admissionResult,
    content,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  try {
    await createSchoolReview(review);
    return Response.json({ ok: true, status: "pending", message: "已送出，待管理員審核後公開" }, { status: 202, headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "review_service_unavailable" }, { status: 503 });
  }
}

function readTarget(request: Request) {
  const url = new URL(request.url);
  return { district: clean(url.searchParams.get("district"), 40), schoolCode: clean(url.searchParams.get("schoolCode"), 40) };
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength) : "";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || ["same-origin", "same-site", "none"].includes(fetchSite);
}

async function clientFingerprint(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`jshs-school-review:${forwarded}`));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}
