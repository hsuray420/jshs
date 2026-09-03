import { redirect } from "next/navigation";
import { createDeploymentEvent, getAdminFile } from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

const allowedActions = new Set(["validate", "test", "deploy", "rollback"]);

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const action = String(form.get("action") || "");
  const fileId = String(form.get("file_id") || "");
  if (!allowedActions.has(action) || !fileId || !(await getAdminFile(fileId))) {
    return Response.json({ ok: false, error: "invalid_deployment_request" }, { status: 400 });
  }
  const status = action === "rollback" || action === "deploy" ? "requested" : "pending";
  await createDeploymentEvent({
    id: crypto.randomUUID(),
    file_id: fileId,
    action: action as "validate" | "test" | "deploy" | "rollback",
    status,
    note: action === "rollback" ? "Rollback 已建立請求，需由 GitHub Actions／部署人員執行。" : "已建立部署流程事件。",
    created_by: admin.user.displayName,
  });
  redirect("/admin/deployments?updated=queued");
}

export async function PUT(request: Request) {
  return POST(request);
}
