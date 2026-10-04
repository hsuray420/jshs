import { env } from "cloudflare:workers";

type RuntimeEnvironment = Record<string, unknown>;

export type ImageKitConfig = Readonly<{ publicKey: string; privateKey: string; urlEndpoint: string }>;

export function getImageKitConfig(): ImageKitConfig | null {
  const runtime = env as unknown as RuntimeEnvironment;
  const publicKey = typeof runtime.IMAGEKIT_PUBLIC_KEY === "string" ? runtime.IMAGEKIT_PUBLIC_KEY : "";
  const privateKey = typeof runtime.IMAGEKIT_PRIVATE_KEY === "string" ? runtime.IMAGEKIT_PRIVATE_KEY : "";
  const urlEndpoint = typeof runtime.IMAGEKIT_URL_ENDPOINT === "string" ? runtime.IMAGEKIT_URL_ENDPOINT.replace(/\/$/, "") : "";
  if (!publicKey || !privateKey || !/^https:\/\//i.test(urlEndpoint)) return null;
  return { publicKey, privateKey, urlEndpoint };
}

export async function createImageKitUploadSignature() {
  const config = getImageKitConfig();
  if (!config) throw new Error("imagekit_not_configured");
  const token = crypto.randomUUID().replace(/-/g, "");
  const expire = Math.floor(Date.now() / 1000) + 5 * 60;
  const payload = new TextEncoder().encode(`${token}${expire}${config.privateKey}`);
  const digest = await crypto.subtle.digest("SHA-1", payload);
  const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { token, expire, signature, publicKey: config.publicKey, urlEndpoint: config.urlEndpoint };
}

export type ImageKitUpload = Readonly<{ fileId: string; url: string; thumbnailUrl: string }>;

/** A Worker-side proxy prevents ImageKit credentials reaching the browser. */
export async function uploadSchoolImageToImageKit(input: { file: File; schoolCode: string }): Promise<ImageKitUpload> {
  const config = getImageKitConfig();
  if (!config) throw new Error("imagekit_not_configured");
  const form = new FormData();
  form.set("file", input.file, input.file.name);
  form.set("fileName", `${crypto.randomUUID()}-${safeFileName(input.file.name)}`);
  form.set("folder", `/jshs/schools/${input.schoolCode}`);
  form.set("useUniqueFileName", "false");
  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${config.privateKey}:`)}` },
    body: form,
  });
  const body = await response.json().catch(() => null) as { fileId?: unknown; url?: unknown; thumbnailUrl?: unknown } | null;
  if (!response.ok || !body || typeof body.fileId !== "string" || !isHttps(body.url)) throw new Error("imagekit_upload_failed");
  return { fileId: body.fileId, url: body.url, thumbnailUrl: isHttps(body.thumbnailUrl) ? body.thumbnailUrl : body.url };
}

export async function deleteImageKitFile(fileId: string) {
  const config = getImageKitConfig();
  if (!config) throw new Error("imagekit_not_configured");
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(fileId)) throw new Error("invalid_imagekit_file_id");
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { authorization: `Basic ${btoa(`${config.privateKey}:`)}` },
  });
  if (!response.ok && response.status !== 404) throw new Error("imagekit_delete_failed");
}

function safeFileName(value: string) { return value.replace(/[^\w.\-\u4e00-\u9fff]/g, "_").slice(-120) || "school-image"; }
function isHttps(value: unknown): value is string { try { return typeof value === "string" && new URL(value).protocol === "https:"; } catch { return false; } }
