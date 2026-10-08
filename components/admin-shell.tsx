"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type AdminNavItem = readonly [label: string, href: string];
type AdminNavGroup = { label: string; items: readonly AdminNavItem[] };

const groups: readonly AdminNavGroup[] = [
  { label: "總覽", items: [["總覽", "/admin"]] },
  { label: "網站編輯", items: [["前台鏡像編輯", "/admin/editor"], ["學校資料", "/admin/schools"], ["熱門學校推薦", "/admin/schools/popular"], ["媒體與圖片", "/admin/media"]] },
  { label: "內容與資料", items: [["內容管理", "/admin/content"], ["資料健康中心", "/admin/data"], ["資料回報", "/admin/data/reports"], ["學校評論", "/admin/data/reviews"], ["15 區 CSV 原始檔", "/admin/data/csv"], ["資料作業", "/admin/data/operations"]] },
  { label: "營運", items: [["通知中心", "/admin/notifications"], ["支持與付款", "/admin/payments"], ["程式發布", "/admin/code"]] },
  { label: "治理與系統", items: [["發布記錄", "/admin/deployments"], ["Audit Log", "/admin/audit"], ["使用者與權限", "/admin/users"], ["網站設定", "/admin/settings"], ["系統狀態", "/admin/system"], ["系統資源", "/admin/system/resources"]] },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === "/admin/login") return <>{children}</>;
  const current = groups.flatMap((group) => group.items)
    .filter(([, href]) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`)))
    .sort((left, right) => right[1].length - left[1].length)[0];
  return <div className="admin-app-shell">
    <button type="button" className="admin-mobile-menu" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="admin-navigation" aria-label="開啟後台選單">☰ <span>後台選單</span></button>
    {open ? <button type="button" className="admin-sidebar-backdrop" onClick={() => setOpen(false)} aria-label="關閉後台選單" /> : null}
    <aside id="admin-navigation" className={`admin-sidebar ${open ? "is-open" : ""}`}>
      <div className="admin-sidebar-brand"><span className="admin-sidebar-mark">J</span><span><strong>全國國中升學資訊網</strong><small>管理後台</small></span><button type="button" className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="關閉選單">×</button></div>
      <nav aria-label="管理後台主選單">{groups.map((group) => <section key={group.label} className="admin-nav-group"><p>{group.label}</p>{group.items.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={current?.[1] === href ? "is-active" : ""}>{label}</Link>)}</section>)}</nav>
      <div className="admin-sidebar-footer"><Link href="/" target="_blank">查看前台 ↗</Link><Link href="/api/admin/logout">登出</Link></div>
    </aside>
    <div className="admin-workspace"><header className="admin-topbar"><div><span className="admin-breadcrumb">管理後台 <span aria-hidden="true">/</span> {current?.[0] || "總覽"}</span><strong>{current?.[0] || "總覽"}</strong></div><div className="admin-topbar-actions"><Link href="/admin/system/resources">系統資源</Link><Link href="/admin/system">系統與安全</Link></div></header><main className="admin-main">{children}</main></div>
  </div>;
}
