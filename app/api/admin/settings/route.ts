import { redirect } from "next/navigation";
import { upsertSiteSetting } from "../../../../db/admin-store";
import { isValidDonationUrl as isValidEcpayUrl } from "../../../../lib/donation";
import { requireAdmin } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const donationUrl = String(formData.get("donation_url") || "").trim();
  if (donationUrl && !isValidEcpayUrl(donationUrl)) {
    redirect("/admin?updated=settings_invalid");
  }
  await upsertSiteSetting(
    "site_notice",
    String(formData.get("site_notice") || "").slice(0, 1000),
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "official_line_url",
    String(formData.get("official_line_url") || "").trim().slice(0, 1000),
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "contact_email",
    String(formData.get("contact_email") || "").slice(0, 200),
    admin.user.displayName,
  );
  await upsertSiteSetting(
    "donation_url",
    donationUrl,
    admin.user.displayName,
  );

  redirect("/admin?updated=settings");
}
