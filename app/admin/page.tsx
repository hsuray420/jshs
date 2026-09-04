import Link from "next/link";
import { listAdminFiles, listSiteSettings } from "../../db/admin-store";
import { listContentEntries } from "../../db/content-store";
import { listNotificationSettings } from "../../db/notification-store";
import { listPendingSchoolReviews } from "../../db/school-review-store";
import { countPendingDataReports } from "../../db/data-report-store";
import { requireAdmin } from "./auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const [settings, files, content, notifications, reviews, dataReports] = await Promise.all([listSiteSettings(), listAdminFiles(), listContentEntries(), listNotificationSettings(), listPendingSchoolReviews(), countPendingDataReports()]);
  const donationReady = settings.some((item) => item.key === "donation_url" && item.value);
  const enabledNotifications = notifications.filter((item) => item.enabled).length;
  const tasks = reviews.length + dataReports + Number(!donationReady);
  return <>
    <section className="admin-page-heading"><div><p className="admin-eyebrow">Dashboard</p><h1>後台總覽</h1><p className="admin-muted">早安，{admin.user.displayName}。這裡只放需要快速判斷的營運狀態。</p></div><Link className="admin-button" href="/admin/settings">網站設定</Link></section>
    <section className="admin-dashboard-grid" aria-label="網站狀態摘要"><DashboardCard label="網站狀態" value="正常運作" detail="Cloudflare Worker 回應正常" tone="ok" href="/admin/system" /><DashboardCard label="最新部署" value="GitHub Actions" detail="查看版本與部署紀錄" tone="info" href="/admin/deployments" /><DashboardCard label="學校資料" value="604 筆校科資料" detail="CSV、招生與生活資料" tone="ok" href="/admin/data" /><DashboardCard label="內容數量" value={`${content.length} 筆`} detail="指南、FAQ 與待辦內容" tone="info" href="/admin/content" /><DashboardCard label="通知狀態" value={`${enabledNotifications}/${notifications.length} 已開啟`} detail="LINE 事件與模板" tone={enabledNotifications ? "ok" : "warn"} href="/admin/notifications" /><DashboardCard label="資料回報" value={`${dataReports} 筆待確認`} detail="處理使用者回報與修正紀錄" tone={dataReports ? "warn" : "ok"} href="/admin/data/reports" /><DashboardCard label="待處理項目" value={`${tasks} 項`} detail={reviews.length ? "有待審核分享" : dataReports ? "有待確認資料回報" : donationReady ? "目前沒有待處理項目" : "請完成綠界連結設定"} tone={tasks ? "warn" : "ok"} href={reviews.length ? "/admin/data" : dataReports ? "/admin/data/reports" : "/admin/payments"} /></section>
    <section className="admin-dashboard-columns"><section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Quick actions</p><h2>快捷入口</h2></div></div><div className="admin-quick-links"><Link href="/admin/content">編輯升學內容<span>指南、FAQ、公告</span></Link><Link href="/admin/data">管理學校資料<span>CSV、招生、資料驗證</span></Link><Link href="/admin/notifications">調整通知<span>事件、模板、LINE</span></Link><Link href="/admin/deployments">查看部署<span>版本、待部署、Rollback</span></Link><Link href="/admin/payments">設定支持付款<span>綠界與公開支持頁</span></Link><Link href="/admin/system">檢查系統<span>D1、Worker、安全</span></Link></div></section><section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Recent activity</p><h2>最近操作紀錄</h2></div></div><ul className="admin-activity-list"><li><span>資料庫與後台服務</span><time>目前可用</time></li><li><span>{files.length} 個後台檔案已登錄</span><time>檔案庫</time></li><li><span>通知設定 {enabledNotifications ? "已啟用" : "待設定"}</span><time>通知中心</time></li><li><span>綠界付款連結 {donationReady ? "已設定" : "尚未設定"}</span><time>支持與付款</time></li></ul></section></section>
  </>;
}

function DashboardCard({ label, value, detail, tone, href }: { label: string; value: string; detail: string; tone: "ok" | "warn" | "info"; href: string }) { return <Link href={href} className={`admin-dashboard-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></Link>; }
