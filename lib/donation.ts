export const MIN_DONATION_AMOUNT = 10;
export const MAX_DONATION_AMOUNT = 100_000;

export function parseDonationAmount(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isSafeInteger(amount)) return null;
  if (amount < MIN_DONATION_AMOUNT || amount > MAX_DONATION_AMOUNT) return null;
  return amount;
}

export function isValidDonationUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "ecpay.com.tw" || url.hostname.endsWith(".ecpay.com.tw"));
  } catch {
    return false;
  }
}

export function buildDonationUrl(template: string, amount: number) {
  if (!isValidDonationUrl(template)) return null;
  const encodedAmount = encodeURIComponent(String(amount));
  if (template.includes("{amount}")) return template.replaceAll("{amount}", encodedAmount);
  const url = new URL(template);
  url.searchParams.set("amount", String(amount));
  return url.toString();
}
