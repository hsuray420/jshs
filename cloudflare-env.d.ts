declare namespace Cloudflare {
  interface Env {
    ASSETS: Fetcher;
    CORE_DB: D1Database;
    LEARNING_DB: D1Database;
    COMMUNITY_DB: D1Database;
    FILES?: R2Bucket;
  }
}

declare module "*?raw" {
  const content: string;
  export default content;
}
