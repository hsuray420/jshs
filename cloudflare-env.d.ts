declare namespace Cloudflare {
  interface Env {
    ASSETS: Fetcher;
    DB?: D1Database;
    FILES?: R2Bucket;
  }
}

declare module "*?raw" {
  const content: string;
  export default content;
}
