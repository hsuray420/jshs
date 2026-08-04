import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "後台登入｜中投區國中升學資訊網",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; logged_out?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-panel admin-login-panel">
        <p className="admin-eyebrow">Admin</p>
        <h1>後台登入</h1>
        <p className="admin-muted">
          請輸入後台密碼。登入後會停留在 ct-jshs-edu.abrdns.com，不會離開本站。
        </p>
        {error ? (
          <p className="admin-alert">
            {error === "setup"
              ? "尚未設定後台密碼，請先設定 ADMIN_PASSWORD。"
              : "密碼不正確，請再試一次。"}
          </p>
        ) : null}
        {params.logged_out ? <p className="admin-success">已登出。</p> : null}
        <form action="/api/admin/login" method="post">
          <label>
            後台密碼
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="admin-button" type="submit">
            登入後台
          </button>
        </form>
        <a className="admin-plain-link" href="/jshs/jshs.html">
          回前台
        </a>
      </section>
    </main>
  );
}
