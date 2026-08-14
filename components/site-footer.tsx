import Link from "next/link";
import { primaryNavigation } from "@/lib/site-map";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-9">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-6 text-sm text-slate-500 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <b className="text-[#14213d]">JSHS 全國國中升學資訊網</b>
        <nav aria-label="頁尾導覽" className="flex flex-wrap gap-x-5 gap-y-3 font-bold">
          {primaryNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <span className="lg:text-right">招生資訊請以各主管機關最新公告為準。</span>
      </div>
    </footer>
  );
}
