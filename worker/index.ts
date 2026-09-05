/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { dispatchDueImportantDateNotifications, dispatchWeeklyReportNotifications } from "../lib/notifications";
import districtMetadata from "../public/it_hs/district-metadata.json";
import guideCss from "../public/it_hs/guide.css?raw";
import robotsText from "../public/robots.txt?raw";
import sitemapXml from "../public/sitemap.xml?raw";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
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

function trustResponse(body: BodyInit, contentType: string): Response {
  return new Response(body, {
    headers: {
      "cache-control": "no-store",
      "content-type": contentType,
      "x-content-type-options": "nosniff",
      "x-jshs-release": "2026.08.14-p0",
    },
  });
}

const rootStaticAssets = new Set([
  "/favicon.svg",
  "/sw.js",
  "/offline.html",
  "/file.svg",
  "/globe.svg",
  "/window.svg",
]);

const canonicalHomePaths = new Set([
  "/jshs",
  "/jshs/",
  "/jshs/home",
  "/jshs/home/",
  "/jshs/jshs",
  "/jshs/jshs/",
]);

const legacyGuidePaths = new Set([
  "/it_hs/it_hs",
  "/it_hs/it_hs.html",
]);

function isPublicDocumentRequest(request: Request, url: URL): boolean {
  const accept = request.headers.get("accept") || "";
  if (request.method !== "GET" || request.headers.has("cookie") || !accept.includes("text/html")) return false;
  if (request.headers.has("rsc") || request.headers.has("next-router-state-tree") || request.headers.has("next-url")) return false;
  return !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/admin") && !url.pathname.startsWith("/planner/share");
}

function publicDocumentResponse(response: Response): Response {
  if (response.status !== 200 || response.headers.has("set-cookie")) return response;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
  headers.set("x-jshs-cache-policy", "public-document-60s");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function redirectToCanonicalHome(request: Request): Response {
  return Response.redirect(new URL("/", request.url), 301);
}

function redirectToGuide(request: Request, status = 301): Response {
  const url = new URL(request.url);
  const destination = new URL("/it_hs/guide.htm", request.url);
  const district = url.searchParams.get("district");
  if (district && /^[a-z-]{2,30}$/.test(district)) destination.searchParams.set("district", district);
  return Response.redirect(destination, status);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/it_hs/district-metadata.json") {
      return trustResponse(JSON.stringify(districtMetadata), "application/json; charset=utf-8");
    }

    if (url.pathname === "/robots.txt") {
      return trustResponse(robotsText, "text/plain; charset=utf-8");
    }

    if (url.pathname === "/sitemap.xml") {
      return trustResponse(sitemapXml, "application/xml; charset=utf-8");
    }

    if (url.pathname === "/_vinext/image") {
      const imageBinding = env.IMAGES;
      if (!imageBinding) {
        return env.ASSETS.fetch(request);
      }

      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await imageBinding.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    // The standalone guide is static and must not pass through Vinext's
    // extension-normalising router: doing so can serve an earlier cached
    // HTML/CSS/JS revision. Route it, and its shared token stylesheet,
    // straight to the versioned asset binding.
    if (url.pathname === "/design-tokens.css" || url.pathname === "/app/globals.css") {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/it_hs/guide.css") {
      return trustResponse(guideCss, "text/css; charset=utf-8");
    }

    if (canonicalHomePaths.has(url.pathname)) return redirectToCanonicalHome(request);
    if (legacyGuidePaths.has(url.pathname)) return redirectToGuide(request);

    const isStaticAsset =
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/it_5/") ||
      rootStaticAssets.has(url.pathname) ||
      (url.pathname.startsWith("/jshs/") && /\.[a-z0-9]+$/i.test(url.pathname));

    if (isStaticAsset) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname.startsWith("/it_hs/")) {
      const assetPath = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
      const assetUrl = new URL(assetPath, request.url);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    const response = await handler.fetch(request, env, ctx);
    return isPublicDocumentRequest(request, url) ? publicDocumentResponse(response) : response;
  },
  async scheduled(_controller: { scheduledTime: number; cron: string; type: "scheduled" }, _env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(Promise.all([dispatchDueImportantDateNotifications(), dispatchWeeklyReportNotifications()]));
  },
};

export default worker;
