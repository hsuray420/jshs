import { getAdminFileBlob, getSchoolMediaOverride } from "../../../db/admin-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() || "";
  if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return new Response("Not found", { status: 404 });
  const override = await getSchoolMediaOverride(code);
  if (!override) return new Response("Not found", { status: 404 });
  const file = await getAdminFileBlob(override.file_id);
  if (!file || file.visibility !== "public" || !file.content_type.startsWith("image/") || !file.file_blob) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(file.file_blob, {
    headers: {
      "content-type": file.content_type,
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
