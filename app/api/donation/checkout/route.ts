import { parseDonationAmount } from "../../../../lib/donation";
import { buildEcpayCheckMacValue, buildEcpayPaymentParams, renderEcpayAutoSubmitForm } from "../../../../lib/ecpay";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const amount = parseDonationAmount(new URL(request.url).searchParams.get("amount"));
  if (amount === null) return Response.json({ ok: false, error: "donation_amount_invalid" }, { status: 400 });
  const merchantId = String(process.env.ECPAY_MERCHANT_ID || "").trim();
  const hashKey = String(process.env.ECPAY_HASH_KEY || "");
  const hashIv = String(process.env.ECPAY_HASH_IV || "");
  if (!merchantId || !hashKey || !hashIv) return Response.json({ ok: false, error: "ecpay_not_configured" }, { status: 503 });
  const origin = new URL(request.url).origin;
  const params = buildEcpayPaymentParams({ amount, merchantId, returnUrl: `${origin}/api/donation/notify`, clientBackUrl: `${origin}/support`, tradeNo: `JSHS${Date.now().toString(36).toUpperCase()}`.slice(0, 20), now: new Date() });
  params.CheckMacValue = await buildEcpayCheckMacValue(params, hashKey, hashIv);
  const action = process.env.ECPAY_ENV === "stage" ? "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5" : "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5";
  return new Response(renderEcpayAutoSubmitForm(action, params), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
