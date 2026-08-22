import Link from "next/link";
import { menuGroups } from "@/lib/site-map";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-light)] bg-white py-10 jshs-section">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <div className="flex items-center gap-3"><span className="jshs-icon-tile" aria-hidden="true">↗</span><b className="text-[var(--text-primary)]">全國國中升學資訊網</b></div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">從制度理解、校科探索到志願規劃，把升學資訊整理成下一步。</p>
          </div>
          <nav aria-label="頁尾導覽" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {menuGroups.map((group) => (
              <section key={group.label}>
                <Link href={group.href} className="font-black text-[var(--text-primary)]">{group.label}</Link>
                <div className="mt-3 grid gap-2">
                  {group.items.slice(0, group.label === "更多" ? 3 : 4).map((item) => item.available === false ? <span key={`${group.label}-${item.label}`} className="text-xs text-[var(--text-secondary)] opacity-60">{item.label} · 準備中</span> : <Link key={`${group.label}-${item.label}`} href={item.href} className="text-xs leading-5 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">{item.label}</Link>)}
                </div>
              </section>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[var(--border-light)] pt-5 text-xs text-[var(--text-secondary)] sm:flex-row">
          <span>招生資訊請以各主管機關最新公告為準。</span>
          <span>網站功能依資料校核狀態逐步開放。</span>
        </div>
      </div>
    </footer>
  );
}
