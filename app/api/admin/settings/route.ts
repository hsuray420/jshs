import { redirect } from "next/navigation";
import { upsertSiteSetting } from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  await upsertSiteSetting(
    "site_notice",
    String(formData.get("site_notice") || "").slice(0, 1000),
    admin.user.email,
  );
  await upsertSiteSetting(
    "contact_email",
    String(formData.get("contact_email") || "").slice(0, 200),
    admin.user.email,
  );

  redirect("/admin");
}
