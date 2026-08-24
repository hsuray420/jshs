import type { Metadata } from "next";
import { NotificationCenter } from "@/components/notification-center";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = { title: "通知與提醒｜JSHS", description: "管理分數、LINE、Email 與重要日期提醒。", alternates: { canonical: "/notifications" }, robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function NotificationsPage() { const member = await getMemberSession(); return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/notifications" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">通知與提醒</p><h1 className="mt-3 max-w-4xl">在正確的時間，收到下一步。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">通知預設全部關閉；使用 LINE 登入後，逐項開通你希望收到的志願、成績與重要日期提醒。</p></div></section><NotificationCenter isMember={Boolean(member)} /><SiteFooter /></main>; }
