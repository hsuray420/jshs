import Link from "next/link";
import { countPendingSchoolDataDrafts, listSchoolDataAudit } from "../../db/admin-store";
import { listSchoolMediaMetadata } from "../../db/school-media-store";
import { listPendingSchoolReviews } from "../../db/school-review-store";
import { countPendingDataReports } from "../../db/data-report-store";
import { requireAdmin } from "./auth";
import { getSchools, schoolMetadata } from "../../lib/school-repository";
import validation from "../../content/schools/generated/validation.json";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const schools = getSchools();
  const [reviews, dataReports, media, pendingDrafts, recentAudit] = await Promise.all([listPendingSchoolReviews(), countPendingDataReports(), listSchoolMediaMetadata(), countPendingSchoolDataDrafts(), listSchoolDataAudit()]);
  const imageCodes = new Set(media.map((item) => item.school_code));
  const missingImages = schools.filter((school) => !imageCodes.has(school.code)).length;
  const missingCore = schools.filter((school) => !school.address || !school.phone || !school.website).length;
  const completeness = schools.length ? (((schools.length - missingCore) / schools.length) * 100).toFixed(1) : "0.0";
  const tasks = reviews.length + dataReports + pendingDrafts + validation.errors.length;
  return <>
    <section className="admin-page-heading"><div><p className="admin-eyebrow">Dashboard</p><h1>後台總覽</h1><p className="admin-muted">早安，{admin.user.displayName}。這裡只放需要快速判斷的營運狀態。</p></div><Link className="admin-button" href="/admin/settings">網站設定</Link></section>
    <section className="admin-dashboard-grid" aria-label="資料營運摘要"><DashboardCard label={`${Number(schoolMetadata.academicYear) + 1} 學年度準備`} value={`${completeness}%`} detail={`${missingCore} 所缺核心資料；目前正式為 ${schoolMetadata.academicYear} 學年度`} tone={missingCore ? "warn" : "ok"} href="/admin/data" /><DashboardCard label="待發布修改" value={`${pendingDrafts} 筆`} detail="草稿不影響正式網站" tone={pendingDrafts ? "warn" : "ok"} href="/admin/audit" /><DashboardCard label="錯誤回報" value={`${dataReports} 筆`} detail="待確認使用者資料回報" tone={dataReports ? "warn" : "ok"} href="/admin/data/reports" /><DashboardCard label="缺少圖片" value={`${missingImages} 所`} detail="需要補上來源與授權資訊" tone={missingImages ? "warn" : "ok"} href="/admin/media" /><DashboardCard label="資料驗證" value={validation.errors.length ? `${validation.errors.length} 失敗` : "通過"} detail={`${validation.warnings.length} 個非阻擋警告`} tone={validation.errors.length ? "warn" : "ok"} href="/admin/data" /><DashboardCard label="GitHub Sync" value="GitHub Actions" detail="發布成功才建立 commit；部署狀態另行追蹤" tone="info" href="/admin/deployments" /><DashboardCard label="需要處理" value={`${tasks} 項`} detail={tasks ? "草稿、驗證或回報待處理" : "目前沒有阻擋項目"} tone={tasks ? "warn" : "ok"} href="/admin/data" /></section>
    <section className="admin-dashboard-columns"><section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Needs attention</p><h2>需要處理</h2></div></div><div className="admin-quick-links"><Link href="/admin/schools">修正學校資料<span>{missingCore} 所缺地址、電話或官網</span></Link><Link href="/admin/media">補齊學校圖片<span>{missingImages} 所尚無管理員圖片</span></Link><Link href="/admin/audit">審閱待發布修改<span>{pendingDrafts} 筆草稿</span></Link><Link href="/admin/data/reports">處理錯誤回報<span>{dataReports} 件待確認</span></Link><Link href="/admin/data">資料健康中心<span>{validation.errors.length} 個阻擋錯誤</span></Link><Link href="/admin/deployments">發布中心<span>GitHub Actions 與 Rollback 記錄</span></Link></div></section><section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Recent activity</p><h2>最近資料修改</h2></div><Link href="/admin/audit">全部紀錄</Link></div><ul className="admin-activity-list">{recentAudit.slice(0, 5).map((entry) => <li key={entry.id}><span>{entry.school_name} · {entry.field || entry.action}</span><time>{entry.status}</time></li>)}{!recentAudit.length ? <li><span>尚無學校資料修改紀錄</span><time>Audit</time></li> : null}</ul></section></section>
  </>;
}

function DashboardCard({ label, value, detail, tone, href }: { label: string; value: string; detail: string; tone: "ok" | "warn" | "info"; href: string }) { return <Link href={href} className={`admin-dashboard-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></Link>; }
