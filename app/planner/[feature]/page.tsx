import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pages: Record<string, SupportPage> = {
  check: { eyebrow: "我的志願", title: "排序與健檢", description: "確認志願順序、三層分布與送出前需要補的資料。", sections: [{ title: "健檢原則", body: "每份志願都應包含願意就讀的選項，並同時檢查挑戰、穩定與保底分布。" }, { title: "開始調整", body: "你可以用系統推薦快速建立清單，也可以在自選排序頁逐一加入學校並上下移動。" }], action: { label: "前往自選排序", href: "/planner/custom" } },
  versions: { eyebrow: "我的志願", title: "版本紀錄", description: "保留每次志願調整的決策脈絡，方便和家人一起回看。", sections: [{ title: "目前保存", body: "登入後的志願清單會保存於會員規劃中；每次調整前可先下載摘要留存。" }, { title: "比較方式", body: "將不同階段下載的摘要放在一起，可以看見學校順序與選擇理由的變化。" }], action: { label: "回到我的志願", href: "/planner" } },
  export: { eyebrow: "我的志願", title: "列印／下載", description: "把目前志願清單整理成家庭討論或送出前的檢查資料。", sections: [{ title: "下載摘要", body: "自選排序頁會顯示目前的志願順序，可使用瀏覽器列印功能另存為 PDF。" }, { title: "送出前提醒", body: "正式選填仍須前往當年度招生單位指定平台，本站清單不等於正式送出。" }], action: { label: "回到我的志願", href: "/planner" } },
  "official-platform": { eyebrow: "正式選填", title: "志願選填平台連結", description: "前往當年度招生單位指定的正式選填平台。", sections: [{ title: "使用前確認", body: "請先確認就學區、學年度與登入身分，並以招生委員會公告的正式網址為準。" }, { title: "本站的角色", body: "本站協助試算與整理志願，不代替官方平台的資格審查、志願送出或結果公告。" }], action: { label: "查看官方來源", href: "/trust/sources" } },
};
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((feature) => ({ feature })); }
export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> { const { feature } = await params; const page = pages[feature]; return page ? { title: `${page.title}｜我的志願`, description: page.description, alternates: { canonical: `/planner/${feature}` }, robots: { index: false, follow: false } } : {}; }
export default async function PlannerFeaturePage({ params }: { params: Promise<{ feature: string }> }) { const { feature } = await params; const page = pages[feature]; if (!page) return null; return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/planner" /><IndependentSupportPage page={page} /><SiteFooter /></main>; }
