import type { Metadata } from "next";
import { AccountCenter } from "@/components/account-center";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = { title: "帳號與資料｜JSHS", description: "管理登入、資料匯出、老師模式與個人使用情境。", alternates: { canonical: "/account" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; registered?: string }> }) {
  const [member, params] = await Promise.all([getMemberSession(), searchParams]);
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/account" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">帳號與資料</p><h1 className="mt-3 max-w-4xl">你的升學資料，應該由你掌握。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">目前可免登入使用主要功能；使用 LINE 註冊後，會員資料以安全工作階段保存，不公開 LINE userId。</p></div></section><AccountCenter member={member} error={params.error} registered={params.registered === "1"} /><SiteFooter /></main>;
}
