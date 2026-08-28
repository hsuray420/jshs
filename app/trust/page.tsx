import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SourceBadge } from "@/components/source-badge";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR, VERIFICATION_STATUS } from "@/lib/trust";

export const metadata: Metadata = { title: "信任與支援中心", description: "了解升學資料來源、更新方式、落點限制、隱私與支援服務。", alternates: { canonical: "/trust" } };

const sections = [
  ["sources", "資料來源與更新紀錄", "知道每一筆資料從哪裡來、適用哪個學年度，以及最近一次整理時間。"],
  ["status", "資料更新狀態", "查看最後更新、最後校核、資料年度、服務年度與 116 公告狀態。"],
  ["progress", "15 區建置進度", "公開顯示目前 8／15 區可使用研究規則試算，其餘區域尚未開放。"],
  ["methodology", "試算與分析方法", "說明規則資料、試算引擎、推薦分層與推估限制。"],
  ["versions", "資料版本紀錄", "查看規則與資料的更新、校核與版本脈絡。"],
  ["feedback", "評分與回饋", "分享使用體驗與建議，讓平台知道哪些地方需要改善。"],
  ["community", "使用人數展示", "查看平台服務範圍與社群參與，不把使用數字包裝成決策保證。"],
  ["report", "資料錯誤回報", "發現學校、科別、名額或來源有誤時，提供可核對的回報方式。"],
  ["voting", "社群投票互動", "參與公開議題與經驗整理，後續結果會標示資料狀態。"],
  ["stories", "在校生真實心得", "閱讀匿名整理的學習經驗，分清楚個人經驗與官方規則。"],
  ["privacy", "隱私權", "說明瀏覽器暫存、規劃資料、只讀分享與搜尋引擎的處理方式。"],
  ["terms", "服務條款", "說明資料使用範圍、官方資訊優先原則與使用者責任。"],
  ["support", "支持／合作", "支持／合作與售後：小額支持、教育合作、服務問題、退款與聯絡入口。"],
] as const;

export default function TrustPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/trust" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">資料與信任</p><h1 className="mt-3 max-w-4xl">資料越多，越需要知道它的邊界。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">這些頁面是升學決策的一部分：告訴你資料如何整理、何時更新、可以怎麼使用，以及什麼情況仍要回到官方核對。</p></div></section><TrustStatus /><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sections.map(([slug, title, body]) => <Link key={slug} href={`/trust/${slug}`} className="p-5 jshs-surface-card"><span className="jshs-chip">信任說明</span><h2 className="mt-3 text-lg">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><span className="mt-4 block text-sm text-[var(--jshs-primary)]">前往獨立頁面 →</span></Link>)}</div></section><SiteFooter /></main>;
}

function TrustStatus() {
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pt-8"><div className="grid gap-3 md:grid-cols-3"><article className="p-5 jshs-surface-card"><SourceBadge sourceType="official" /><h2 className="mt-3 text-lg">{SERVICE_YEAR} 服務年度</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前狀態：{VERIFICATION_STATUS === "awaiting_116_official_release" ? "116 正式規則待公告" : "已校核"}。</p></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="official_based_calculation" /><h2 className="mt-3 text-lg">規則來源年度</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前試算暫依 {SOURCE_ACADEMIC_YEAR} 學年度官方規則，不將來源年度改寫成 116。</p></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="jshs_estimated" /><h2 className="mt-3 text-lg">8 / 15 區可試算</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">其餘 7 區尚未完成規則建模，目前不開放試算。</p></article></div></section>;
}
