import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { hasLineLoginConfigured } from "../../../lib/line";

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
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/account" />
      <section className="jshs-hero-section">
        <div className="mx-auto grid w-[min(1160px,calc(100%-32px))] gap-8 py-12 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-20">
          <div>
            <p className="jshs-eyebrow">JSHS Admin · LINE 管理員</p>
            <h1 className="mt-3 max-w-3xl">讓網站資料與通知，交給正確的人管理。</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 jshs-muted-copy">後台可管理學校資料、重要日期、LINE 通知與待審核內容。請使用已授權的 LINE 管理員身分登入。</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[["通知", "三類通知主控"], ["日期", "重要日期排程"], ["資料", "D1 後台保存"]].map(([title, detail]) => <div key={title} className="jshs-surface-card p-4"><strong className="block text-[var(--jshs-primary)]">{title}</strong><span className="mt-1 block text-xs leading-5 jshs-muted-copy">{detail}</span></div>)}
            </div>
          </div>
          <section className="jshs-surface-card p-6 shadow-xl shadow-slate-200/50 md:p-8" aria-labelledby="admin-login-title">
            <p className="jshs-eyebrow">安全登入</p>
            <h2 id="admin-login-title" className="mt-2 text-3xl">後台登入</h2>
            <p className="mt-3 text-sm leading-7 jshs-muted-copy">登入後只會回到本站後台，不會在頁面上顯示 LINE 密鑰。</p>
            {error ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900" role="alert">{loginErrorMessage(error, params.line_user_id)}</p> : null}
            {params.logged_out ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800" role="status">已安全登出。</p> : null}
            {isLineReady ? <a className="mt-6 inline-flex w-full items-center justify-center px-5 py-4 text-base jshs-button-primary" href="/api/admin/line/start">使用 LINE 登入</a> : <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">尚未設定 LINE Login，請先設定 LINE_LOGIN_CHANNEL_ID 與 LINE_LOGIN_CHANNEL_SECRET。</p>}
            <Link className="mt-5 inline-flex text-sm font-black text-[var(--jshs-primary)]" href="/">← 回到前台</Link>
          </section>
        </div>
      </section>
      <SiteFooter />
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
  if (error === "line_forbidden") {
    return `這個 LINE 帳號沒有後台權限。請把此 userId 加到 ADMIN_LINE_USER_IDS：${lineUserId || "未取得"}`;
  }
  if (error === "line_failed") return "LINE 登入失敗，請稍後再試。";
  return "登入失敗，請重新登入。";
}
