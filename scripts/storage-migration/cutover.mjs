import { chmod, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOMAINS, LEGACY_NAME, MIGRATION_KEY, ROOT, ensurePrivateDir, hasStagedChanges, parseJsonOutput, readJson, run, sha256, writeJson, wrangler } from "./common.mjs";

const dir = await ensurePrivateDir();
const metadataPath = path.join(dir, "metadata.json");
const metadata = await readJson(metadataPath);
const inventory = await readJson(path.join(dir, "inventory.json"));
if (metadata.verification?.status !== "PASS" || metadata.imageKitSmoke?.status !== "PASS") {
  throw new Error("Inventory, row validation, or ImageKit smoke test is not PASS; cutover is forbidden");
}
if (inventory.identityChecks !== "PASS") throw new Error("Legacy identity preflight is not PASS");
if (metadata.branch !== "main") throw new Error("Migration was not prepared from main");
for (const [domain, spec] of Object.entries(DOMAINS)) {
  if (!metadata.databaseIds?.[domain]) throw new Error(`Missing verified database ID for ${spec.database}`);
}

const configPath = path.join(ROOT, "wrangler.jsonc");
const originalConfigText = await readFile(configPath, "utf8");
if (metadata.configSha256 !== sha256(originalConfigText)) throw new Error("wrangler.jsonc changed after migration prepare; refusing cutover");
const config = JSON.parse(originalConfigText);
const legacy = config.d1_databases?.find((entry) => entry.binding === "DB" && entry.database_name === LEGACY_NAME);
if (!legacy || legacy.database_id !== metadata.legacyDatabase.id) throw new Error("Legacy DB binding changed; refusing cutover");
if (config.d1_databases.some((entry) => ["CORE_DB", "LEARNING_DB", "COMMUNITY_DB"].includes(entry.binding))) {
  throw new Error("One or more new bindings already exist in wrangler.jsonc; refusing to overwrite manually managed config");
}

await runGate("pnpm", ["run", "typecheck"], "TypeScript typecheck");
await runGate("pnpm", ["run", "lint"], "Lint");
await runGate("pnpm", ["test"], "Full test suite");
await runGate("git", ["diff", "--check"], "Git whitespace validation");

const branch = run("git", ["branch", "--show-current"]).stdout.trim();
if (branch !== "main") throw new Error(`Expected branch main at cutover, found ${branch || "(detached)"}`);
const status = run("git", ["status", "--porcelain=v1", "--untracked-files=all"]).stdout.trim();
console.log(`Pre-deploy git status: ${status ? `${status.split(/\r?\n/).length} changed path(s)` : "clean"}`);
if (hasStagedChanges(status)) {
  throw new Error("Staged changes already exist; refusing to include unrelated staged files in the production binding commit");
}
run("git", ["remote", "get-url", "github"]);
const remoteHead = run("git", ["ls-remote", "github", "refs/heads/main"], { timeout: 60_000 }).stdout.trim().split(/\s+/)[0];
const localHead = run("git", ["rev-parse", "HEAD"]).stdout.trim();
if (!remoteHead || remoteHead !== localHead) throw new Error("Local main is not exactly synchronized with github/main; refusing to push unrelated or divergent commits");

console.log("\nAll migration checks passed. Deploy production? [y/N]");
const answer = (await readStdinLine()).trim();
if (answer !== "y") {
  metadata.cutover = { status: "DECLINED", at: new Date().toISOString(), productionBindingsChanged: false, deployment: "not run" };
  await writeJson(metadataPath, metadata);
  await updateReportCutover("User declined production deployment; wrangler.jsonc was not modified.");
  console.log("Deployment declined. No production binding was changed and no deployment was run.");
  process.exit(0);
}

const nextConfig = {
  ...config,
  d1_databases: [
    legacy,
    ...Object.entries(DOMAINS).map(([domain, spec]) => ({
      binding: spec.binding,
      database_name: spec.database,
      database_id: metadata.databaseIds[domain],
    })),
  ],
};
const tempConfig = `${configPath}.storage-migration.tmp`;
await writeFile(tempConfig, `${JSON.stringify(nextConfig, null, 2)}\n`, { mode: 0o600 });
await chmod(tempConfig, 0o600);
await rename(tempConfig, configPath);
metadata.cutover = { status: "BINDINGS_UPDATED", at: new Date().toISOString(), productionBindingsChanged: true, deployment: "pending" };
await writeJson(metadataPath, metadata);
await updateReportCutover("CORE_DB, LEARNING_DB, COMMUNITY_DB bindings added; legacy DB binding retained.");

try {
  run("git", ["add", "--", "wrangler.jsonc"]);
  run("git", ["commit", "-m", "Configure split D1 production bindings", "-m", "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"]);
  metadata.cutover.commit = run("git", ["rev-parse", "HEAD"]).stdout.trim();
  await writeJson(metadataPath, metadata);
  run("git", ["push", "github", "main"], { timeout: 10 * 60 * 1000, label: "git push github main" });
  metadata.cutover.pushStatus = "PASS";
  metadata.cutover.deployment = "GitHub push succeeded; waiting for Cloudflare Git integration";
  metadata.cutover.pushedAt = new Date().toISOString();
  await writeJson(metadataPath, metadata);
  await updateReportCutover("Bindings committed and pushed to github/main; Cloudflare Git integration deploys production.");
  const checks = await productionSmokeTests();
  metadata.cutover.smokeTests = checks;
  metadata.cutover.smokeStatus = checks.every((item) => item.status === "PASS") ? "PASS" : "FAIL";
  await writeJson(metadataPath, metadata);
  await updateReportCutover(`Production smoke tests: ${metadata.cutover.smokeStatus}.`);
  if (metadata.cutover.smokeStatus !== "PASS") {
    console.error(`Production smoke test failed after commit ${metadata.cutover.commit}. Do not delete any D1 database. Follow rollback.md and restore the previous binding through the normal GitHub deployment workflow.`);
    process.exitCode = 2;
  } else {
    console.log(`GitHub push succeeded (${metadata.cutover.commit}); Cloudflare Git deployment and split-binding smoke tests PASS. The legacy jshs-db remains available as a rollback source.`);
  }
} catch (error) {
  metadata.cutover.deployment = "failed";
  metadata.cutover.error = error instanceof Error ? error.message.slice(0, 220) : "GitHub push or production smoke failed";
  await writeJson(metadataPath, metadata);
  await updateReportCutover(`GitHub push or deployment smoke failed. Rollback instructions: scripts/storage-migration/rollback.md.`);
  console.error("GitHub push or production smoke failed after the binding commit. No database was deleted. Follow rollback.md and use the normal GitHub deployment workflow.");
  throw error;
}

async function runGate(command, args, label) {
  run(command, args, { timeout: 60 * 60 * 1000, maxBuffer: 256 * 1024 * 1024, label });
  metadata.checks ??= {};
  const key = label === "TypeScript typecheck" ? "typecheck"
    : label === "Full test suite" ? "test"
      : label === "Git whitespace validation" ? "diffCheck" : "lint";
  metadata.checks[key] = "PASS";
  await writeJson(metadataPath, metadata);
  console.log(`${label}: PASS`);
}

function readStdinLine() {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
      if (input.includes("\n")) {
        process.stdin.pause();
        resolve(input.split(/\r?\n/, 1)[0]);
      }
    });
    process.stdin.on("end", () => resolve(input));
  });
}

async function productionSmokeTests() {
  const results = [];
  let homepageStatus = null;
  try {
    const response = await fetch("https://jshs.cc/", { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    homepageStatus = response.status === 200 || (response.status >= 300 && response.status < 400) ? "PASS" : "FAIL";
  } catch {
    homepageStatus = "FAIL";
  }
  results.push({ label: "Production homepage", status: homepageStatus });
  console.log(`Production homepage: ${homepageStatus}`);

  const nonce = crypto.randomUUID();
  const expected = `${nonce}:PASS`;
  const failed = `${nonce}:FAIL`;
  const url = `https://jshs.cc/admin/system/resources?storageMigrationCutoverSmoke=${nonce}`;
  const started = Date.now();
  let splitBindingsPassed = false;
  let attempt = 0;
  try {
    while (Date.now() - started < 10 * 60 * 1000) {
      attempt += 1;
      console.log("Waiting for GitHub-triggered Cloudflare deployment and authenticated D1 binding verification...");
      const openCommand = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
      const openArgs = process.platform === "win32" ? ["/c", "start", "", `${url}&attempt=${attempt}`] : [`${url}&attempt=${attempt}`];
      const opened = await import("node:child_process").then(({ spawnSync }) => spawnSync(openCommand, openArgs, { stdio: "ignore", timeout: 10_000 }));
      if (opened.error || opened.status !== 0) throw new Error("Could not open the authenticated Admin browser for post-deploy D1 verification");

      const startedAttempt = Date.now();
      while (Date.now() - startedAttempt < 15_000) {
        const result = wrangler(["d1", "execute", LEGACY_NAME, "--remote", "--command", `SELECT value FROM site_settings WHERE key = '${MIGRATION_KEY}' LIMIT 1`, "--json"], { timeout: 30_000 });
        const parsed = parseJsonOutput(result.stdout);
        if (containsValue(parsed, expected)) {
          splitBindingsPassed = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      if (splitBindingsPassed) break;
      if (containsValueForNonce(await readSmokeMarker(), failed)) {
        console.log("Current production version has not switched all three D1 bindings yet; waiting for Cloudflare Git integration.");
      }
      await new Promise((resolve) => setTimeout(resolve, 15_000));
    }
  } finally {
    wrangler(["d1", "execute", LEGACY_NAME, "--remote", "--command", `DELETE FROM site_settings WHERE key = '${MIGRATION_KEY}' AND value LIKE '${nonce}:%'`, "--yes"]);
    const remaining = await readSmokeMarker();
    if (containsValue(remaining, expected) || containsValue(remaining, failed)) throw new Error("Post-deploy D1 smoke marker cleanup could not be verified");
  }
  results.push({ label: "CORE_DB / LEARNING_DB / COMMUNITY_DB runtime bindings", status: splitBindingsPassed ? "PASS" : "FAIL" });
  console.log(`Split D1 runtime bindings: ${splitBindingsPassed ? "PASS" : "FAIL"}`);
  return results;

  function readSmokeMarker() {
    const result = wrangler(["d1", "execute", LEGACY_NAME, "--remote", "--command", `SELECT value FROM site_settings WHERE key = '${MIGRATION_KEY}' LIMIT 1`, "--json"], { timeout: 30_000 });
    return Promise.resolve(parseJsonOutput(result.stdout));
  }
}

function containsValue(value, expected) {
  if (value === expected) return true;
  if (Array.isArray(value)) return value.some((item) => containsValue(item, expected));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsValue(item, expected));
  return false;
}

function containsValueForNonce(value, expected) {
  return containsValue(value, expected);
}

async function updateReportCutover(line) {
  const reportPath = path.join(ROOT, "storage-migration-report.md");
  const text = await readFile(reportPath, "utf8");
  const updated = text.replace(/- Production bindings changed:.*\n- Production deployment:.*\n/, `- Production bindings changed: ${metadata.cutover?.productionBindingsChanged ? "yes" : "no"}\n- Production deployment: ${line}\n`);
  if (updated === text) throw new Error("Migration report cutover section is missing");
  await writeFile(reportPath, updated, { mode: 0o600 });
}
