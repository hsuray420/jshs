import { env } from "cloudflare:workers";

type RuntimeEnvironment = Record<string, unknown>;

export type SupabaseServerConfig = Readonly<{ url: string; serviceRoleKey: string }>;

export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const runtime = env as unknown as RuntimeEnvironment;
  const url = typeof runtime.SUPABASE_URL === "string" ? runtime.SUPABASE_URL.replace(/\/$/, "") : "";
  const serviceRoleKey = typeof runtime.SUPABASE_SERVICE_ROLE_KEY === "string" ? runtime.SUPABASE_SERVICE_ROLE_KEY : "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

/** Server-only REST adapter. Never import this module from a Client Component. */
export async function supabaseServerRequest(path: string, init: RequestInit = {}) {
  const config = getSupabaseServerConfig();
  if (!config) throw new Error("supabase_not_configured");
  if (!path.startsWith("/rest/v1/")) throw new Error("invalid_supabase_path");
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`supabase_request_failed:${response.status}`);
  return response;
}
