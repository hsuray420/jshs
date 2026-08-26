import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pages: Record<string, SupportPage> = {
  data: { eyebrow: "帳號與資料", title: "匯入／匯出資料", description: "把目前瀏覽器保存的偏好與進度帶走。", sections: [{ title: "匯出", body: "帳號中心可匯出以 JSHS 開頭保存的本機資料，不包含密碼或第三方帳號資料。" }, { title: "資料安全", body: "匯出的檔案請自行妥善保存；LINE 身分與會員工作階段不會放入匯出內容。" }], action: { label: "回到帳號中心", href: "/account" } },
  teacher: { eyebrow: "老師／輔導室", title: "老師／輔導室批次模式", description: "用班級視角整理資料來源、試算與升學待辦。", sections: [{ title: "可使用的工具", body: "可使用校科查詢、規則說明、成績試算與日程頁面協助個別或班級討論。" }, { title: "權限原則", body: "學生的個人志願與會員資料不會因老師模式自動公開。" }], action: { label: "開始查學校", href: "/schools" } },
  siblings: { eyebrow: "帳號與資料", title: "手足資料切換", description: "讓不同學生的升學規劃彼此分開。", sections: [{ title: "目前使用方式", body: "每位學生應使用自己的規劃與成績資料，避免把不同就學區與成績混在一起。" }, { title: "切換前確認", body: "切換學生前，請先確認目前登入身分與就學區，再開始試算或編輯志願。" }], action: { label: "回到帳號中心", href: "/account" } },
};
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((feature) => ({ feature })); }
export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> { const { feature } = await params; const page = pages[feature]; return page ? { title: `${page.title}｜帳號與資料`, description: page.description, alternates: { canonical: `/account/${feature}` }, robots: { index: false, follow: false } } : {}; }
export default async function AccountFeaturePage({ params }: { params: Promise<{ feature: string }> }) { const { feature } = await params; const page = pages[feature]; if (!page) return null; return <><SiteHeader activeHref="/account" /><IndependentSupportPage page={page} /><SiteFooter /></>; }
