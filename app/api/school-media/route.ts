import { getSchoolMediaMetadata } from "../../../db/school-media-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() || "";
  if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return new Response("Not found", { status: 404 });
  const override = await getSchoolMediaMetadata(code);
  if (!override) return new Response("Not found", { status: 404 });
  if (override.storage_provider !== "imagekit" || !/^https:\/\//.test(override.image_url)) return new Response("Not found", { status: 404 });
  return Response.redirect(override.image_url, 302);
}
