import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const workerName = "jshs";
const databaseName = "jshs-db";
const bucketName = "jshs-files";
const configPath = resolve("wrangler.jsonc");
const migrationPath = resolve("drizzle/0000_fine_the_initiative.sql");
const secretsPath = resolve(".env.cloudflare");

function run(command, args, options = {}) {
  const display = [command, ...args].join(" ");
  console.log(`\n> ${display}`);
  return execFileSync(command, args, {
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    env: process.env,
  });
}

function wrangler(args, options = {}) {
  return run("wrangler", args, options);
}

function ensureLoggedIn() {
  try {
    wrangler(["whoami"], { capture: true });
  } catch {
    console.error("Cloudflare is not authenticated. Run `wrangler login` first, then rerun this script.");
    process.exit(1);
  }
}

function getD1DatabaseId() {
  const listText = wrangler(["d1", "list", "--json"], { capture: true });
  const databases = JSON.parse(listText);
  const existing = databases.find((item) => item.name === databaseName);
  if (existing?.uuid) return existing.uuid;

  const created = wrangler(["d1", "create", databaseName, "--location", "apac"], { capture: true });
  const match = created.match(/database_id\s*=\s*"([^"]+)"/) || created.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (!match?.[1]) {
    console.error(created);
    throw new Error("Could not read D1 database_id from Wrangler output.");
  }
  return match[1];
}

function ensureR2Bucket() {
  try {
    wrangler(["r2", "bucket", "create", bucketName, "--location", "apac"]);
  } catch {
    console.log(`R2 bucket ${bucketName} may already exist; continuing.`);
  }
}

function updateWranglerConfig(databaseId) {
  const config = readFileSync(configPath, "utf8").replace(
    /"database_id":\s*"[^"]+"/,
    `"database_id": "${databaseId}"`,
  );
  writeFileSync(configPath, config);
}

function applyD1Schema() {
  wrangler(["d1", "execute", databaseName, "--remote", "--file", migrationPath]);
}

function uploadSecretsIfPresent() {
  if (!existsSync(secretsPath)) {
    console.log("\nNo .env.cloudflare found. Public site will deploy, but LINE/admin secrets will remain unset.");
    return;
  }
  wrangler(["secret", "bulk", secretsPath, "--name", workerName]);
}

function deployWorker() {
  wrangler(["deploy", "--config", configPath, "--keep-vars"]);
}

ensureLoggedIn();
run("pnpm", ["run", "build"]);
const databaseId = getD1DatabaseId();
ensureR2Bucket();
updateWranglerConfig(databaseId);
applyD1Schema();
uploadSecretsIfPresent();
deployWorker();

console.log("\nCloudflare deployment complete. Check https://jshs.cc and https://www.jshs.cc after DNS/custom-domain activation finishes.");
