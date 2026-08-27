import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { NotificationFeatureWorkspace } from "@/components/notification-feature-workspace";
import { getMemberSession } from "../../../lib/member-auth";

const pages: Record<string, SupportPage> = {
  push: { eyebrow: "通知與提醒", title: "分數到手機推播", description: "管理重要成績與規劃狀態提醒。", sections: [{ title: "開通方式", body: "登入會員後，在通知中心逐項開通想接收的提醒；預設全部關閉。" }, { title: "提醒範圍", body: "通知只會在對應事件完成且你已主動開通時送出。" }], action: { label: "管理通知設定", href: "/notifications" } },
  line: { eyebrow: "通知與提醒", title: "LINE 官方帳號整合", description: "連結 LINE，接收你主動開通的升學通知。", sections: [{ title: "需要先做什麼", body: "請先加入官方 LINE 好友，再完成會員登入與通知分類開通。" }, { title: "你可以控制", body: "你可以隨時在通知中心關閉分數、志願或重要日期類別。" }], action: { label: "前往通知中心", href: "/notifications" } },
  email: { eyebrow: "通知與提醒", title: "LINE 週報", description: "每週透過 LINE 整理試算、志願與升學進度。", sections: [{ title: "訂閱原則", body: "只有你主動登入 LINE 並開通週報，系統才會發送；預設關閉。" }, { title: "內容範圍", body: "週報只提供進度摘要與下一步，不會公開個人規劃內容。" }], action: { label: "管理 LINE 設定", href: "/notifications" } },
  calendar: { eyebrow: "通知與提醒", title: "重要日期訂閱設定", description: "選擇要追蹤的會考、報名與升學日期。", sections: [{ title: "依就學區顯示", body: "重要日期會依目前選擇的就學區與資料年度呈現，涉及權益仍請核對官方公告。" }, { title: "加入個人行事曆", body: "校園開放日與升學節點可在日程頁整理，並匯出 ICS 到手機或行事曆。" }], action: { label: "前往時間日程", href: "/schedule" } },
};
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((feature) => ({ feature })); }
export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> { const { feature } = await params; const page = pages[feature]; return page ? { title: `${page.title}｜通知與提醒`, description: page.description, alternates: { canonical: `/notifications/${feature}` }, robots: { index: false, follow: false } } : {}; }
export default async function NotificationFeaturePage({ params }: { params: Promise<{ feature: string }> }) { const { feature } = await params; const page = pages[feature]; if (!page) return null; const member = await getMemberSession(); return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/notifications" /><IndependentSupportPage page={page} /><NotificationFeatureWorkspace feature={feature as "push" | "line" | "email" | "calendar"} isMember={Boolean(member)} /><SiteFooter /></main>; }
