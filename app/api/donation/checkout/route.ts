import { listPublicSiteSettings } from "../../../../db/admin-store";
import { buildDonationUrl, parseDonationAmount } from "../../../../lib/donation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const amount = parseDonationAmount(new URL(request.url).searchParams.get("amount"));
  if (amount === null) return Response.json({ ok: false, error: "donation_amount_invalid" }, { status: 400 });
  const settings = await listPublicSiteSettings();
  const configuredUrl = settings.find((item) => item.key === "donation_url")?.value;
  const template = String(configuredUrl || process.env.DONATION_URL || "").trim();
  const donationUrl = buildDonationUrl(template, amount);
  if (!donationUrl) return Response.json({ ok: false, error: "donation_url_unavailable" }, { status: 503 });
  return Response.redirect(donationUrl, 303);
}
