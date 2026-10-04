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
  return uploadImageKitFile(input.file, `/jshs/schools/${input.schoolCode}`);
}

export async function uploadAdminImageToImageKit(file: File): Promise<ImageKitUpload> {
  return uploadImageKitFile(file, "/jshs/admin");
}

async function uploadImageKitFile(file: File, folder: string): Promise<ImageKitUpload> {
  const config = getImageKitConfig();
  if (!config) throw new Error("imagekit_not_configured");
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("fileName", `${crypto.randomUUID()}-${safeFileName(file.name)}`);
  form.set("folder", folder);
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

export async function checkImageKitHealth() {
  const config = getImageKitConfig();
  if (!config) return { configured: false as const, connected: false as const };
  const response = await fetch("https://api.imagekit.io/v1/files?limit=1", {
    headers: { authorization: `Basic ${btoa(`${config.privateKey}:`)}` },
  }).catch(() => null);
  return { configured: true as const, connected: Boolean(response?.ok), status: response?.status ?? null };
}

export async function runImageKitStorageSmokeTest() {
  const config = getImageKitConfig();
  if (!config) throw new Error("imagekit_not_configured");
  const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p4sAAAAASUVORK5CYII="), (character) => character.charCodeAt(0));
  const file = new File([bytes], `jshs-storage-smoke-${crypto.randomUUID()}.png`, { type: "image/png" });
  const uploaded = await uploadSchoolImageToImageKit({ file, schoolCode: "storage-smoke-test" });
  let lookupVerified = false;
  let urlVerified = false;
  let deleteVerified = false;
  try {
    const lookup = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(uploaded.fileId)}`, {
      headers: { authorization: `Basic ${btoa(`${config.privateKey}:`)}` },
    });
    if (!lookup.ok) throw new Error("imagekit_file_readback_failed");
    const details = await lookup.json().catch(() => null) as { fileId?: unknown; url?: unknown } | null;
    if (details?.fileId !== uploaded.fileId || !isHttps(details.url)) throw new Error("imagekit_file_readback_mismatch");
    lookupVerified = true;

    const imageResponse = await fetch(uploaded.url);
    if (!imageResponse.ok || !imageResponse.headers.get("content-type")?.startsWith("image/")) {
      throw new Error("imagekit_url_readback_failed");
    }
    urlVerified = true;
  } finally {
    await deleteImageKitFile(uploaded.fileId);
    const lookupAfterDelete = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(uploaded.fileId)}`, {
      headers: { authorization: `Basic ${btoa(`${config.privateKey}:`)}` },
    });
    deleteVerified = lookupAfterDelete.status === 404;
    if (!deleteVerified) throw new Error("imagekit_delete_readback_failed");
  }
  if (!lookupVerified || !urlVerified || !deleteVerified) throw new Error("imagekit_smoke_test_failed");
  return { passed: true, fileIdVerified: lookupVerified, urlVerified, deleteVerified, bytesWrittenToD1: false };
}

function safeFileName(value: string) { return value.replace(/[^\w.\-\u4e00-\u9fff]/g, "_").slice(-120) || "school-image"; }
function isHttps(value: unknown): value is string { try { return typeof value === "string" && new URL(value).protocol === "https:"; } catch { return false; } }
