import { spawnSync } from "node:child_process";

const profile = process.env.JSHS_CLOUDFLARE_PROFILE || "jshs-production";

run("pnpm", ["test"]);
run("pnpm", ["exec", "wrangler", "deploy", "--profile", profile, "--keep-vars"]);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: process.cwd(), env: process.env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
