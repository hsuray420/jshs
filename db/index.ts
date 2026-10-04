import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.CORE_DB) {
    throw new Error(
      "Cloudflare D1 binding `CORE_DB` is unavailable. Configure the split D1 bindings before using the database."
    );
  }

  return drizzle(env.CORE_DB, { schema });
}
