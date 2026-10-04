import { env } from "cloudflare:workers";

type DatabaseEnvironment = typeof env & {
  CORE_DB?: D1Database;
  LEARNING_DB?: D1Database;
  COMMUNITY_DB?: D1Database;
  DB?: D1Database;
};

export type DatabaseDomain = "core" | "learning" | "community";
export type DatabaseConnection = Readonly<{ db: D1Database; mode: "split" | "legacy" }>;

const runtime = env as DatabaseEnvironment;

function resolveDatabase(binding: "CORE_DB" | "LEARNING_DB" | "COMMUNITY_DB"): DatabaseConnection {
  const splitDatabase = runtime[binding];
  if (splitDatabase) return { db: splitDatabase, mode: "split" };
  if (runtime.DB) return { db: runtime.DB, mode: "legacy" };
  throw new Error(`${binding.toLowerCase()}_binding_unavailable`);
}

export function getCoreDatabase() {
  return resolveDatabase("CORE_DB");
}

export function getLearningDatabase() {
  return resolveDatabase("LEARNING_DB");
}

export function getCommunityDatabase() {
  return resolveDatabase("COMMUNITY_DB");
}

export function getLegacyDatabase() {
  if (!runtime.DB) throw new Error("legacy_db_binding_unavailable");
  return runtime.DB;
}

export const DATABASE_NAMES = Object.freeze({
  core: "jshs-core",
  learning: "jshs-learning",
  community: "jshs-community",
  legacy: "jshs-db",
});
