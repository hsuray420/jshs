import { redirect } from "next/navigation";
import { deleteAdminFile } from "../../../../../db/admin-store";
import { requireAdmin } from "../../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  await deleteAdminFile(id);
  redirect("/admin/media");
}
