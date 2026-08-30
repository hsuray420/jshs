"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import { DonationLink } from "@/components/donation-link";
import { getDistrictLabel, readStoredDistrict, subscribeToDistrict } from "@/lib/district-context";
import { menuGroups, primaryNavigation, type MenuGroup, type MenuItem, type PrimaryNavigationItem } from "@/lib/site-map";

type NavigationTone = "school" | "score" | "planner" | "guide" | "trust";
type NavigationItem = PrimaryNavigationItem & { icon?: SiteIconName; tone?: NavigationTone };

const mobileNavigation = primaryNavigation as readonly NavigationItem[];
const navigationGroups = new Map(menuGroups.map((group) => [group.label, group]));

function districtSnapshot() { return getDistrictLabel(readStoredDistrict()); }

function flattenMenuItems(items: readonly MenuItem[]): Array<{ label: string; href: string; description: string }> {
  return items.flatMap((item) => [{ label: item.label, href: item.href, description: item.description }, ...flattenMenuItems(item.children || [])]);
}

function Brand() {
  return <Link href="/" className="jshs-brand" aria-label="全國國中升學資訊網首頁"><span className="jshs-brand-logo" aria-hidden="true"><SiteIcon name="school" size={21} /></span><span>全國國中升學資訊網</span></Link>;
}

function NavIcon({ item }: { item: NavigationItem }) { return <SiteIcon name={item.icon || "more"} size={17} />; }

function MenuDestination({ item, onNavigate, compact = false }: { item: MenuItem; onNavigate?: () => void; compact?: boolean }) {
  const className = compact ? "jshs-menu-destination rounded-xl px-3 py-2.5 text-sm" : "jshs-menu-destination rounded-2xl p-4";
  return <Link onClick={onNavigate} href={item.href} className={`${className} block`}><b className="block text-sm">{item.label}</b><span className="mt-1 block text-xs leading-5 jshs-muted-copy">{item.description}</span></Link>;
}

function GroupItems({ group, onNavigate }: { group: MenuGroup; onNavigate?: () => void }) {
  return <div className="jshs-group-items">{group.items.map((item) => item.children?.length ? <section key={item.label} className="jshs-group-subsection"><h3>{item.label}</h3><div>{item.children.map((child) => <MenuDestination key={child.label} item={child} onNavigate={onNavigate} compact />)}</div></section> : <MenuDestination key={item.label} item={item} onNavigate={onNavigate} compact />)}</div>;
}

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const districtLabel = useSyncExternalStore(subscribeToDistrict, districtSnapshot, () => "選擇就學區");
  const searchItems = useMemo(() => menuGroups.flatMap((group) => flattenMenuItems(group.items)), []);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("zh-TW");
    return needle ? searchItems.filter((item) => `${item.label} ${item.description}`.toLocaleLowerCase("zh-TW").includes(needle)).slice(0, 12) : [];
  }, [query, searchItems]);

  useEffect(() => {
    document.body.classList.toggle("jshs-nav-open", drawerOpen);
    if (!drawerOpen) return () => document.body.classList.remove("jshs-nav-open");
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => { window.clearTimeout(focusTimer); document.body.classList.remove("jshs-nav-open"); };
  }, [drawerOpen]);

  function openDrawer() { lastFocusRef.current = document.activeElement as HTMLElement | null; setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); setQuery(""); window.setTimeout(() => lastFocusRef.current?.focus(), 0); }

  return <>
    <header className="sticky top-0 z-40 w-full border-b border-[var(--jshs-border)] bg-white jshs-site-header">
      <div className="jshs-header-inner">
        <Brand />
        <nav aria-label="主要導覽" className="jshs-desktop-nav">{mobileNavigation.map((item) => {
          const group = navigationGroups.get(item.label);
          const active = activeHref === item.activeHref;
          if (item.label === "其他" && group) return <details key={item.label} className={`jshs-desktop-more is-${item.tone || "trust"}`}><summary><NavIcon item={item} /><span>{item.label}</span><SiteIcon name="chevron-down" size={14} /></summary><div><GroupItems group={group} /></div></details>;
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`is-${item.tone || "trust"} ${active ? "is-active" : ""}`}><NavIcon item={item} /><span>{item.label}</span></Link>;
        })}</nav>
        <div className="ml-auto flex shrink-0 items-center gap-2"><DonationLink className="jshs-donation-link hidden md:inline-flex">小額捐款</DonationLink><Link href="/account" className="jshs-login-link">登入</Link><button type="button" onClick={openDrawer} aria-label="開啟全站導覽" aria-expanded={drawerOpen} className="jshs-header-action jshs-header-menu-button grid place-items-center xl:hidden"><SiteIcon name="menu" size={23} /></button></div>
      </div>
    </header>

    {drawerOpen ? <div className="fixed inset-0 z-[80] bg-[var(--jshs-page)]" role="dialog" aria-modal="true" aria-label="全站導覽"><div className="mx-auto flex h-full w-[min(860px,100%)] flex-col bg-white"><div className="flex items-center justify-between border-b border-[var(--jshs-border)] px-5 py-4"><Brand /><button type="button" onClick={closeDrawer} aria-label="關閉全站導覽" className="jshs-close-action grid h-10 w-10 place-items-center"><SiteIcon name="close" size={21} /></button></div><div className="overflow-y-auto px-5 pb-24 pt-5"><Link href="/districts" onClick={closeDrawer} className="flex items-center justify-between p-4 jshs-surface-card"><span><small className="block jshs-muted-copy">目前就學區</small><b className="mt-1 block">目前：{districtLabel}</b></span><span className="flex items-center gap-1 text-sm font-black">切換<SiteIcon name="chevron-right" size={16} /></span></Link><label className="jshs-mobile-search mt-4 flex items-center gap-2 rounded-xl bg-[var(--jshs-muted-surface)] px-4"><SiteIcon name="search" size={19} /><span className="sr-only">搜尋內容與功能</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋學校、會考、志願、資格…" className="w-full border-0 bg-transparent shadow-none" /></label>{query.trim() ? <div className="mt-5 grid gap-2">{results.map((item) => <MenuDestination key={`${item.href}-${item.label}`} item={item} onNavigate={closeDrawer} />)}{!results.length ? <p className="p-4 text-sm jshs-muted-copy">找不到相符內容，試試「學校」、「超額比序」或「志願」。</p> : null}</div> : <section aria-labelledby="mobile-groups-title" className="mt-6"><div><p className="jshs-eyebrow">完整功能</p><h2 id="mobile-groups-title" className="mt-1 text-xl">依需求找工具</h2></div><div className="mt-3 grid gap-3">{mobileNavigation.map((item) => { const group = navigationGroups.get(item.label); return group ? <details key={item.label} className={`jshs-mobile-group jshs-surface-card is-${item.tone || "trust"}`}><summary><span className="jshs-icon-tile"><NavIcon item={item} /></span><span><b>{item.label}</b><small>{group.description}</small></span><SiteIcon name="chevron-down" size={18} /></summary><GroupItems group={group} onNavigate={closeDrawer} /></details> : null; })}</div></section>}</div></div></div> : null}

    <nav aria-label={`手機快速導覽：${mobileNavigation.map((item) => item.label).join("、")}`} className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--jshs-border)] bg-white px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 xl:hidden">{mobileNavigation.slice(0, 4).map((item) => <Link key={item.label} href={item.href} aria-current={activeHref === item.activeHref ? "page" : undefined} className={`jshs-mobile-nav-item is-${item.tone || "trust"} ${activeHref === item.activeHref ? "is-active" : ""}`}><NavIcon item={item} /><span>{item.label}</span></Link>)}<button type="button" onClick={openDrawer} aria-label="開啟更多功能選單" aria-expanded={drawerOpen} className={`jshs-mobile-nav-item ${drawerOpen ? "is-active" : ""}`}><SiteIcon name="menu" size={24} /><span>其他</span></button></nav>
  </>;
}
