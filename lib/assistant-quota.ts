import { env } from "cloudflare:workers";
import { ANONYMOUS_QUESTION_LIMIT, getQuestionAllowance } from "./assistant-policy";

export const ASSISTANT_GUEST_COOKIE = "jshs_ai_guest";

type GuestUsage = ReturnType<typeof getQuestionAllowance> & { used: number; cookieValue: string };

export async function consumeGuestQuestion(cookieValue?: string): Promise<GuestUsage> {
  const secret = getQuotaSigningSecret();
  const count = await readSignedCount(cookieValue, secret);
  const used = Math.min(count + 1, ANONYMOUS_QUESTION_LIMIT);
  const allowance = getQuestionAllowance(false, used);
  return Object.freeze({ ...allowance, used, cookieValue: await signCount(used, secret) });
}

function getQuotaSigningSecret() {
  const runtime = env as unknown as Record<string, unknown>;
  const secret = typeof runtime.ADMIN_SESSION_SECRET === "string"
    ? runtime.ADMIN_SESSION_SECRET
    : typeof runtime.LINE_LOGIN_CHANNEL_SECRET === "string"
      ? runtime.LINE_LOGIN_CHANNEL_SECRET
      : "";
  if (!secret) throw new Error("assistant_guest_quota_signing_secret_unavailable");
  return secret;
}

async function readSignedCount(value: string | undefined, secret: string) {
  if (!value) return 0;
  const match = /^(0|[1-9]\d{0,3})\.([a-f0-9]{64})$/.exec(value);
  if (!match) return 0;
  const count = Number(match[1]);
  if (count > ANONYMOUS_QUESTION_LIMIT) return 0;
  const key = await importSigningKey(secret);
  const signature = Uint8Array.from(match[2].match(/.{2}/g)!, (byte) => Number.parseInt(byte, 16));
  const valid = await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(match[1]));
  return valid ? count : 0;
}

async function signCount(count: number, secret: string) {
  const value = String(count);
  const signature = await crypto.subtle.sign("HMAC", await importSigningKey(secret), new TextEncoder().encode(value));
  const hex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${value}.${hex}`;
}

function importSigningKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
