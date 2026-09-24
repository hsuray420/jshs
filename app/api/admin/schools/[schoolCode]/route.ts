import { requireAdmin } from "../../../../admin/auth";
import { getSchoolByCode } from "../../../../../lib/school-repository";
import { assertAvailableSchoolRegion } from "../../../../../lib/school-data/regional-loader.mjs";
import { validateSchoolAdminUpdates } from "../../../../../lib/school-admin-csv.mjs";
import { syncCanonicalSchoolRow } from "../../../../../lib/school-github-sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ schoolCode: string }> }) {
  await requireAdmin();
  const { schoolCode } = await params;
  const school = getSchoolByCode(schoolCode);
  if (!school) return Response.json({ ok: false, error: "school_not_found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { regionCode?: unknown; expectedSha?: unknown; updates?: unknown } | null;
  if (!body || typeof body.regionCode !== "string" || typeof body.expectedSha !== "string") return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
  try {
    assertAvailableSchoolRegion(body.regionCode);
    const record = school.admissionRecords.find((candidate) => (candidate as AdmissionRecordWithSource).sourceDistrictCode === body.regionCode);
    if (!record) return Response.json({ ok: false, error: "school_region_mismatch" }, { status: 400 });
    const updates = validateSchoolAdminUpdates(body.updates) as Record<string, string>;
    const result = await syncCanonicalSchoolRow({ regionCode: body.regionCode, schoolCode, updates, expectedSha: body.expectedSha });
    if (result.reason === "sha_conflict") return Response.json({ ok: false, error: "sha_conflict" }, { status: 409 });
    if (result.reason === "github_token_missing") return Response.json({ ok: false, error: "github_not_configured" }, { status: 503 });
    if (!result.synced && "reason" in result && ["github_read_failed", "github_write_failed", "github_file_invalid"].includes(result.reason)) return Response.json({ ok: false, error: "github_sync_failed" }, { status: 502 });
    if (result.reason === "unchanged") return Response.json({ ok: true, status: "unchanged", changedFields: [] });
    return Response.json({ ok: true, status: "synced", changedFields: result.changedFields, commitSha: result.commitSha, commitUrl: result.commitUrl, syncedAt: result.syncedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "validation_failed";
    if (/not editable|invalid URL|too long|updates must/.test(message)) return Response.json({ ok: false, error: "invalid_fields" }, { status: 422 });
    if (/not found|duplicate school code|schema|invalid school|required/.test(message)) return Response.json({ ok: false, error: "csv_validation_failed" }, { status: 422 });
    if (message === "github_config_invalid") return Response.json({ ok: false, error: "github_not_configured" }, { status: 503 });
    return Response.json({ ok: false, error: "sync_failed" }, { status: 500 });
  }
}

type AdmissionRecordWithSource = { sourceDistrictCode?: string };
