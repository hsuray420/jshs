import { verifyEcpayCheckMacValue, type EcpayPaymentParams } from "../../../../lib/ecpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const params = Object.fromEntries(form.entries()) as EcpayPaymentParams;
  const hashKey = String(process.env.ECPAY_HASH_KEY || "");
  const hashIv = String(process.env.ECPAY_HASH_IV || "");
  if (!hashKey || !hashIv || !(await verifyEcpayCheckMacValue(params, hashKey, hashIv))) {
    return new Response("0|FAIL", { status: 400 });
  }
  if (String(params.RtnCode) !== "1") return new Response("1|OK");
  return new Response("1|OK");
}
