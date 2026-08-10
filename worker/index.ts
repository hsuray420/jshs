/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  FILES: R2Bucket;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      if (!env.IMAGES) {
        return env.ASSETS.fetch(request);
      }

      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    // The standalone guide is static and must not pass through Vinext's
    // extension-normalising router: doing so can serve an earlier cached
    // HTML/CSS/JS revision. Route it, and its shared token stylesheet,
    // straight to the versioned asset binding.
    if (url.pathname === "/design-tokens.css") {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname.startsWith("/it_hs/")) {
      const assetPath = url.pathname === "/it_hs/it_hs" ? "/it_hs/it_hs.html" : (
        url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname
      );
      const assetUrl = new URL(assetPath, request.url);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
