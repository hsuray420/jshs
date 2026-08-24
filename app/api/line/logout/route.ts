import { clearMemberSessionCookie } from "../../../../lib/member-auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ ok: false, error: "same_origin_required" }, { status: 403 });
  await clearMemberSessionCookie();
  return Response.redirect(new URL("/account?logged_out=1", request.url), 303);
}
