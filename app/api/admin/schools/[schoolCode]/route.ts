import { AdminAuthorizationError, requireAdminRole } from "../../../../admin/auth";
import { getSchoolByCode } from "../../../../../lib/school-repository";
import { assertAvailableSchoolRegion } from "../../../../../lib/school-data/regional-loader.mjs";
import { validateSchoolAdminUpdates } from "../../../../../lib/school-admin-csv.mjs";
import { previewCanonicalSchoolRow, syncCanonicalSchoolRow } from "../../../../../lib/school-github-sync";
import { assertSameOrigin } from "../../../../../lib/admin-security";
import { consumeAdminRateLimit, createSchoolDataAuditEntries, markSchoolDataDraftPublished, upsertSchoolDataDraft } from "../../../../../db/admin-store";

export const dynamic = "force-dynamic";

type Action = "save-draft" | "preview" | "publish";
type RequestBody = { action?: unknown; regionCode?: unknown; expectedSha?: unknown; updates?: unknown; baseValues?: unknown };

export async function POST(request: Request, { params }: { params: Promise<{ schoolCode: string }> }) {
  try {
    assertSameOrigin(request);
    const body = await request.json().catch(() => null) as RequestBody | null;
    const action = body?.action as Action;
    if (!body || !["save-draft", "preview", "publish"].includes(action) || typeof body.regionCode !== "string" || typeof body.expectedSha !== "string") {
      return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
    }
    const admin = await requireAdminRole(action === "publish" ? "administrator" : "editor");
    const limit = await consumeAdminRateLimit({
      key: `school-data:${admin.user.lineUserId}:${action}`,
      limit: action === "publish" ? 6 : action === "preview" ? 20 : 60,
      windowSeconds: 60,
    });
    if (!limit.allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
    const { schoolCode } = await params;
    const school = getSchoolByCode(schoolCode);
    if (!school) return Response.json({ ok: false, error: "school_not_found" }, { status: 404 });
    const region = assertAvailableSchoolRegion(body.regionCode);
    const record = school.admissionRecords.find((candidate) => (candidate as AdmissionRecordWithSource).sourceDistrictCode === body.regionCode);
    if (!record) return Response.json({ ok: false, error: "school_region_mismatch" }, { status: 400 });
    const updates = validateSchoolAdminUpdates(body.updates) as Record<string, string>;
    const baseValues = validateBaseValues(body.baseValues, Object.keys(updates));
    const sourceFile = region.csvPath || "regional CSV";
    const context = { regionCode: body.regionCode, schoolCode, schoolName: school.name, updates, baseValues, expectedSha: body.expectedSha };

    if (action === "save-draft") {
      const draft = await upsertSchoolDataDraft({
        school_code: schoolCode, school_name: school.name, region_code: body.regionCode,
        source_file: sourceFile, base_sha: body.expectedSha,
        base_values_json: JSON.stringify(baseValues), updates_json: JSON.stringify(updates),
        created_by: admin.user.lineUserId, updated_by: admin.user.lineUserId,
      });
      await writeAudit(admin.user, "draft", "success", context, "", "");
      return Response.json({ ok: true, status: "draft", draftUpdatedAt: draft?.updated_at });
    }

    if (action === "preview") {
      const result = await previewCanonicalSchoolRow(context);
      if (result.reason === "field_conflict") {
        await writeAudit(admin.user, "preview", "conflict", context, "", "field_conflict");
        return Response.json({ ok: false, error: "field_conflict", conflicts: result.conflicts, latestSha: result.sha }, { status: 409 });
      }
      if (result.reason === "github_token_missing") {
        await writeAudit(admin.user, "preview", "failed", context, "", result.reason);
        return Response.json({ ok: false, error: "github_not_configured" }, { status: 503 });
      }
      if (!("previewed" in result) || !result.previewed) {
        await writeAudit(admin.user, "preview", "failed", context, "", "github_sync_failed");
        return Response.json({ ok: false, error: "github_sync_failed" }, { status: 502 });
      }
      await writeAudit(admin.user, "preview", "success", context, "", "");
      return Response.json({ ok: true, status: "preview", diff: result.diff, changedFields: result.changedFields, latestSha: result.sha, sourceFile: result.filePath, rowCount: result.rowCount });
    }

    const result = await syncCanonicalSchoolRow(context);
    if (result.reason === "field_conflict") {
      await writeAudit(admin.user, "publish", "conflict", context, "", "field_conflict");
      return Response.json({ ok: false, error: "field_conflict", conflicts: result.conflicts, latestSha: result.sha }, { status: 409 });
    }
    if (result.reason === "sha_conflict") {
      await writeAudit(admin.user, "publish", "conflict", context, "", result.reason);
      return Response.json({ ok: false, error: "sha_conflict" }, { status: 409 });
    }
    if (result.reason === "github_token_missing") {
      await writeAudit(admin.user, "publish", "failed", context, "", result.reason);
      return Response.json({ ok: false, error: "github_not_configured" }, { status: 503 });
    }
    if (result.reason === "unchanged") return Response.json({ ok: true, status: "unchanged", changedFields: [] });
    if (!("synced" in result) || !result.synced) {
      const reason = "reason" in result && result.reason ? result.reason : "github_sync_failed";
      await writeAudit(admin.user, "publish", "failed", context, "", reason);
      return Response.json({ ok: false, error: "github_sync_failed" }, { status: 502 });
    }
    await markSchoolDataDraftPublished(schoolCode, body.regionCode, admin.user.lineUserId);
    await writeAudit(admin.user, "publish", "success", context, result.commitSha, "");
    return Response.json({ ok: true, status: "synced", changedFields: result.changedFields, commitSha: result.commitSha, commitUrl: result.commitUrl, syncedAt: result.syncedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "validation_failed";
    if (error instanceof AdminAuthorizationError || message === "cross_origin_request") return Response.json({ ok: false, error: message }, { status: 403 });
    if (/not editable|invalid URL|too long|updates must|base value/.test(message)) return Response.json({ ok: false, error: "invalid_fields" }, { status: 422 });
    if (/not found|duplicate school code|schema|invalid school|required|record count/.test(message)) return Response.json({ ok: false, error: "csv_validation_failed" }, { status: 422 });
    if (message === "github_config_invalid") return Response.json({ ok: false, error: "github_not_configured" }, { status: 503 });
    return Response.json({ ok: false, error: "sync_failed" }, { status: 500 });
  }
}

function validateBaseValues(value: unknown, fields: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("base values must be an object");
  const record = value as Record<string, unknown>;
  return Object.fromEntries(fields.map((field) => {
    if (typeof record[field] !== "string") throw new Error(`base value must be text: ${field}`);
    return [field, record[field]];
  }));
}

async function writeAudit(
  admin: { lineUserId: string; displayName: string },
  action: "draft" | "preview" | "publish",
  status: "success" | "failed" | "conflict",
  context: { schoolCode: string; schoolName: string; regionCode: string; updates: Record<string, string>; baseValues: Record<string, string> },
  commitSha: string,
  errorMessage: string,
) {
  const fields = Object.keys(context.updates);
  await createSchoolDataAuditEntries((fields.length ? fields : [""]).map((field) => ({
    admin_id: admin.lineUserId, admin_name: admin.displayName, action, status,
    school_code: context.schoolCode, school_name: context.schoolName, region_code: context.regionCode,
    source_file: assertAvailableSchoolRegion(context.regionCode).csvPath || "regional CSV",
    field, old_value: context.baseValues[field] || "", new_value: context.updates[field] || "",
    commit_sha: commitSha, error_message: errorMessage,
  })));
}

type AdmissionRecordWithSource = { sourceDistrictCode?: string };
