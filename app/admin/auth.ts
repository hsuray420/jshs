import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "jshs_admin_session";
const SESSION_HOURS = 8;

export type AdminSession = {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  role: AdminRole;
};

export type AdminRole = "owner" | "administrator" | "reviewer" | "editor";
const ROLE_WEIGHT: Record<AdminRole, number> = { editor: 1, reviewer: 2, administrator: 3, owner: 4 };

export async function requireAdmin() {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");

  return { user, allowed: true, signOutPath: "/api/admin/logout" };
}

export async function requireAdminRole(minimumRole: AdminRole) {
  const admin = await requireAdmin();
  if (ROLE_WEIGHT[admin.user.role] < ROLE_WEIGHT[minimumRole]) throw new AdminAuthorizationError();
  return admin;
}

export class AdminAuthorizationError extends Error {
  constructor() { super("admin_role_forbidden"); }
}

export function resolveAdminRole(lineUserId: string): AdminRole {
  const roleLists: Array<[AdminRole, string | undefined]> = [
    ["owner", process.env.ADMIN_OWNER_LINE_USER_IDS],
    ["administrator", process.env.ADMINISTRATOR_LINE_USER_IDS],
    ["reviewer", process.env.ADMIN_REVIEWER_LINE_USER_IDS],
    ["editor", process.env.ADMIN_EDITOR_LINE_USER_IDS],
  ];
  for (const [role, ids] of roleLists) {
    if (String(ids || "").split(",").map((id) => id.trim()).includes(lineUserId)) return role;
  }
  return "administrator";
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session) return null;

  const [payload, signature] = session.split(".");
  if (!payload || !signature) return null;

  const expected = await signSession(payload);
  if (!constantTimeEqual(signature, expected)) return null;

  const data = parseSessionPayload(payload);
  if (!data) return null;

  const expires = Number(data.expires);
  if (!expires || !signature || expires < Date.now()) return null;

  return {
    lineUserId: data.lineUserId,
    displayName: data.displayName || "LINE 管理員",
    pictureUrl: data.pictureUrl,
    role: isAdminRole(data.role) ? data.role : "administrator",
  };
}

export async function createAdminSessionCookie(admin: Omit<AdminSession, "email">) {
  const payload = toBase64Url(
    JSON.stringify({
      ...admin,
      expires: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
    }),
  );
  const signature = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, `${payload}.${signature}`, {
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
  return process.env.ADMIN_SESSION_SECRET || process.env.LINE_LOGIN_CHANNEL_SECRET || "";
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function parseSessionPayload(payload: string) {
  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    if (!parsed || typeof parsed.lineUserId !== "string") return null;
    return parsed as AdminSession & { expires: number };
  } catch {
    return null;
  }
}

function isAdminRole(value: unknown): value is AdminRole {
  return value === "owner" || value === "administrator" || value === "reviewer" || value === "editor";
}
