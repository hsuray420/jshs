import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LEGACY_NAME = "jshs-db";
export const LEGACY_BINDING = "DB";
export const DOMAINS = Object.freeze({
  core: { database: "jshs-core", binding: "CORE_DB", migrationDir: "core" },
  learning: { database: "jshs-learning", binding: "LEARNING_DB", migrationDir: "learning" },
  community: { database: "jshs-community", binding: "COMMUNITY_DB", migrationDir: "community" },
});
export const MIGRATION_KEY = "STORAGE_MIGRATION_IMAGEKIT_SMOKE";

export function migrationDir() {
  const value = process.env.JSHS_MIGRATION_DIR;
  if (!value) throw new Error("JSHS_MIGRATION_DIR is missing; run scripts/storage-migration/run.sh");
  const resolved = path.resolve(value);
  if (resolved === ROOT || resolved.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error("Migration backup directory must be outside the repository");
  }
  return resolved;
}

export async function ensurePrivateDir(dir = migrationDir()) {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await chmod(dir, 0o700);
  return dir;
}

export function safeEnv() {
  return {
    ...process.env,
    WRANGLER_WRITE_LOGS: "false",
    WRANGLER_LOG_PATH: "/dev/null",
    MINIFLARE_REGISTRY_PATH: path.join(os.tmpdir(), "jshs-storage-migration-registry"),
    NODE_NO_WARNINGS: "1",
  };
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    env: options.env ?? safeEnv(),
    encoding: options.encoding ?? "utf8",
    maxBuffer: options.maxBuffer ?? 256 * 1024 * 1024,
    timeout: options.timeout ?? 20 * 60 * 1000,
    input: options.input,
  });
  if (result.error) throw new Error(`${options.label ?? command} failed to start`);
  if (result.status !== 0) {
    const detail = options.showOutput ? sanitizeOutput(result.stderr || result.stdout || "") : "";
    throw new Error(`${options.label ?? command} failed (exit ${result.status ?? "unknown"})${detail ? `: ${detail}` : ""}`);
  }
  return { stdout: String(result.stdout ?? ""), stderr: String(result.stderr ?? "") };
}

export function wrangler(args, options = {}) {
  const bin = process.env.WRANGLER_BIN || path.join(ROOT, "node_modules", ".bin", "wrangler");
  return run(bin, args, { ...options, label: options.label ?? `wrangler ${args.slice(0, 3).join(" ")}` });
}

export function sanitizeOutput(value) {
  return String(value)
    .replace(/(?:Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/\b(?:sk|ghp|gho|github_pat)_[A-Za-z0-9_]{12,}\b/g, "[redacted]")
    .replace(/(IMAGEKIT_PRIVATE_KEY|LINE_LOGIN_CHANNEL_SECRET|LINE_CHANNEL_SECRET|GITHUB_TOKEN|CLOUDFLARE_API_TOKEN)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .split(/\r?\n/).map((line) => line.slice(0, 240)).filter(Boolean).slice(-4).join(" | ");
}

export function parseJsonOutput(output) {
  const source = output.trim();
  try { return JSON.parse(source); } catch { /* Wrangler may print a notice before JSON. */ }
  for (let index = source.lastIndexOf("{"); index >= 0; index = source.lastIndexOf("{", index - 1)) {
    try { return JSON.parse(source.slice(index)); } catch { /* try the next object start */ }
  }
  throw new Error("Wrangler returned an unreadable JSON response");
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await chmod(file, 0o600);
}

export function quoteSql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "1" : "0";
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) return `X'${Buffer.from(value).toString("hex")}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function sqlIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("Unexpected SQL identifier");
  return `"${value}"`;
}

export function userDataErrorCount(report) {
  return Object.entries(report).filter(([key, value]) => key.endsWith("Count") && typeof value === "number" && value > 0);
}

export function newRunId() {
  return `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12)}-${randomUUID().slice(0, 8)}`;
}
