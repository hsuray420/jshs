import Link from "next/link";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  await requireAdmin();
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Platform / System</p><h1>系統與安全</h1><p className="admin-muted">檢查 Worker、D1、備份、管理員與安全狀態。</p></div></section><section className="admin-dashboard-grid"><Status title="Cloudflare Worker" value="請查看健康檢查" href="/api/health" /><Status title="D1" value="後台資料庫" href="/admin/data/operations" /><Status title="Secrets" value="只顯示設定狀態" href="/admin/payments" /></section><section className="admin-panel"><h2>安全原則</h2><p className="admin-muted">HashKey、HashIV、LINE secret 與 Cloudflare token 不會傳給 client；高風險操作維持管理員驗證。</p><Link className="admin-button admin-button-secondary" href="/admin/code">查看程式碼稽核</Link></section></>;
}
function Status({ title, value, href }: { title: string; value: string; href: string }) { return <Link href={href} className="admin-dashboard-card info"><span>{title}</span><strong>{value}</strong><small>前往檢視 →</small></Link>; }
