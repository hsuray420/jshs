import { cookies } from "next/headers";
import { createAdminSessionCookie } from "../../../../admin/auth";
import { listExtraAdminLineUserIds, upsertLineUser } from "../../../../../db/admin-store";
import {
  exchangeLineCode,
  getAllowedLineUserIds,
  notifyLineAdmins,
  verifyLineIdToken,
} from "../../../../../lib/line";

export const dynamic = "force-dynamic";

const LINE_STATE_COOKIE = "jshs_line_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) return redirectTo(url, `/admin/login?error=${encodeURIComponent(error)}`);
  if (!code || !state) return redirectTo(url, "/admin/login?error=line_callback");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(LINE_STATE_COOKIE)?.value;
  cookieStore.set(LINE_STATE_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
  if (!expectedState || expectedState !== state) {
    return redirectTo(url, "/admin/login?error=line_state");
  }

  const origin = url.origin;
  try {
    const token = await exchangeLineCode({ code, origin });
    const profile = await verifyLineIdToken(token.id_token || "");
    await upsertLineUser({
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      status: "seen",
    });
    const allowedIds = [
      ...getAllowedLineUserIds(),
      ...(await listExtraAdminLineUserIds()),
    ];
    if (!allowedIds.length) {
      return redirectTo(
        url,
        `/admin/login?error=line_allowlist&line_user_id=${encodeURIComponent(profile.userId)}`,
      );
    }
    if (!allowedIds.includes(profile.userId)) {
      return redirectTo(
        url,
        `/admin/login?error=line_forbidden&line_user_id=${encodeURIComponent(profile.userId)}`,
      );
    }

    await createAdminSessionCookie({
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    });

    await notifyLineAdmins(
      [
        "後台登入通知",
        `帳號：${profile.displayName}`,
        `時間：${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
        `網址：${origin}/admin`,
      ].join("\n"),
      profile.userId,
    ).catch((pushError) => console.error("LINE login notification failed", pushError));

    return redirectTo(url, "/admin");
  } catch (callbackError) {
    console.error("LINE login callback failed", callbackError);
    return redirectTo(url, "/admin/login?error=line_failed");
  }
}

function redirectTo(currentUrl: URL, path: string) {
  return Response.redirect(new URL(path, currentUrl.origin), 303);
}
