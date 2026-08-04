import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "jshs_admin_session";
const SESSION_HOURS = 8;

export type AdminSession = {
  email: string;
};

export async function requireAdmin() {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");

  return { user, allowed: true, signOutPath: "/api/admin/logout" };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session) return null;

  const [expiresText, signature] = session.split(".");
  const expires = Number(expiresText);
  if (!expires || !signature || expires < Date.now()) return null;

  const expected = await signSession(expiresText);
  if (!constantTimeEqual(signature, expected)) return null;

  return { email: process.env.ADMIN_EMAILS || "site-admin" };
}

export async function createAdminSessionCookie() {
  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const signature = await signSession(expires);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, `${expires}.${signature}`, {
    httpOnly: true,
    maxAge: SESSION_HOURS * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export function hasAdminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && getSessionSecret());
}

export function verifyAdminPassword(password: string) {
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

async function signSession(payload: string) {
  const secret = getSessionSecret();
  if (!secret) return "";

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}
