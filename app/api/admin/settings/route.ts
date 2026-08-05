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
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "pathway_form_url",
    String(formData.get("pathway_form_url") || "").trim().slice(0, 1000),
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "google_ads_enabled",
    formData.get("google_ads_enabled") === "on" ? "1" : "0",
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "google_ads_client",
    String(formData.get("google_ads_client") || "").trim().slice(0, 200),
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "google_ads_slot",
    String(formData.get("google_ads_slot") || "").trim().slice(0, 100),
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "contact_email",
    String(formData.get("contact_email") || "").slice(0, 200),
    admin.user.displayName,
  );

  redirect("/admin");
}
