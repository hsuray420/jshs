import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOMAINS, LEGACY_NAME, ROOT, ensurePrivateDir, migrationDir, newRunId, run, sha256, writeJson } from "./common.mjs";

const dir = await ensurePrivateDir();
let checkpointExists = false;
try {
  await access(path.join(dir, "metadata.json"));
  checkpointExists = true;
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") throw error;
}
if (checkpointExists) {
  throw new Error("An active migration checkpoint already exists; refusing to overwrite production backup, database IDs, or validation results");
}
const configPath = path.join(ROOT, "wrangler.jsonc");
const configText = await readFile(configPath, "utf8");
let config;
try { config = JSON.parse(configText); } catch { throw new Error("wrangler.jsonc is not valid JSON; refusing to edit it automatically"); }
const oldDatabase = config.d1_databases?.find((entry) => entry.binding === "DB" && entry.database_name === LEGACY_NAME);
if (!oldDatabase?.database_id) throw new Error("Expected the configured legacy DB binding for jshs-db; refusing to continue");

const git = run("git", ["status", "--porcelain=v1", "--untracked-files=all"]);
const branch = run("git", ["branch", "--show-current"]).stdout.trim();
const head = run("git", ["rev-parse", "HEAD"]).stdout.trim();
if (branch !== "main") throw new Error(`Expected branch main, found ${branch || "(detached)"}`);

for (const spec of Object.values(DOMAINS)) {
  const dirPath = path.join(ROOT, "db", "migrations", spec.migrationDir);
  await access(dirPath);
}
for (const script of ["prepare.mjs", "inventory.mjs", "migrate.mjs", "verify.mjs", "cutover.mjs", "report.mjs"]) {
  await access(path.join(ROOT, "scripts", "storage-migration", script));
}

const runId = newRunId();
const tag = `pre-storage-split-${runId}`;
const existingTags = run("git", ["tag", "--list", tag]).stdout.trim();
if (existingTags) throw new Error(`Safety tag already exists: ${tag}`);
run("git", ["tag", tag, head]);

const backupConfig = path.join(dir, "wrangler.pre-cutover.jsonc");
await writeFile(backupConfig, configText, { mode: 0o600 });
const metadata = {
  runId,
  startedAt: new Date().toISOString(),
  branch,
  head,
  worktreeDirty: Boolean(git.stdout.trim()),
  worktreeStatusLines: git.stdout.trim() ? git.stdout.trim().split(/\r?\n/).length : 0,
  safetyTag: tag,
  configSha256: sha256(configText),
  configBackup: backupConfig,
  legacyDatabase: { name: LEGACY_NAME, id: oldDatabase.database_id, binding: "DB" },
  domains: Object.fromEntries(Object.entries(DOMAINS).map(([key, value]) => [key, value])),
  migrationDirectory: migrationDir(),
};
await writeJson(path.join(dir, "metadata.json"), metadata);

console.log(`Prepared migration run ${metadata.runId}.`);
console.log(`Branch ${branch} at ${head}; worktree ${metadata.worktreeDirty ? "has existing changes (recorded, not modified)" : "clean"}.`);
console.log(`Safety tag: ${tag}.`);
console.log("No Cloudflare API call or production data access was performed.");
