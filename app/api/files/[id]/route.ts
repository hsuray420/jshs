import { getAdminFileBlob } from "../../../../db/admin-store";
import { getAdminSession } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const file = await getAdminFileBlob(id);
  if (!file) return new Response("Not found", { status: 404 });

  if (file.visibility !== "public") {
    const user = await getAdminSession();
    if (!user) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  if (!file.file_blob) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("content-type", file.content_type);
  headers.set(
    "content-disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
  );

  return new Response(file.file_blob, { headers });
}
