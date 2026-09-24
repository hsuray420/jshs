import { env } from "cloudflare:workers";
import { assertAvailableSchoolRegion, regionalCsvPath } from "./school-data/regional-loader.mjs";
import { updateCanonicalSchoolCsv } from "./school-admin-csv.mjs";

type RuntimeEnv = typeof env & { GITHUB_TOKEN?: string; GITHUB_REPOSITORY?: string; GITHUB_BRANCH?: string; ADMIN_GITHUB_SYNC_MODE?: string };
type GithubFile = { content?: string; sha?: string; html_url?: string };
type SchoolSyncInput = { regionCode: string; schoolCode: string; updates: Record<string, string>; expectedSha: string };

const runtimeEnv = env as RuntimeEnv;
const API = "https://api.github.com";

function config() {
  const token = runtimeEnv.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const repository = runtimeEnv.GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY || "hsuray420/jshs";
  const branch = runtimeEnv.GITHUB_BRANCH || process.env.GITHUB_BRANCH || "main";
  const mode = runtimeEnv.ADMIN_GITHUB_SYNC_MODE || process.env.ADMIN_GITHUB_SYNC_MODE || "commit";
  if (!token) return null;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^[\w./-]+$/.test(branch) || !["commit", "pr"].includes(mode)) throw new Error("github_config_invalid");
  return { token, repository, branch, mode };
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "jshs-admin-school-sync" };
}

function filePathForRegion(regionCode: string) {
  const region = assertAvailableSchoolRegion(regionCode);
  return region.csvPath.replace(/^content\//, "content/");
}

function decode(content: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g, "")), (character) => character.charCodeAt(0)));
}

function encode(content: string) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function readFile(filePath: string) {
  const github = config();
  if (!github) return { configured: false as const, reason: "github_token_missing" as const };
  const url = `${API}/repos/${github.repository}/contents/${filePath}?ref=${encodeURIComponent(github.branch)}`;
  const response = await fetch(url, { headers: headers(github.token) }).catch(() => null);
  if (!response?.ok) return { configured: true as const, reason: "github_read_failed" as const };
  const payload = await response.json().catch(() => null) as GithubFile | null;
  if (!payload?.content || !payload.sha) return { configured: true as const, reason: "github_file_invalid" as const };
  return { configured: true as const, github, content: decode(payload.content), sha: payload.sha, htmlUrl: payload.html_url };
}

export async function getCanonicalSchoolFileSnapshot(regionCode: string) {
  const filePath = filePathForRegion(regionCode);
  const file = await readFile(filePath);
  return { ...file, filePath };
}

export async function syncCanonicalSchoolRow(input: SchoolSyncInput) {
  const filePath = filePathForRegion(input.regionCode);
  const file = await readFile(filePath);
  if (!file.configured) return file;
  if (file.sha !== input.expectedSha) return { configured: true as const, synced: false as const, reason: "sha_conflict" as const, sha: file.sha };
  const changed = updateCanonicalSchoolCsv({ csvText: file.content, schoolCode: input.schoolCode, updates: input.updates, expectedLabel: input.regionCode });
  if (!changed.changedFields.length) return { configured: true as const, synced: false as const, reason: "unchanged" as const, sha: file.sha, changedFields: [] as string[] };
  const url = `${API}/repos/${file.github.repository}/contents/${filePath}`;
  const response = await fetch(url, { method: "PUT", headers: { ...headers(file.github.token), "content-type": "application/json" }, body: JSON.stringify({ message: `admin(schools): update ${input.schoolCode} ${changed.changedFields.join(", ")}`, content: encode(changed.csvText), branch: file.github.branch, sha: input.expectedSha }) }).catch(() => null);
  if (!response?.ok) return { configured: true as const, synced: false as const, reason: response?.status === 409 ? "sha_conflict" as const : "github_write_failed" as const };
  const payload = await response.json().catch(() => null) as { commit?: { sha?: string; html_url?: string } } | null;
  return { configured: true as const, synced: true as const, changedFields: changed.changedFields, commitSha: payload?.commit?.sha || "unknown", commitUrl: payload?.commit?.html_url, syncedAt: new Date().toISOString(), filePath };
}

export function localCanonicalCsvPath(regionCode: string) { return regionalCsvPath(regionCode); }
