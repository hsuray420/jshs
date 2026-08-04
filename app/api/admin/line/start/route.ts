import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildLineAuthorizeUrl, hasLineLoginConfigured } from "../../../../../lib/line";

export const dynamic = "force-dynamic";

const LINE_STATE_COOKIE = "jshs_line_oauth_state";

export async function GET(request: Request) {
  if (!hasLineLoginConfigured()) {
    redirect("/admin/login?error=line_setup");
  }

  const state = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const cookieStore = await cookies();
  cookieStore.set(LINE_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: true,
  });

  redirect(buildLineAuthorizeUrl({ origin, state }));
}
