"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getDistrictLabel, readStoredDistrict, subscribeToDistrict } from "@/lib/district-context";
import { menuGroups, type MenuGroup, type MenuItem } from "@/lib/site-map";

const finalNavigationLabels = ["查學校", "算成績", "時間日程", "我的志願", "特殊資格", "升學知識", "更多"] as const;
const quickActions = [
  { label: "查學校", href: "/schools", icon: "校" },
  { label: "算成績", href: "/tools", icon: "算" },
  { label: "看日程", href: "/schedule", icon: "日" },
  { label: "我的志願", href: "/planner", icon: "志" },
] as const;

function notificationSnapshot() {
  const value = Number(window.localStorage.getItem("jshs_notification_count") || "0");
  return Number.isFinite(value) ? value : 0;
}

function subscribeToNotifications(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function districtSnapshot() {
  return getDistrictLabel(readStoredDistrict());
}

function flattenMenuItems(items: readonly MenuItem[]): Array<{ label: string; href: string; description: string }> {
  return items.flatMap((item) => [
    { label: item.label, href: item.href, description: item.description },
    ...flattenMenuItems(item.children || []),
  ]);
}

function MenuDestination({ item, onNavigate, compact = false }: { item: MenuItem; onNavigate?: () => void; compact?: boolean }) {
  const className = compact
    ? "rounded-2xl px-3 py-2.5 text-sm hover:bg-[var(--jshs-muted-surface)]"
    : "rounded-2xl p-4 hover:bg-[var(--jshs-muted-surface)]";
  return <Link onClick={onNavigate} href={item.href} className={`${className} block`}><b className="block text-sm text-[var(--jshs-primary)]">{item.label}</b><span className="mt-1 block text-xs leading-5 jshs-muted-copy">{item.description}</span></Link>;
}

function GroupMenu({ group, onClose }: { group: MenuGroup; onClose: () => void }) {
  if (group.label === "更多") return <div className="absolute right-0 top-[calc(100%-2px)] z-50 w-[min(940px,calc(100vw-28px))] p-5 jshs-surface-card"><MenuHeader group={group} /><div className="mt-4 grid max-h-[min(600px,calc(100vh-160px))] gap-4 overflow-y-auto md:grid-cols-4">{group.items.map((section) => <section key={section.label} className="rounded-3xl bg-[var(--jshs-muted-surface)] p-2"><div className="px-3 pb-2 pt-2"><b className="text-sm text-[var(--jshs-primary)]">{section.label}</b><span className="mt-1 block text-xs leading-5 jshs-muted-copy">{section.description}</span></div>{section.children?.map((item) => <MenuDestination key={item.label} item={item} onNavigate={onClose} compact />)}</section>)}</div></div>;
  return <div className="absolute left-1/2 top-[calc(100%-2px)] z-50 w-[min(760px,calc(100vw-28px))] -translate-x-1/2 p-5 jshs-surface-card"><MenuHeader group={group} /><div className="mt-3 grid max-h-[min(520px,calc(100vh-160px))] grid-cols-2 gap-2 overflow-y-auto">{group.items.map((item) => <MenuDestination key={item.label} item={item} onNavigate={onClose} />)}</div></div>;
}

function MenuHeader({ group }: { group: MenuGroup }) {
  return <div className="border-b border-[var(--jshs-border)] pb-4"><p className="jshs-eyebrow">{group.eyebrow}</p><p className="mt-2 max-w-2xl text-sm leading-6 jshs-muted-copy">{group.description}</p></div>;
}

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const notifications = useSyncExternalStore(subscribeToNotifications, notificationSnapshot, () => 0);
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const districtLabel = useSyncExternalStore(subscribeToDistrict, districtSnapshot, () => "選擇就學區");
  const searchItems = useMemo(() => menuGroups.flatMap((group) => flattenMenuItems(group.items)), []);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("zh-TW");
    if (!needle) return [];
    return searchItems.filter((item) => `${item.label} ${item.description}`.toLocaleLowerCase("zh-TW").includes(needle)).slice(0, 12);
  }, [query, searchItems]);

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) setOpenGroup(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpenGroup(null); setDrawerOpen(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);

  useEffect(() => { document.body.classList.toggle("jshs-nav-open", drawerOpen); return () => document.body.classList.remove("jshs-nav-open"); }, [drawerOpen]);

  function closeDrawer() { setDrawerOpen(false); setQuery(""); }

  return <>
    <header ref={headerRef} className="sticky top-0 z-40 w-full border-b border-[var(--jshs-border)] bg-white/95 shadow-sm backdrop-blur jshs-site-header">
      <div className="mx-auto flex min-h-16 w-[min(1240px,calc(100%-24px))] items-center gap-2 px-1">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-black text-[var(--jshs-ink)]"><span className="jshs-icon-tile shrink-0" aria-hidden="true">↗</span><span className="truncate text-xs sm:text-base">全國國中升學資訊網</span></Link>
        <nav aria-label="主要導覽" className="ml-auto hidden h-16 items-stretch xl:flex">{menuGroups.map((group) => { const open = openGroup === group.label; const active = activeHref === group.activeHref; return <div key={group.label} className="relative flex items-center"><button type="button" aria-expanded={open} aria-controls={`menu-${group.label}`} onClick={() => setOpenGroup(open ? null : group.label)} className={`flex h-11 items-center gap-1 px-3 text-sm font-black jshs-button ${active || open ? "bg-[var(--jshs-brand-tint)] text-[var(--jshs-primary)]" : "text-[var(--jshs-muted)]"}`}>{group.label}<span aria-hidden="true">⌄</span></button>{open ? <GroupMenu group={group} onClose={() => setOpenGroup(null)} /> : null}</div>; })}</nav>
        <div className="ml-auto flex items-center gap-1 xl:ml-2">
          <Link href="/notifications" aria-label={`通知${notifications ? `，${notifications} 則未讀` : ""}`} className="relative grid h-10 w-10 place-items-center rounded-full text-lg text-[var(--jshs-primary)] hover:bg-[var(--jshs-muted-surface)]">♧{notifications ? <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--jshs-danger)] px-1 text-[10px] text-white">{notifications > 9 ? "9+" : notifications}</span> : null}</Link>
          <Link href="/account" aria-label="帳號" className="grid h-10 w-10 place-items-center rounded-full text-lg text-[var(--jshs-primary)] hover:bg-[var(--jshs-muted-surface)]">♙</Link>
          <Link href="/districts" className="hidden max-w-32 truncate rounded-full bg-[var(--jshs-muted-surface)] px-3 py-2 text-xs font-black text-[var(--jshs-primary)] md:block">目前：{districtLabel} ▾</Link>
          <button type="button" onClick={() => { setDrawerOpen(true); window.setTimeout(() => searchRef.current?.focus(), 80); }} aria-label="全站搜尋" className="grid h-10 w-10 place-items-center rounded-full text-lg text-[var(--jshs-primary)] hover:bg-[var(--jshs-muted-surface)]">⌕</button>
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="開啟全站導覽" aria-expanded={drawerOpen} className="grid h-10 w-10 place-items-center rounded-full text-lg text-[var(--jshs-primary)] xl:hidden">☰</button>
        </div>
      </div>
    </header>

    {drawerOpen ? <div className="fixed inset-0 z-[80] bg-[var(--jshs-page)]" role="dialog" aria-modal="true" aria-label="全站導覽"><div className="mx-auto flex h-full w-[min(860px,100%)] flex-col bg-white"><div className="flex items-center justify-between border-b border-[var(--jshs-border)] px-5 py-4"><div><p className="jshs-eyebrow">全站導覽</p><b className="mt-1 block text-lg">選擇你現在要完成的事</b></div><button type="button" onClick={closeDrawer} aria-label="關閉全站導覽" className="grid h-10 w-10 place-items-center text-2xl">×</button></div><div className="overflow-y-auto px-5 pb-24 pt-5"><Link href="/districts" onClick={closeDrawer} className="flex items-center justify-between p-4 jshs-surface-card"><span><small className="block jshs-muted-copy">目前就學區</small><b className="mt-1 block text-[var(--jshs-primary)]">目前：{districtLabel}</b></span><span>切換 →</span></Link><label className="mt-4 block"><span className="sr-only">搜尋內容與功能</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="全站搜尋：學校、會考、志願、資格…" className="w-full" /></label>{query.trim() ? <div className="mt-5 grid gap-2">{results.map((item) => <MenuDestination key={`${item.href}-${item.label}`} item={item} onNavigate={closeDrawer} />)}{!results.length ? <p className="p-4 text-sm jshs-muted-copy">找不到相符內容，試試「學校」、「超額比序」或「志願」。</p> : null}</div> : <><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{quickActions.map((item) => <Link key={item.label} href={item.href} onClick={closeDrawer} className="p-4 jshs-surface-card"><span className="jshs-icon-tile">{item.icon}</span><b className="mt-2 block text-sm">{item.label}</b></Link>)}</div><div className="mt-6 grid gap-2">{menuGroups.map((group) => <details key={group.label} className="p-4 jshs-surface-card"><summary className="cursor-pointer font-black text-[var(--jshs-primary)]">{group.label}<span className="ml-2 text-xs jshs-muted-copy">{group.description}</span></summary><div className="mt-3 grid gap-1 border-t border-[var(--jshs-border)] pt-2">{group.items.flatMap((item) => item.children?.length ? item.children.map((child) => <MenuDestination key={`${item.label}-${child.label}`} item={child} onNavigate={closeDrawer} compact />) : [<MenuDestination key={item.label} item={item} onNavigate={closeDrawer} compact />])}</div></details>)}</div></>}</div></div></div> : null}

    <nav aria-label="手機快速導覽" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--jshs-border)] bg-white px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 xl:hidden">{[{ label: "首頁", href: "/" }, ...quickActions].map((item) => <Link key={item.label} href={item.href} aria-current={activeHref === item.href ? "page" : undefined} className="flex min-h-14 flex-col items-center justify-center text-[11px] font-black text-[var(--jshs-muted)]">{item.label}</Link>)}</nav>
    <span className="sr-only" aria-hidden="true">{finalNavigationLabels.join("、")}</span>
  </>;
}
