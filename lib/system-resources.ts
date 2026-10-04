import { env } from "cloudflare:workers";
import { DATABASE_NAMES } from "../db/bindings";

export type ResourceStatus = "ready" | "attention" | "unconfigured";
export type D1Health = Readonly<{ configured: boolean; connected: boolean; sizeBytes: number | null }>;
type RuntimeDatabases = typeof env & { CORE_DB?: D1Database; LEARNING_DB?: D1Database; COMMUNITY_DB?: D1Database; DB?: D1Database };

function safeExternalUrl(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch { return ""; }
}

export const ADMIN_EXTERNAL_LINKS = Object.freeze({
  hosting: safeExternalUrl(process.env.ADMIN_HOSTING_DASHBOARD_URL),
  imagekit: safeExternalUrl(process.env.IMAGEKIT_DASHBOARD_URL),
  github: safeExternalUrl(process.env.GITHUB_REPOSITORY_URL),
  lineDevelopers: safeExternalUrl(process.env.LINE_DEVELOPERS_DASHBOARD_URL),
  lineOfficialAccount: safeExternalUrl(process.env.LINE_OA_DASHBOARD_URL),
});

export async function checkD1Binding(binding: "CORE_DB" | "LEARNING_DB" | "COMMUNITY_DB"): Promise<D1Health> {
  const databases = env as RuntimeDatabases;
  const db = databases[binding];
  if (!db) return { configured: false, connected: false, sizeBytes: null };
  try {
    const result = await db.prepare("SELECT 1 AS connected").first<{ connected: number }>();
    if (result?.connected !== 1) return { configured: true, connected: false, sizeBytes: null };
    let sizeBytes: number | null = null;
    try {
      const pages = await db.prepare("PRAGMA page_count").first<{ page_count: number }>();
      const pageSize = await db.prepare("PRAGMA page_size").first<{ page_size: number }>();
      if (Number.isFinite(pages?.page_count) && Number.isFinite(pageSize?.page_size)) {
        sizeBytes = Number(pages?.page_count) * Number(pageSize?.page_size);
      }
    } catch {
      sizeBytes = null;
    }
    return { configured: true, connected: true, sizeBytes };
  } catch {
    return { configured: true, connected: false, sizeBytes: null };
  }
}

export const D1_DATABASES = Object.freeze([
  { binding: "CORE_DB", name: DATABASE_NAMES.core, purpose: "會員帳號、LINE 身份、好友狀態、帳號設定與收藏。" },
  { binding: "LEARNING_DB", name: DATABASE_NAMES.learning, purpose: "會員模考、成績、弱點、志願規劃與 AI 歷史。" },
  { binding: "COMMUNITY_DB", name: DATABASE_NAMES.community, purpose: "匿名投稿、資料回報、投票、審核及 publishing/audit log。" },
] as const);
