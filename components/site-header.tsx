import Link from "next/link";
import { primaryNavigation } from "@/lib/site-map";

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  return (
    <header className="relative z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4 py-4">
        <Link className="flex min-w-0 items-center gap-2.5 font-black tracking-tight text-[#14213d]" href="/">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#173d78] text-lg text-white">↗</span>
          <span className="truncate">全國國中升學資訊網</span>
        </Link>

        <nav aria-label="主要導覽" className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-3 py-2 text-sm font-extrabold transition ${active ? "bg-blue-50 text-[#173d78]" : "text-slate-500 hover:bg-slate-50 hover:text-[#173d78]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <details className="group relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-[#173d78] marker:content-none">
            導覽選單
          </summary>
          <nav aria-label="行動版主要導覽" className="absolute right-0 mt-2 grid min-w-48 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-blue-950/15">
            {primaryNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.href === activeHref ? "page" : undefined}
                className={`rounded-xl px-4 py-3 text-sm font-extrabold ${item.href === activeHref ? "bg-blue-50 text-[#173d78]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
