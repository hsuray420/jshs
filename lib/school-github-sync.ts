import { env } from "cloudflare:workers";
import { assertAvailableSchoolRegion, regionalCsvPath } from "./school-data/regional-loader.mjs";
import { parseCsv } from "./school-data/pipeline.mjs";
import { updateCanonicalSchoolCsv, validateSchoolAdminUpdates } from "./school-admin-csv.mjs";
import { buildSchoolCommitMessage, createSchoolFieldDiff, detectSchoolFieldConflicts, summarizeGitHubWorkflowRun } from "./school-admin-workflow.mjs";

type RuntimeEnv = typeof env & { GITHUB_TOKEN?: string; GITHUB_REPOSITORY?: string; GITHUB_BRANCH?: string; ADMIN_GITHUB_SYNC_MODE?: string };
type GithubFile = { content?: string; sha?: string; html_url?: string };
type SchoolSyncInput = {
  regionCode: string;
  schoolCode: string;
  schoolName: string;
  updates: Record<string, string>;
  baseValues: Record<string, string>;
  expectedSha: string;
};

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
  if (!region.csvPath) throw new Error("school_data_source_missing");
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
  if (file.configured && "content" in file && file.content && file.sha && file.github) {
    return { configured: true as const, content: file.content, sha: file.sha, htmlUrl: file.htmlUrl, filePath, repository: file.github.repository, branch: file.github.branch };
  }
  return { configured: file.configured, reason: file.reason, filePath };
}

export async function getLatestCanonicalSchoolCommit(regionCode: string): Promise<{
  configured: boolean;
  connected: boolean;
  contentsRead: boolean;
  commit: { sha: string; url: string; message: string; date: string } | null;
}> {
  const github = config();
  if (!github) return { configured: false, connected: false, contentsRead: false, commit: null };
  const filePath = filePathForRegion(regionCode);
  const file = await readFile(filePath);
  const url = `${API}/repos/${github.repository}/commits?path=${encodeURIComponent(filePath)}&sha=${encodeURIComponent(github.branch)}&per_page=1`;
  const response = await fetch(url, { headers: headers(github.token) }).catch(() => null);
  if (!response?.ok) return { configured: true, connected: false, contentsRead: file.configured && "content" in file, commit: null };
  const commits = await response.json().catch(() => null) as Array<{ sha?: unknown; html_url?: unknown; commit?: { message?: unknown; author?: { date?: unknown } } }> | null;
  const commit = Array.isArray(commits) ? commits[0] : null;
  if (!commit || typeof commit.sha !== "string") return { configured: true, connected: false, contentsRead: file.configured && "content" in file, commit: null };
  return {
    configured: true,
    connected: file.configured && "content" in file,
    contentsRead: file.configured && "content" in file,
    commit: {
      sha: commit.sha,
      url: typeof commit.html_url === "string" ? commit.html_url : "",
      message: typeof commit.commit?.message === "string" ? commit.commit.message.split("\n")[0] : "",
      date: typeof commit.commit?.author?.date === "string" ? commit.commit.author.date : "",
    },
  };
}

export async function getGitHubDeploymentStatus(commitSha: string) {
  const github = config();
  if (!github) return { status: "unavailable" as const, reason: "github_token_missing" };
  const response = await fetch(`${API}/repos/${github.repository}/actions/runs?head_sha=${encodeURIComponent(commitSha)}&per_page=10`, {
    headers: headers(github.token),
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return { status: "unavailable" as const, reason: "workflow_status_unavailable" };
  const payload = await response.json().catch(() => null) as {
    workflow_runs?: Array<{ head_sha?: unknown; status?: unknown; conclusion?: unknown; html_url?: unknown; name?: unknown }>;
  } | null;
  if (!Array.isArray(payload?.workflow_runs)) return { status: "unavailable" as const, reason: "workflow_response_invalid" };
  return summarizeGitHubWorkflowRun(payload.workflow_runs, commitSha);
}

function prepareChange(input: SchoolSyncInput, content: string, sha: string) {
  const updates = validateSchoolAdminUpdates(input.updates) as Record<string, string>;
  const latest = (parseCsv(content).rows as Record<string, string>[]).find((row) => row["學校代碼"] === input.schoolCode);
  if (!latest) throw new Error(`school not found: ${input.schoolCode}`);
  const conflicts = detectSchoolFieldConflicts({ base: input.baseValues, latest, updates });
  if (conflicts.length) return { ok: false as const, conflicts, sha };
  const changed = updateCanonicalSchoolCsv({ csvText: content, schoolCode: input.schoolCode, updates, expectedLabel: input.regionCode });
  const diff = createSchoolFieldDiff({ base: latest, draft: { ...latest, ...updates } });
  return { ok: true as const, changed, diff, sha };
}

export async function previewCanonicalSchoolRow(input: SchoolSyncInput) {
  const filePath = filePathForRegion(input.regionCode);
  const file = await readFile(filePath);
  if (!file.configured || !("content" in file) || !file.content || !file.sha || !file.github) return { ...file, filePath };
  const prepared = prepareChange(input, file.content, file.sha);
  if (!prepared.ok) return { configured: true as const, previewed: false as const, reason: "field_conflict" as const, conflicts: prepared.conflicts, sha: file.sha, filePath };
  return { configured: true as const, previewed: true as const, sha: file.sha, filePath, diff: prepared.diff, changedFields: prepared.changed.changedFields, rowCount: prepared.changed.rowCount };
}

export async function syncCanonicalSchoolRow(input: SchoolSyncInput) {
  const filePath = filePathForRegion(input.regionCode);
  const file = await readFile(filePath);
  if (!file.configured || !("content" in file) || !file.content || !file.sha || !file.github) return file;
  const prepared = prepareChange(input, file.content, file.sha);
  if (!prepared.ok) return { configured: true as const, synced: false as const, reason: "field_conflict" as const, conflicts: prepared.conflicts, sha: file.sha };
  const changed = prepared.changed;
  if (!changed.changedFields.length) return { configured: true as const, synced: false as const, reason: "unchanged" as const, sha: file.sha, changedFields: [] as string[] };
  const url = `${API}/repos/${file.github.repository}/contents/${filePath}`;
  const response = await fetch(url, { method: "PUT", headers: { ...headers(file.github.token), "content-type": "application/json" }, body: JSON.stringify({ message: buildSchoolCommitMessage({ schoolCode: input.schoolCode, schoolName: input.schoolName, fields: changed.changedFields }), content: encode(changed.csvText), branch: file.github.branch, sha: file.sha }) }).catch(() => null);
  if (!response?.ok) return { configured: true as const, synced: false as const, reason: response?.status === 409 ? "sha_conflict" as const : "github_write_failed" as const };
  const payload = await response.json().catch(() => null) as { commit?: { sha?: string; html_url?: string } } | null;
  if (!payload?.commit?.sha || !/^[a-f0-9]{40}$/i.test(payload.commit.sha)) {
    return { configured: true as const, synced: false as const, reason: "github_write_response_invalid" as const };
  }
  return { configured: true as const, synced: true as const, changedFields: changed.changedFields, commitSha: payload.commit.sha, commitUrl: payload.commit.html_url, syncedAt: new Date().toISOString(), filePath };
}

export function localCanonicalCsvPath(regionCode: string) { return regionalCsvPath(regionCode); }
