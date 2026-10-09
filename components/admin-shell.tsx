"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type AdminNavItem = readonly [label: string, href: string];
type AdminNavGroup = { label: string; items: readonly AdminNavItem[] };

/**
 * Technical / DevOps Console navigation groups
 */
const techGroups: readonly AdminNavGroup[] = [
  {
    label: "運維總覽",
    items: [
      ["技術運維總覽", "/admin/system"],
      ["系統資源與 D1", "/admin/system/resources"],
    ],
  },
  {
    label: "版本與部署",
    items: [
      ["發布與部署紀錄", "/admin/deployments"],
      ["原始碼與檔案檢視", "/admin/code"],
    ],
  },
  {
    label: "安全與治理",
    items: [
      ["Audit Log", "/admin/audit"],
      ["人員與權限 (RBAC)", "/admin/users"],
      ["贊助與金流密鑰", "/admin/payments"],
      ["網站全域設定", "/admin/settings"],
    ],
  },
] as const;

/**
 * Business / Operations Console navigation groups
 */
const businessGroups: readonly AdminNavGroup[] = [
  {
    label: "工作台",
    items: [
      ["業務營運總覽", "/admin"],
    ],
  },
  {
    label: "升學數據中心",
    items: [
      ["學校資料主檔 (545所)", "/admin/schools"],
      ["熱門學校推薦", "/admin/schools/popular"],
      ["15 區招生與健康度", "/admin/data"],
      ["15 區 CSV 原始檔", "/admin/data/csv"],
      ["校園相片與媒體", "/admin/media"],
      ["前台鏡像編輯", "/admin/editor"],
      ["相容資料作業", "/admin/data/operations"],
    ],
  },
  {
    label: "審核與互動",
    items: [
      ["資料勘誤回報", "/admin/data/reports"],
      ["學校評論審核", "/admin/data/reviews"],
    ],
  },
  {
    label: "內容與行銷",
    items: [
      ["升學專題與指南", "/admin/content"],
      ["通知與推播中心", "/admin/notifications"],
    ],
  },
] as const;

const TECH_ROOTS = [
  "/admin/system",
  "/admin/deployments",
  "/admin/code",
  "/admin/audit",
  "/admin/users",
  "/admin/payments",
  "/admin/settings",
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const isTechConsole = TECH_ROOTS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const activeGroups = isTechConsole ? techGroups : businessGroups;
  const allGroups = [...businessGroups, ...techGroups];

  const current = allGroups
    .flatMap((group) => group.items)
    .filter(([, href]) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`)))
    .sort((left, right) => right[1].length - left[1].length)[0];
  return (
    <div className={`admin-app-shell ${isTechConsole ? "admin-tech-theme" : "admin-biz-theme"}`}>
      <button
        type="button"
        className="admin-mobile-menu"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="admin-navigation"
        aria-label="開啟後台選單"
      >
        ☰ <span>{isTechConsole ? "技術選單" : "業務選單"}</span>
      </button>

      {open ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="關閉後台選單"
        />
      ) : null}

      <aside id="admin-navigation" className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <span className={`admin-sidebar-mark ${isTechConsole ? "is-tech" : ""}`}>
            {isTechConsole ? "⚙" : "J"}
          </span>
          <div>
            <strong>全國國中升學資訊網</strong>
            <small>{isTechConsole ? "技術運維後台 (Technical)" : "業務營運後台 (Business)"}</small>
          </div>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="關閉選單"
          >
            ×
          </button>
        </div>

        {/* Dual Console Switcher */}
        <div className="admin-console-switcher" role="tablist" aria-label="後台模式切換">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className={`admin-console-tab ${!isTechConsole ? "is-active" : ""}`}
            title="切換至業務營運後台"
          >
            <span className="admin-tab-icon">💼</span>
            <span>業務後台</span>
          </Link>
          <Link
            href="/admin/system"
            onClick={() => setOpen(false)}
            className={`admin-console-tab ${isTechConsole ? "is-active" : ""}`}
            title="切換至技術運維後台"
          >
            <span className="admin-tab-icon">⚙️</span>
            <span>技術後台</span>
          </Link>
        </div>

        <nav aria-label={isTechConsole ? "技術運維主選單" : "業務營運主選單"}>
          {activeGroups.map((group) => (
            <section key={group.label} className="admin-nav-group">
              <p>{group.label}</p>
              {group.items.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={current?.[1] === href ? "is-active" : ""}
                >
                  {label}
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-console-switch">
            {isTechConsole ? (
              <Link href="/admin" onClick={() => setOpen(false)} className="admin-console-switch-link">
                💼 前往業務營運後台 →
              </Link>
            ) : (
              <Link href="/admin/system" onClick={() => setOpen(false)} className="admin-console-switch-link">
                ⚙️ 前往技術運維後台 →
              </Link>
            )}
          </div>
          <Link href="/" target="_blank">查看前台 ↗</Link>
          <Link href="/api/admin/logout">登出</Link>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">
              全國國中升學資訊網／{isTechConsole ? "技術運維後台" : "業務營運後台"}
            </span>
            <strong>{current?.[0] || (isTechConsole ? "技術運維總覽" : "業務營運總覽")}</strong>
          </div>
          <div className="admin-topbar-actions">
            <span className={`admin-mode-pill ${isTechConsole ? "is-tech" : "is-biz"}`}>
              {isTechConsole ? "⚙️ 技術運維模式" : "💼 業務營運模式"}
            </span>
            {isTechConsole ? (
              <Link href="/admin" className="admin-switch-mode-btn">
                切換至業務後台 💼
              </Link>
            ) : (
              <Link href="/admin/system" className="admin-switch-mode-btn">
                切換至技術後台 ⚙️
              </Link>
            )}
            <Link href="/" target="_blank" className="admin-topbar-link">
              前台 ↗
            </Link>
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}


