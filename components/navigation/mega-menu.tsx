"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import type { MenuGroup, MenuItem, PrimaryNavigationItem } from "@/lib/site-map";

export type NavigationItem = PrimaryNavigationItem & { icon?: SiteIconName; tone?: string };
type MenuSection = Readonly<{ label?: string; items: readonly MenuItem[] }>;

export function groupMenuSections(group: MenuGroup): readonly MenuSection[] {
  const sections: MenuSection[] = [];
  for (const item of group.items) {
    if (item.children?.length) {
      sections.push({ label: item.label, items: item.children });
      continue;
    }
    const label = item.section || undefined;
    const previous = sections.at(-1);
    if (previous && previous.label === label) {
      sections[sections.length - 1] = { ...previous, items: [...previous.items, item] };
    } else {
      sections.push({ label, items: [item] });
    }
  }
  return sections;
}

export function NavMegaMenuItem({ item, onNavigate, mobile = false }: { item: MenuItem; onNavigate?: () => void; mobile?: boolean }) {
  return <Link href={item.href} onClick={onNavigate} role="menuitem" className={`jshs-nav-mega-item${mobile ? " is-mobile" : ""}`}>
    {item.icon ? <span className="jshs-nav-mega-icon" aria-hidden="true"><SiteIcon name={item.icon as SiteIconName} size={20} /></span> : <span className="jshs-nav-mega-icon-placeholder" aria-hidden="true" />}
    <span className="jshs-nav-mega-item-copy"><b>{item.label}</b><span>{item.description}</span></span>
    <SiteIcon name="chevron-right" size={16} className="jshs-nav-mega-chevron" />
  </Link>;
}

export function NavDropdownHeader({ group }: { group: MenuGroup }) {
  return <header className="jshs-nav-mega-header">
    <h2>{group.eyebrow}</h2>
    <p>{group.description}</p>
  </header>;
}

export function NavDropdownSection({ section, onNavigate, mobile = false }: { section: MenuSection; onNavigate?: () => void; mobile?: boolean }) {
  return <section className="jshs-nav-mega-section">
    {section.label ? <h3>{section.label}</h3> : null}
    <div className="jshs-nav-mega-section-items">{section.items.map((item) => <NavMegaMenuItem key={item.label} item={item} onNavigate={onNavigate} mobile={mobile} />)}</div>
  </section>;
}

export function NavDropdownGrid({ group, onNavigate, mobile = false }: { group: MenuGroup; onNavigate?: () => void; mobile?: boolean }) {
  return <div className={`jshs-nav-mega-grid${mobile ? " is-mobile" : ""}`}>{groupMenuSections(group).map((section, index) => <NavDropdownSection key={`${section.label || "items"}-${index}`} section={section} onNavigate={onNavigate} mobile={mobile} />)}</div>;
}

export function NavDropdownFooter({ group, onNavigate }: { group: MenuGroup; onNavigate?: () => void }) {
  return <footer className="jshs-nav-mega-footer"><Link href={group.href} onClick={onNavigate}>查看全部{group.label}<SiteIcon name="chevron-right" size={16} /></Link></footer>;
}

export function NavDropdown({ item, group, active, onToggle, onNavigate }: { item: NavigationItem; group: MenuGroup; active: boolean; onToggle: (menu: HTMLDetailsElement) => void; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = `jshs-nav-mega-${item.label}`;

  function positionPanel() {
    const details = detailsRef.current;
    const panel = panelRef.current;
    if (!details || !panel || !details.open) return;
    const trigger = details.getBoundingClientRect();
    const width = panel.getBoundingClientRect().width;
    const padding = 24;
    const left = Math.max(padding, Math.min(window.innerWidth - width - padding, trigger.left + trigger.width / 2 - width / 2));
    setPanelStyle({ left: `${left - trigger.left}px`, right: "auto" });
  }

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(positionPanel);
    window.addEventListener("resize", positionPanel);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", positionPanel); };
  }, [open]);

  return <details ref={detailsRef} name="jshs-desktop-nav" className={`jshs-desktop-more jshs-nav-dropdown ${active || open ? "is-active" : ""}`} onToggle={(event) => { const menu = event.currentTarget; setOpen(menu.open); onToggle(menu); }}>
    <summary aria-label={`${item.label}，展開副選單`} aria-haspopup="menu" aria-expanded={open} aria-controls={panelId}><SiteIcon name={item.icon || "more"} size={17} /><span>{item.label}</span><SiteIcon name="chevron-down" size={14} /></summary>
    <div ref={panelRef} id={panelId} role="menu" style={panelStyle} className="jshs-nav-mega-panel">
      <NavDropdownHeader group={group} />
      <NavDropdownGrid group={group} onNavigate={onNavigate} />
      <NavDropdownFooter group={group} onNavigate={onNavigate} />
    </div>
  </details>;
}

export function NavMobileAccordion({ item, group, onNavigate }: { item: NavigationItem; group: MenuGroup; onNavigate: () => void }) {
  return <details className="jshs-mobile-group jshs-nav-mobile-accordion" open={item.label === "找學校"}>
    <summary className="jshs-mobile-group-heading"><span className="jshs-nav-mobile-icon" aria-hidden="true"><SiteIcon name={item.icon || "more"} size={19} /></span><span><b>{item.label}</b><small>{group.description}</small></span><SiteIcon name="chevron-down" size={17} /></summary>
    <div className="jshs-nav-mobile-body"><NavDropdownGrid group={group} onNavigate={onNavigate} mobile /><NavDropdownFooter group={group} onNavigate={onNavigate} /></div>
  </details>;
}
