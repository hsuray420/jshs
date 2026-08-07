import { redirect } from "next/navigation";
import {
  addExtraAdminLineUserId,
  removeExtraAdminLineUserId,
  upsertLineUser,
} from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const lineUserId = String(formData.get("line_user_id") || "").trim();
  const action = String(formData.get("action") || "add");
  if (!/^U[0-9a-f]{32}$/i.test(lineUserId)) {
    redirect("/admin?updated=line_users_invalid");
  }

  await upsertLineUser({
    lineUserId,
    displayName: String(formData.get("display_name") || "").trim(),
    status: "seen",
  });

  if (action === "remove") {
    await removeExtraAdminLineUserId(lineUserId, admin.user.displayName);
    redirect("/admin?updated=line_users_removed");
  }

  await addExtraAdminLineUserId(lineUserId, admin.user.displayName);
  redirect("/admin?updated=line_users_added");
}
