import Link from "next/link";
import { listAdminFiles } from "../../../db/admin-store";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function DataOverview() {
  await requireAdmin();
  const files = await listAdminFiles();
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Data / Schools</p><h1>學校與資料</h1><p className="admin-muted">學校目錄、招生資料、生活資料、來源與驗證集中在資料模組。</p></div></section><section className="admin-dashboard-grid"><DataCard title="學校資料" detail="搜尋與檢視 604 筆校科資料" href="/schools" /><DataCard title="CSV 匯入" detail="更新學校資料前先驗證檔案" href="/admin/data/csv" /><DataCard title="招生資料" detail="年度規則、歷年紀錄與來源" href="/admin/data" /><DataCard title="生活／交通資料" detail="查看研究與待驗證狀態" href="/admin/data" /><DataCard title="資料來源與驗證" detail="官方來源、資料品質與審核" href="/trust/status" /><DataCard title="資料回報" detail="處理使用者回報並留下修正狀態" href="/admin/data/reports" /><DataCard title="學校分享審核" detail="匿名分享公開前的審核流程" href="/admin/data/reviews" /><DataCard title="檔案庫" detail={`${files.length} 個後台檔案已登錄`} href="/admin/media" /></section></>;
}

function DataCard({ title, detail, href }: { title: string; detail: string; href: string }) { return <Link href={href} className="admin-dashboard-card info"><span>{title}</span><strong>資料模組</strong><small>{detail}</small></Link>; }
