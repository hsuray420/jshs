"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type AdminNavItem = readonly [label: string, href: string];
type AdminNavGroup = { label: string; items: readonly AdminNavItem[] };

const groups: readonly AdminNavGroup[] = [
  { label: "總覽", items: [["總覽", "/admin"]] },
  { label: "資料與內容", items: [["學校與資料", "/admin/data"], ["內容管理", "/admin/content"]] },
  { label: "營運", items: [["通知中心", "/admin/notifications"], ["媒體與檔案", "/admin/media"], ["支持與付款", "/admin/payments"]] },
  { label: "平台", items: [["網站與部署", "/admin/deployments"], ["系統與安全", "/admin/system"], ["網站設定", "/admin/settings"]] },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === "/admin/login") return <>{children}</>;
  const current = groups.flatMap((group) => group.items).find(([, href]) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`)));
  return <div className="admin-app-shell">
    <button type="button" className="admin-mobile-menu" onClick={() => setOpen(true)} aria-label="開啟後台選單">☰ <span>後台選單</span></button>
    {open ? <button type="button" className="admin-sidebar-backdrop" onClick={() => setOpen(false)} aria-label="關閉後台選單" /> : null}
    <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
      <div className="admin-sidebar-brand"><span className="admin-sidebar-mark">J</span><span><strong>JSHS.CC</strong><small>管理後台</small></span><button type="button" className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="關閉選單">×</button></div>
      <nav aria-label="管理後台主選單">{groups.map((group) => <section key={group.label} className="admin-nav-group"><p>{group.label}</p>{group.items.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={current?.[1] === href ? "is-active" : ""}>{label}</Link>)}</section>)}</nav>
      <div className="admin-sidebar-footer"><Link href="/" target="_blank">查看前台 ↗</Link><Link href="/api/admin/logout">登出</Link></div>
    </aside>
    <div className="admin-workspace"><header className="admin-topbar"><div><span className="admin-breadcrumb">JSHS Admin</span><strong>{current?.[0] || "總覽"}</strong></div><div className="admin-topbar-actions"><span className="admin-status-dot">● 系統正常</span><Link href="/admin/system">系統狀態</Link></div></header><main className="admin-main">{children}</main></div>
  </div>;
}
