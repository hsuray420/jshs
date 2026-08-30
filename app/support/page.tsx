import type { Metadata } from "next";
import { SupportDonationForm } from "@/components/support-donation-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "小額捐款與贊助｜JSHS", description: "支持 JSHS 持續整理免費升學資訊。", alternates: { canonical: "/support" } };

export default function SupportPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader /><section className="jshs-hero-section"><div className="mx-auto w-[min(840px,calc(100%-32px))] py-12"><p className="jshs-eyebrow">非營利網站</p><h1 className="mt-3">小額捐款與贊助我們</h1><p className="mt-4 text-base leading-7 jshs-muted-copy">本站由民間無償開發與維護，不收取使用費，也沒有任何盈利。若覺得網站有幫助，歡迎以小額捐款或贊助支持網站持續維護。點擊捐款後會直接開啟外部付款服務，本站不接觸信用卡資料，也不會自行判定付款是否成功。</p></div></section><SupportDonationForm /><SiteFooter /></main>;
}
