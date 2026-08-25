import { cookies } from "next/headers";
import { createMemberSessionCookie } from "../../../../../lib/member-auth";
import { exchangeLineCode, getLineFriendStatus, hasLineLoginConfigured, verifyLineIdToken } from "../../../../../lib/line";
import { upsertLineUser } from "../../../../../db/admin-store";

export const dynamic = "force-dynamic";
const LINE_STATE_COOKIE = "jshs_member_line_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (error || !code || !state || !hasLineLoginConfigured()) return redirectTo(url, "/account?error=line_callback");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(LINE_STATE_COOKIE)?.value;
  cookieStore.set(LINE_STATE_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: true });
  if (!expectedState || expectedState !== state) return redirectTo(url, "/account?error=line_state");

  try {
    const token = await exchangeLineCode({ code, origin: url.origin, callbackPath: "/api/line/login/callback" });
    const profile = await verifyLineIdToken(token.id_token || "");
    const isFriend = await getLineFriendStatus(profile.userId);
    if (!isFriend) {
      await upsertLineUser({ lineUserId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl, status: "seen" });
      return redirectTo(url, "/account?error=line_friend_required");
    }
    await upsertLineUser({ lineUserId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl, status: "seen" });
    await createMemberSessionCookie({ lineUserId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl, friendVerifiedAt: Date.now() });
    return redirectTo(url, "/account?registered=1");
  } catch (callbackError) {
    console.error("LINE member callback failed", callbackError);
    const errorCode = callbackError instanceof Error && callbackError.message === "line_friend_check_not_configured" ? "line_friend_check_setup" : "line_failed";
    return redirectTo(url, `/account?error=${errorCode}`);
  }
}

function redirectTo(currentUrl: URL, path: string) { return Response.redirect(new URL(path, currentUrl.origin), 303); }
