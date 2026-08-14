import { spawn } from "node:child_process";
import { readdirSync, watch } from "node:fs";
import { resolve } from "node:path";

const profile = process.env.JSHS_CLOUDFLARE_PROFILE || "jshs-production";
const debounceMs = Number(process.env.JSHS_DEPLOY_DEBOUNCE_MS || 3000);
const projectRoot = process.cwd();
const ignoredRoots = new Set([".git", ".next", ".wrangler", "backups", "dist", "node_modules", "tmp"]);
const watchedRoots = new Set(["app", "components", "content", "db", "lib", "public", "scripts", "styles", "tests", "worker"]);
const watchedFiles = new Set(["package.json", "pnpm-lock.yaml", "next.config.ts", "tsconfig.json", "wrangler.jsonc"]);

let timer;
let running = false;
let pending = false;

console.log(`[jshs] Watching local source. Verified changes deploy directly to Cloudflare profile ${profile}.`);

const watcher = watch(process.cwd(), { recursive: true }, (_event, filename) => {
  if (!shouldDeploy(filename)) return;
  pending = true;
  clearTimeout(timer);
  timer = setTimeout(() => void deployPending(), debounceMs);
});

async function deployPending() {
  if (!pending) return;
  if (running) return;
  pending = false;
  running = true;
  const startedAt = new Date().toISOString();
  console.log(`[jshs] ${startedAt} change settled; running tests before deploy.`);
  const tested = await runVerification();
  if (tested) {
    await runNode([
      "node_modules/wrangler/bin/wrangler.js",
      "deploy",
      "--profile",
      profile,
      "--keep-vars",
    ]);
  } else {
    console.error("[jshs] Tests failed. Production was not changed.");
  }
  running = false;
  if (pending) {
    clearTimeout(timer);
    timer = setTimeout(() => void deployPending(), debounceMs);
  }
}

function shouldDeploy(filename) {
  if (!filename) return false;
  const normalized = filename.replaceAll("\\", "/");
  if (normalized === "lib/source-code.ts") return false;
  if (normalized === "public/it_hs/guide-tailwind.css") return false;
  const root = normalized.split("/")[0];
  if (ignoredRoots.has(root)) return false;
  if (watchedFiles.has(normalized)) return true;
  return watchedRoots.has(root) && !normalized.endsWith(".log");
}

async function runVerification() {
  const testFiles = readdirSync(resolve(projectRoot, "tests"))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => resolve(projectRoot, "tests", name));
  const steps = [
    ["scripts/validate-content-trust.mjs"],
    ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"],
    ["scripts/generate-guide-tailwind.mjs"],
    ["scripts/generate-source-snapshot.mjs"],
    ["node_modules/vinext/dist/cli.js", "build"],
    ["--test", ...testFiles],
  ];
  for (const args of steps) {
    const env = args[0].includes("vinext") ? { WRANGLER_LOG_PATH: ".wrangler/wrangler.log" } : {};
    if (!(await runNode(args, env))) return false;
  }
  return true;
}

function runNode(args, extraEnv = {}) {
  return run(process.execPath, args, extraEnv);
}

function run(command, args, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...extraEnv },
      stdio: "inherit",
    });
    child.on("error", (error) => { console.error(`[jshs] ${command} failed to start`, error); resolve(false); });
    child.on("exit", (code) => resolve(code === 0));
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { watcher.close(); process.exit(0); });
}
