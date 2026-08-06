import type { Metadata } from "next";
import { hasLineLoginConfigured } from "../../../lib/line";
import "../styles.css";

export const metadata: Metadata = {
  title: "後台登入｜全國國中升學資訊網",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; logged_out?: string; line_user_id?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const isLineReady = hasLineLoginConfigured();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-panel admin-login-panel">
        <p className="admin-eyebrow">Admin</p>
        <h1>後台登入</h1>
        <p className="admin-muted">
          請使用 LINE 驗證管理員身分。登入後會停留在 ct-jshs-edu.abrdns.com，不會離開本站。
        </p>
        {error ? (
          <p className="admin-alert">
            {loginErrorMessage(error, params.line_user_id)}
          </p>
        ) : null}
        {params.logged_out ? <p className="admin-success">已登出。</p> : null}
        {isLineReady ? (
          <a className="admin-button admin-line-button" href="/api/admin/line/start">
            使用 LINE 登入
          </a>
        ) : (
          <p className="admin-alert">
            尚未設定 LINE Login，請先設定 LINE_LOGIN_CHANNEL_ID 與
            LINE_LOGIN_CHANNEL_SECRET。
          </p>
        )}
        <a className="admin-plain-link" href="/jshs/jshs.html">
          回前台
        </a>
      </section>
    </main>
  );
}

function loginErrorMessage(error: string, lineUserId?: string) {
  if (error === "line_setup") return "尚未設定 LINE Login。";
  if (error === "line_state") return "LINE 登入驗證逾時，請重新登入。";
  if (error === "line_callback") return "LINE 回傳資料不完整，請重新登入。";
  if (error === "line_allowlist") {
    return `這個 LINE 帳號尚未加入管理員名單。請把此 userId 加到 ADMIN_LINE_USER_IDS：${lineUserId || "未取得"}`;
  }
  if (error === "line_forbidden") return "這個 LINE 帳號沒有後台權限。";
  if (error === "line_failed") return "LINE 登入失敗，請稍後再試。";
  return "登入失敗，請重新登入。";
}
