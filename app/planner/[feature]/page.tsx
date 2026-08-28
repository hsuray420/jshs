import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PlannerVersions } from "@/components/planner-versions";
import { getMemberSession } from "../../../lib/member-auth";
import { OfficialPlatformLinks } from "@/components/official-platform-links";
import { PlannerExportWorkspace } from "@/components/planner-export-workspace";

const pages: Record<string, SupportPage> = {
  versions: { eyebrow: "我的志願", title: "版本紀錄", description: "保留每次志願調整的決策脈絡，方便和家人一起回看。", sections: [{ title: "目前保存", body: "每次新增、刪除或移動志願時，系統會保存可查看與恢復的快照。" }, { title: "比較方式", body: "打開舊版本即可查看當時的學校順序與選擇理由，必要時恢復該版本。" }], action: { label: "回到我的志願", href: "/planner" } },
  export: { eyebrow: "我的志願", title: "列印／下載", description: "把目前志願清單整理成家庭討論或送出前的檢查資料。", sections: [{ title: "可下載摘要", body: "可直接列印、下載 PDF 或下載文字摘要。" }, { title: "送出前提醒", body: "正式選填仍須前往當年度招生單位指定平台，本站清單不等於正式送出。" }], action: { label: "回到我的志願", href: "/planner" } },
  "official-platform": { eyebrow: "正式選填", title: "志願選填平台連結", description: "前往當年度招生單位指定的正式選填平台。", sections: [{ title: "使用前確認", body: "請先確認就學區、學年度與登入身分，並以招生委員會公告的正式網址為準。" }, { title: "本站的角色", body: "本站協助試算與整理志願，不代替官方平台的資格審查、志願送出或結果公告。" }], action: { label: "查看官方來源", href: "/trust/sources" } },
};
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((feature) => ({ feature })); }
export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> { const { feature } = await params; const page = pages[feature]; return page ? { title: `${page.title}｜我的志願`, description: page.description, alternates: { canonical: `/planner/${feature}` }, robots: { index: false, follow: false } } : {}; }
export default async function PlannerFeaturePage({ params }: { params: Promise<{ feature: string }> }) { const { feature } = await params; const page = pages[feature]; if (!page) return null; const member = await getMemberSession(); return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/planner" />{feature === "versions" ? <><IndependentSupportPage page={page} /><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="p-6 jshs-surface-card"><PlannerVersions isMember={Boolean(member)} /></div></section></> : feature === "export" ? <><IndependentSupportPage page={page} /><PlannerExportWorkspace isMember={Boolean(member)} /></> : feature === "official-platform" ? <><IndependentSupportPage page={page} /><OfficialPlatformLinks /></> : <IndependentSupportPage page={page} />}<SiteFooter /></main>; }
