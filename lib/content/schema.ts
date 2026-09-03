import type { ContentMetadata } from "./types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/u;

export function validateContentMetadata(metadata: ContentMetadata, filePath: string): void {
  const required = ["id", "slug", "title", "description", "category", "status"] as const;
  const missing = required.filter((key) => typeof metadata[key] !== "string" || !metadata[key]);
  if (missing.length) throw new Error(`${filePath}: missing metadata: ${missing.join(", ")}`);
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(metadata.slug)) throw new Error(`${filePath}: slug must be kebab-case`);
  if (!["draft", "published", "archived"].includes(metadata.status)) throw new Error(`${filePath}: invalid status`);
  for (const key of ["publishedAt", "updatedAt"] as const) {
    if (metadata[key] !== undefined && (typeof metadata[key] !== "string" || !datePattern.test(metadata[key]))) throw new Error(`${filePath}: ${key} must use YYYY-MM-DD`);
  }
  if (metadata.sources !== undefined && (!Array.isArray(metadata.sources) || metadata.sources.some((source) => typeof source?.url !== "string"))) throw new Error(`${filePath}: sources must be an array with URLs`);
}

export function validateStructuredContent(value: unknown, filePath: string): void {
  if (!value || typeof value !== "object") throw new Error(`${filePath}: structured content must be an object or array`);
  if (Array.isArray(value) && value.some((item) => !item || typeof item !== "object")) throw new Error(`${filePath}: array entries must be objects`);
}
