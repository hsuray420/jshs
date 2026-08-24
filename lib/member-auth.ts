import { cookies } from "next/headers";

const MEMBER_COOKIE = "jshs_member_session";
const SESSION_DAYS = 30;

export type MemberSession = Readonly<{
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
}>;

export async function getMemberSession(): Promise<MemberSession | null> {
  const value = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !constantTimeEqual(signature, await signSession(payload))) return null;
  const data = parsePayload(payload);
  if (!data || data.expires < Date.now()) return null;
  return { lineUserId: data.lineUserId, displayName: data.displayName || "LINE 使用者", pictureUrl: data.pictureUrl };
}

export async function createMemberSessionCookie(member: MemberSession) {
  const payload = toBase64Url(JSON.stringify({ ...member, expires: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 }));
  const signature = await signSession(payload);
  (await cookies()).set(MEMBER_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export async function clearMemberSessionCookie() {
  (await cookies()).set(MEMBER_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: true });
}

async function signSession(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.LINE_LOGIN_CHANNEL_SECRET || "";
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parsePayload(payload: string) {
  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    return parsed && typeof parsed.lineUserId === "string" && Number.isFinite(parsed.expires) ? parsed as MemberSession & { expires: number } : null;
  } catch { return null; }
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

function toBase64Url(value: string) { return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function fromBase64Url(value: string) { const normalized = value.replace(/-/g, "+").replace(/_/g, "/"); return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")); }
