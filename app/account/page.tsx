import type { Metadata } from "next";
import { AccountCenter } from "@/components/account-center";
import { FeatureHero } from "@/components/feature-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = { title: "帳號與資料｜JSHS", description: "管理登入、資料匯出、老師模式與個人使用情境。", alternates: { canonical: "/account" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; registered?: string }> }) {
  const [member, params] = await Promise.all([getMemberSession(), searchParams]);
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/account" /><FeatureHero theme="other" eyebrow="帳號與資料" title="你的升學資料，由你掌握。" description="主要功能可免登入使用；註冊後可保存規劃與試算資料，且不會公開你的 LINE userId。" illustration="account" /><AccountCenter member={member} error={params.error} registered={params.registered === "1"} /><SiteFooter /></main>;
}
