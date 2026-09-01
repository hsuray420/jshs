import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { NotificationCenter } from "@/components/notification-center";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = { title: "通知與提醒｜JSHS", description: "管理分數、LINE、Email 與重要日期提醒。", alternates: { canonical: "/notifications" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const member = await getMemberSession();
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/notifications" /><FeatureHero theme="other" eyebrow="通知與提醒" title="在正確的時間，收到下一步" description="通知預設全部關閉；登入後可自行開通志願、成績與重要日期提醒。" illustration="calendar-export" /><NotificationCenter isMember={Boolean(member)} /><SiteFooter /></main>;
}
