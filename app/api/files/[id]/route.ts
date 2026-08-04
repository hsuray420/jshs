import { getAdminFile, getR2 } from "../../../../db/admin-store";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const file = await getAdminFile(id);
  if (!file) return new Response("Not found", { status: 404 });

  if (file.visibility !== "public") {
    const user = await getChatGPTUser();
    const allowedEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (!user || !allowedEmails.includes(user.email.toLowerCase())) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const object = await getR2().get(file.object_key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("content-type", file.content_type);
  headers.set(
    "content-disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
  );

  return new Response(object.body, { headers });
}
