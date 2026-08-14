import { spawn } from "node:child_process";
import { watch } from "node:fs";

const profile = process.env.JSHS_CLOUDFLARE_PROFILE || "jshs-production";
const debounceMs = Number(process.env.JSHS_DEPLOY_DEBOUNCE_MS || 3000);
const ignoredRoots = new Set([".git", ".next", ".wrangler", "backups", "dist", "node_modules", "tmp"]);
const watchedRoots = new Set(["app", "components", "content", "db", "lib", "public", "scripts", "tests", "worker"]);
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
  const tested = await run("pnpm", ["test"]);
  if (tested) {
    await run("pnpm", ["exec", "wrangler", "deploy", "--profile", profile, "--keep-vars"]);
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
  const root = normalized.split("/")[0];
  if (ignoredRoots.has(root)) return false;
  if (watchedFiles.has(normalized)) return true;
  return watchedRoots.has(root) && !normalized.endsWith(".log");
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: process.cwd(), env: process.env, stdio: "inherit" });
    child.on("error", (error) => { console.error(`[jshs] ${command} failed to start`, error); resolve(false); });
    child.on("exit", (code) => resolve(code === 0));
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { watcher.close(); process.exit(0); });
}
