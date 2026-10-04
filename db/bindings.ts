import { env } from "cloudflare:workers";

type DatabaseEnvironment = {
  CORE_DB?: D1Database;
  LEARNING_DB?: D1Database;
  COMMUNITY_DB?: D1Database;
};

export type DatabaseDomain = "core" | "learning" | "community";
export type DatabaseConnection = D1Database;

const runtime = env as unknown as DatabaseEnvironment;

function resolveDatabase(binding: keyof DatabaseEnvironment): DatabaseConnection {
  const db = runtime[binding];
  if (!db) throw new Error(`${binding.toLowerCase()}_binding_unavailable`);
  return db;
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

export const DATABASE_NAMES = Object.freeze({
  core: "jshs-core",
  learning: "jshs-learning",
  community: "jshs-community",
});
