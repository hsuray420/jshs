import { redirect } from "next/navigation";
import { createAdminFile, enqueueExternalMediaCleanup } from "../../../../db/admin-store";
import { requireAdmin } from "../../../admin/auth";
import { deleteImageKitFile, uploadAdminImageToImageKit } from "../../../../lib/imagekit-server";

export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 750_000;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.allowed) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const upload = formData.get("file");
  if (!(upload instanceof File)) {
    return Response.json({ ok: false, error: "file_required" }, { status: 400 });
  }
  if (upload.size > MAX_FILE_BYTES) {
    return Response.json({ ok: false, error: "file_too_large", maxBytes: MAX_FILE_BYTES }, { status: 413 });
  }

  const category = String(formData.get("category") || "general").slice(0, 80);
  const visibility =
    String(formData.get("visibility") || "public") === "private"
      ? "private"
      : "public";
  const description = String(formData.get("description") || "").slice(0, 500);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const safeFileName = upload.name.replace(/[^\w.\-\u4e00-\u9fff]/g, "_");
  const objectKey = `${visibility}/${createdAt.slice(0, 10)}/${id}-${safeFileName}`;
  const bytes = await upload.arrayBuffer();
  const contentType = getContentType(upload.name, upload.type, bytes);
  const isImage = contentType.startsWith("image/");
  const imageFile = isImage ? new File([bytes], upload.name, { type: contentType }) : null;
  const external = imageFile ? await uploadAdminImageToImageKit(imageFile) : null;

  try {
    await createAdminFile({
      id,
      object_key: objectKey,
      file_name: upload.name,
      content_type: contentType,
      size: upload.size,
      category,
      visibility,
      description,
      uploaded_by: admin.user.displayName,
      created_at: createdAt,
      storage_provider: external ? "imagekit" : "d1",
      external_file_id: external?.fileId ?? null,
      external_url: external?.url ?? null,
      file_blob: external ? undefined : bytes,
    });
  } catch (error) {
    if (external) {
      try {
        await deleteImageKitFile(external.fileId);
      } catch (cleanupError) {
        console.error("New ImageKit admin file cleanup failed", cleanupError instanceof Error ? cleanupError.message : "unknown_error");
        await enqueueExternalMediaCleanup({ provider: "imagekit", fileId: external.fileId, error: "metadata_persist_failed" });
      }
    }
    throw error;
  }

  redirect("/admin/media");
}

function getContentType(fileName: string, declaredType: string, bytes: ArrayBuffer) {
  if (declaredType.toLowerCase().startsWith("image/")) return declaredType.toLowerCase();
  const extension = fileName.toLowerCase().split(".").pop();
  const imageTypes: Record<string, string> = {
    avif: "image/avif",
    bmp: "image/bmp",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    svg: "image/svg+xml",
    tif: "image/tiff",
    tiff: "image/tiff",
    webp: "image/webp",
  };
  const knownType = imageTypes[extension ?? ""];
  if (knownType) return knownType;
  const data = new Uint8Array(bytes);
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return "image/png";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38) return "image/gif";
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46
    && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return "image/webp";
  if (data[0] === 0x42 && data[1] === 0x4d) return "image/bmp";
  if (data[0] === 0x49 && data[1] === 0x49 && data[2] === 0x2a && data[3] === 0x00
    || data[0] === 0x4d && data[1] === 0x4d && data[2] === 0x00 && data[3] === 0x2a) return "image/tiff";
  if (data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70) return "image/avif";
  const text = new TextDecoder().decode(data.subarray(0, 512)).trimStart().toLowerCase();
  if (text.startsWith("<svg") || text.startsWith("<?xml") && text.includes("<svg")) return "image/svg+xml";
  return declaredType || "application/octet-stream";
}
