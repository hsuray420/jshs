import { env } from "cloudflare:workers";
import type { ContentEntry } from "../db/content-store";

type RuntimeEnv = typeof env & { GITHUB_TOKEN?: string; GITHUB_REPOSITORY?: string; GITHUB_BRANCH?: string };
type SyncResult = Readonly<{ configured: boolean; synced: boolean; reason?: string; commitUrl?: string }>;

const runtimeEnv = env as RuntimeEnv;
const apiBase = "https://api.github.com";
const filePath = "content/managed-content.json";

export async function syncContentToGitHub(entry: ContentEntry): Promise<SyncResult> {
  const token = runtimeEnv.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return { configured: false, synced: false, reason: "github_token_missing" };
  const repository = runtimeEnv.GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY || "hsuray420/jshs";
  const branch = runtimeEnv.GITHUB_BRANCH || process.env.GITHUB_BRANCH || "main";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^[\w./-]+$/.test(branch)) return { configured: true, synced: false, reason: "github_config_invalid" };
  const url = `${apiBase}/repos/${repository}/contents/${filePath}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "jshs-content-studio" };
  const existing = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers }).catch(() => null);
  if (existing && !existing.ok && existing.status !== 404) return { configured: true, synced: false, reason: "github_read_failed" };
  const existingPayload = existing?.ok ? await existing.json().catch(() => null) as { content?: string; sha?: string } | null : null;
  const manifest = decodeManifest(existingPayload?.content);
  manifest.entries[`${entry.content_type}:${entry.slug}`] = publicEntry(entry);
  const encoded = encodeUtf8(JSON.stringify({ ...manifest, updatedAt: new Date().toISOString() }, null, 2) + "\n");
  const response = await fetch(url, { method: "PUT", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ message: `content: sync ${entry.content_type}/${entry.slug}`, content: encoded, branch, ...(existingPayload?.sha ? { sha: existingPayload.sha } : {}) }) }).catch(() => null);
  if (!response?.ok) return { configured: true, synced: false, reason: "github_write_failed" };
  const payload = await response.json().catch(() => null) as { commit?: { html_url?: string } } | null;
  return { configured: true, synced: true, commitUrl: payload?.commit?.html_url };
}

function decodeManifest(content?: string) {
  if (!content) return { version: 1, updatedAt: null as string | null, entries: {} as Record<string, ReturnType<typeof publicEntry>> };
  try {
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g, "")), (character) => character.charCodeAt(0)));
    const parsed = JSON.parse(decoded) as { entries?: Record<string, ReturnType<typeof publicEntry>>; version?: number; updatedAt?: string | null };
    return { version: parsed.version || 1, updatedAt: parsed.updatedAt || null, entries: parsed.entries || {} };
  } catch { return { version: 1, updatedAt: null as string | null, entries: {} as Record<string, ReturnType<typeof publicEntry>> }; }
}

function publicEntry(entry: ContentEntry) { return { id: entry.id, content_type: entry.content_type, slug: entry.slug, title: entry.title, summary: entry.summary, body_json: entry.body_json, status: entry.status, published_at: entry.published_at, updated_at: entry.updated_at }; }
function encodeUtf8(value: string) { const bytes = new TextEncoder().encode(value); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); }
