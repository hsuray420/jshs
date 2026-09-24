"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SiteIcon } from "@/components/site-icons";
import { NavDropdown, NavMegaMenuItem, NavMobileAccordion, type NavigationItem } from "@/components/navigation/mega-menu";
import { getDistrictLabel, readStoredDistrict, subscribeToDistrict } from "@/lib/district-context";
import { menuGroups, primaryNavigation } from "@/lib/site-map";
import { searchSite } from "@/lib/search-index";

const mobileNavigation = primaryNavigation as readonly NavigationItem[];
const navigationGroups = new Map(menuGroups.map((group) => [group.label, group]));
function districtSnapshot() { return getDistrictLabel(readStoredDistrict()); }

function Brand() {
  return <Link href="/" className="jshs-brand" aria-label="全國國中生選資訊網首頁"><span className="jshs-brand-logo" aria-hidden="true"><SiteIcon name="school" size={21} /></span><span className="jshs-brand-wordmark"><strong>全國國中生選資訊網</strong></span></Link>;
}

function NavIcon({ item }: { item: NavigationItem }) { return <SiteIcon name={item.icon || "more"} size={17} />; }

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [memberName, setMemberName] = useState<string | null>(null);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const districtLabel = useSyncExternalStore(subscribeToDistrict, districtSnapshot, () => "選擇就學區");
  const results = useMemo(() => searchSite(query, 12), [query]);
  const desktopNavigation = useMemo(() => mobileNavigation, []);

  useEffect(() => {
    document.body.classList.toggle("jshs-nav-open", drawerOpen);
    if (!drawerOpen) return () => document.body.classList.remove("jshs-nav-open");
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => { window.clearTimeout(focusTimer); document.body.classList.remove("jshs-nav-open"); };
  }, [drawerOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/session", { cache: "no-store", headers: { accept: "application/json" } })
      .then(response => response.ok ? response.json() as Promise<{ authenticated?: boolean; displayName?: string }> : null)
      .then(payload => { if (!cancelled && payload?.authenticated) setMemberName(payload.displayName || "LINE 使用者"); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (desktopNavRef.current?.contains(event.target as Node)) return;
      closeDesktopMenus();
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeDesktopMenus();
    }
    function closeForAi() { closeDesktopMenus(); }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("jshs:ai-open", closeForAi);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("jshs:ai-open", closeForAi);
    };
  }, []);

  function openDrawer() { lastFocusRef.current = document.activeElement as HTMLElement | null; setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); setQuery(""); window.setTimeout(() => lastFocusRef.current?.focus(), 0); }
  function closeDesktopMenus() { setOpenDesktopMenu(null); }
  function keepSingleDesktopMenu(label: string) {
    const willOpen = openDesktopMenu !== label;
    setOpenDesktopMenu(willOpen ? label : null);
    if (!willOpen) return;
    document.dispatchEvent(new Event("jshs:nav-open"));
  }

  return <>
    <header className="sticky top-0 z-40 w-full border-b border-[var(--jshs-border)] bg-white jshs-site-header">
      <div className="jshs-header-inner">
        <Brand />
        <nav ref={desktopNavRef} aria-label="主要導覽" className="jshs-desktop-nav">{desktopNavigation.map((item) => {
          const group = navigationGroups.get(item.label);
          const active = activeHref === item.activeHref;
          return group ? <NavDropdown key={item.label} item={item} group={group} active={active} open={openDesktopMenu === item.label} onToggle={() => keepSingleDesktopMenu(item.label)} onNavigate={closeDesktopMenus} /> : null;
        })}</nav>
        <div className="jshs-header-utilities"><Link href="/search" aria-label="搜尋網站" className="jshs-home-header-search"><SiteIcon name="search" size={19} /></Link><Link href="/account" aria-label="帳號" className="jshs-login-link"><SiteIcon name="account" size={18} /><span>{memberName || "登入"}</span></Link><button type="button" onClick={openDrawer} aria-label="開啟全站導覽" aria-expanded={drawerOpen} className="jshs-header-action jshs-header-menu-button grid place-items-center xl:hidden"><SiteIcon name="menu" size={23} /></button></div>
      </div>
    </header>

    {drawerOpen ? <div className="fixed inset-0 z-[80] bg-[var(--jshs-page)]" role="dialog" aria-modal="true" aria-label="全站導覽"><div className="mx-auto flex h-full w-[min(860px,100%)] flex-col bg-white"><div className="flex items-center justify-between border-b border-[var(--jshs-border)] px-5 py-4"><Brand /><button type="button" onClick={closeDrawer} aria-label="關閉全站導覽" className="jshs-close-action grid h-10 w-10 place-items-center"><SiteIcon name="close" size={21} /></button></div><div className="overflow-y-auto px-5 pb-24 pt-5"><Link href="/districts" onClick={closeDrawer} className="flex items-center justify-between p-4 jshs-surface-card"><span><small className="block jshs-muted-copy">目前就學區</small><b className="mt-1 block">目前：{districtLabel}</b></span><span className="flex items-center gap-1 text-sm font-black">切換<SiteIcon name="chevron-right" size={16} /></span></Link><form action="/search" method="get" className="mt-4"><label className="jshs-mobile-search flex items-center gap-2 rounded-xl bg-[var(--jshs-muted-surface)] px-4"><SiteIcon name="search" size={19} /><span className="sr-only">搜尋內容與功能</span><input ref={searchRef} name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋學校、會考、志願、資格…" className="w-full border-0 bg-transparent shadow-none" /></label></form>{query.trim() ? <div className="mt-5 grid gap-2">{results.map((item) => <NavMegaMenuItem key={item.id} item={{ label: item.title, href: item.href, description: `${item.category} · ${item.body}` }} onNavigate={closeDrawer} mobile theme="trust" />)}<Link href={`/search?q=${encodeURIComponent(query.trim())}`} onClick={closeDrawer} className="p-4 text-sm font-bold text-[var(--jshs-primary)] jshs-surface-card">查看完整搜尋結果 →</Link>{!results.length ? <p className="p-4 text-sm jshs-muted-copy">找不到相符內容，試試「中投志願序」、「超額比序」、「資訊科」或「官方簡章」。</p> : null}</div> : <section aria-labelledby="mobile-groups-title" className="mt-6"><div><p className="jshs-eyebrow">完整功能</p><h2 id="mobile-groups-title" className="mt-1 text-xl">依需求找工具</h2><p className="mt-1 text-sm jshs-muted-copy">桌機與手機使用相同七個主分類；往下即可直接查看每個功能。</p></div><div className="mt-4 grid gap-5">{mobileNavigation.map((item) => { const group = navigationGroups.get(item.label); return group ? <NavMobileAccordion key={item.label} item={item} group={group} onNavigate={closeDrawer} /> : null; })}</div></section>}</div></div></div> : null}

    <nav aria-label={`手機快速導覽：${mobileNavigation.map((item) => item.label).join("、")}`} className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--jshs-border)] bg-white px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 xl:hidden">{mobileNavigation.slice(0, 4).map((item) => <Link key={item.label} href={item.href} aria-current={activeHref === item.activeHref ? "page" : undefined} className={`jshs-mobile-nav-item is-${item.tone || "trust"} ${activeHref === item.activeHref ? "is-active" : ""}`}><NavIcon item={item} /><span>{item.label}</span></Link>)}<button type="button" onClick={openDrawer} aria-label="開啟更多功能選單" aria-expanded={drawerOpen} className={`jshs-mobile-nav-item ${drawerOpen ? "is-active" : ""}`}><SiteIcon name="menu" size={24} /><span>其他</span></button></nav>
  </>;
}
