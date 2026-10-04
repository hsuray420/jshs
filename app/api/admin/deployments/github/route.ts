import { consumeAdminRateLimit, createSchoolDeploymentAudit, markSchoolDataDraftPublished, updateSchoolPublishAuditStatus } from "../../../../../db/admin-store";
import { assertSameOrigin } from "../../../../../lib/admin-security";
import { getGitHubDeploymentStatus } from "../../../../../lib/school-github-sync";
import { getSchoolByCode } from "../../../../../lib/school-repository";
import { assertAvailableSchoolRegion } from "../../../../../lib/school-data/regional-loader.mjs";
import { AdminAuthorizationError, requireAdminRole } from "../../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminRole("editor");
    const limit = await consumeAdminRateLimit({ key: `github-deployment:${admin.user.lineUserId}`, limit: 30, windowSeconds: 60 });
    if (!limit.allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
    const body = await request.json().catch(() => null) as { sha?: unknown; schoolCode?: unknown; regionCode?: unknown } | null;
    if (!body || typeof body.sha !== "string" || !/^[a-f0-9]{40}$/i.test(body.sha)
      || typeof body.schoolCode !== "string" || !/^[A-Za-z0-9_-]{1,20}$/.test(body.schoolCode)
      || typeof body.regionCode !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(body.regionCode)) {
      return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
    }
    const school = getSchoolByCode(body.schoolCode);
    const ownsRegion = school?.admissionRecords.some((record) =>
      (record as typeof record & { sourceDistrictCode?: string }).sourceDistrictCode === body.regionCode);
    if (!ownsRegion) return Response.json({ ok: false, error: "school_region_mismatch" }, { status: 400 });

    const deployment = await getGitHubDeploymentStatus(body.sha);
    if (deployment.status === "success") {
      await markSchoolDataDraftPublished(body.schoolCode, body.regionCode, admin.user.lineUserId);
      await updateSchoolPublishAuditStatus(body.sha, "success");
    }
    if (deployment.status === "failure" || deployment.status === "cancelled") {
      await updateSchoolPublishAuditStatus(body.sha, "failed", `workflow_${deployment.status}`);
    }
    if (deployment.status === "success" || deployment.status === "failure" || deployment.status === "cancelled") {
      await createSchoolDeploymentAudit({
        admin_id: admin.user.lineUserId,
        admin_name: admin.user.displayName,
        status: deployment.status === "success" ? "success" : "failed",
        school_code: body.schoolCode,
        school_name: school?.name || body.schoolCode,
        region_code: body.regionCode,
        source_file: assertAvailableSchoolRegion(body.regionCode).csvPath || "GitHub Actions",
        commit_sha: body.sha,
        error_message: deployment.status === "success" ? "" : `workflow_${deployment.status}`,
      });
    }
    return Response.json({ ok: true, deployment });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || (error instanceof Error && error.message === "cross_origin_request")) {
      return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    console.error("GitHub deployment status check failed", error);
    return Response.json({ ok: false, error: "deployment_status_failed" }, { status: 502 });
  }
}
