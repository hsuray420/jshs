export type EcpayPaymentParams = Record<string, string | number>;

type PaymentInput = {
  amount: number;
  merchantId: string;
  returnUrl: string;
  clientBackUrl: string;
  tradeNo: string;
  now: Date;
};

export function buildEcpayPaymentParams(input: PaymentInput): EcpayPaymentParams {
  return {
    MerchantID: input.merchantId,
    MerchantTradeNo: input.tradeNo,
    MerchantTradeDate: formatEcpayDate(input.now),
    PaymentType: "aio",
    TotalAmount: input.amount,
    TradeDesc: "支持 JSHS",
    ItemName: "JSHS 支持款",
    ReturnURL: input.returnUrl,
    ChoosePayment: "ALL",
    ClientBackURL: input.clientBackUrl,
    EncryptType: 1,
  };
}

export async function buildEcpayCheckMacValue(
  params: EcpayPaymentParams,
  hashKey: string,
  hashIv: string,
) {
  if (!hashKey || !hashIv) throw new Error("ECPay hash secrets are not configured.");
  const values = Object.entries(params)
    .filter(([key]) => key !== "CheckMacValue")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const raw = `HashKey=${hashKey}&${values}&HashIV=${hashIv}`;
  const encoded = encodeEcpay(raw).toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encoded));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function renderEcpayAutoSubmitForm(action: string, params: EcpayPaymentParams) {
  const inputs = Object.entries(params)
    .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}">`)
    .join("");
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>前往綠界付款</title></head><body><p>正在前往綠界付款頁面…</p><form id="ecpay" method="post" action="${escapeHtml(action)}">${inputs}</form><script>document.getElementById("ecpay").submit();</script></body></html>`;
}

export async function verifyEcpayCheckMacValue(params: EcpayPaymentParams, hashKey: string, hashIv: string) {
  const received = String(params.CheckMacValue || "").toUpperCase();
  const expected = await buildEcpayCheckMacValue(params, hashKey, hashIv);
  return received.length === expected.length && received.split("").every((char, index) => char === expected[index]);
}

function formatEcpayDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

function encodeEcpay(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}
