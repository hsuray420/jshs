export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { amount?: unknown; name?: unknown; note?: unknown } | null;
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount < 100 || amount > 100_000) return Response.json({ error: "invalid_amount" }, { status: 400 });
  // Credentials are intentionally server-only. ECPay signing and order storage are enabled only when these are configured.
  if (!process.env.ECPAY_MERCHANT_ID || !process.env.ECPAY_HASH_KEY || !process.env.ECPAY_HASH_IV) return Response.json({ error: "payment_not_configured" }, { status: 503 });
  return Response.json({ error: "payment_not_configured" }, { status: 503 });
}
