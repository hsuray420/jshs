import Link from "next/link";
import { PageContainer } from "@/components/ui/layout";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { SERVICE_YEAR } from "@/lib/trust";

const footerGroups = [
  { title: "快速入口", links: [["找學校", "/schools"], ["算成績", "/tools"], ["我的志願", "/planner"], ["升學日程", "/schedule"], ["官方資訊", "/admission-guides"]] },
  { title: "資料與信任", links: [["資料來源", "/trust/sources"], ["資料更新狀態", "/trust/status"], ["15 區建置進度", "/trust/progress"], ["錯誤回報", "/trust/report"], ["平台可信度說明", "/trust/credibility"]] },
  { title: "平台", links: [["關於 JSHS", "/trust/credibility"], ["小額捐款", "/support"], ["贊助我們", "/support"], ["聯絡我們", "mailto:jshs.contact@gmail.com"], ["服務狀態", "/trust/status"]] },
  { title: "法律", links: [["隱私權政策", "/trust/privacy"], ["服務條款", "/trust/terms"], ["Cookie／資料使用說明", "/trust/credibility"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-light)] bg-white py-10 jshs-section">
      <PageContainer>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <div className="flex items-center gap-3"><span className="jshs-icon-tile" aria-hidden="true">↗</span><b className="text-[var(--text-primary)]">JSHS.CC</b></div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">從制度理解、校科探索到志願規劃，把升學資訊整理成下一步。</p>
          </div>
          <nav aria-label="頁尾導覽" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {footerGroups.map((group) => (
              <section key={group.title}>
                <h2 className="text-sm font-black text-[var(--text-primary)]">{group.title}</h2>
                <div className="mt-3 grid gap-2">
                  {group.links.map(([label, href]) => href.startsWith("mailto:") ? <a key={label} href={href} className="text-xs leading-5 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">{label}</a> : <Link key={label} href={href} className="text-xs leading-5 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">{label}</Link>)}
                </div>
              </section>
            ))}
          </nav>
        </div>
        <div className="mt-10 grid gap-2 border-t border-[var(--border-light)] pt-5 text-xs leading-5 text-[var(--text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
          <span>JSHS.CC</span>
          <span>{SERVICE_YEAR} 學年度升學資訊</span>
          <span>資料最後更新：{districtMetadata.updatedAt}</span>
          <span>15 個就學區皆可試算與填志願</span>
        </div>
        <p className="mt-3 max-w-4xl text-xs leading-6 text-[var(--text-secondary)]">JSHS 提供資訊整理與輔助工具，不取代教育主管機關、招生委員會及學校正式公告。</p>
      </PageContainer>
    </footer>
  );
}
