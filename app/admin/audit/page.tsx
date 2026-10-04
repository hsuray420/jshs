import Link from "next/link";
import { requireAdmin } from "../auth";
import { listSchoolDataAudit } from "../../../db/admin-store";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string; admin?: string; field?: string; date?: string }> }) {
  await requireAdmin();
  const filters = await searchParams;
  const entries = await listSchoolDataAudit({ query: filters.q, admin: filters.admin, field: filters.field, date: filters.date });
  return <>
    <section className="admin-page-heading"><div><p className="admin-eyebrow">Governance / Audit</p><h1>Audit Log</h1><p className="admin-muted">草稿、預覽、衝突與發布逐欄保存；Git commit SHA 可追溯至正式版本。</p></div><span className="admin-badge">{entries.length} 筆</span></section>
    <form className="admin-panel admin-audit-filters" method="get"><label><span>學校／Commit SHA</span><input name="q" defaultValue={filters.q || ""} /></label><label><span>管理員</span><input name="admin" defaultValue={filters.admin || ""} /></label><label><span>欄位</span><input name="field" defaultValue={filters.field || ""} /></label><label><span>日期</span><input name="date" type="date" defaultValue={filters.date || ""} /></label><button className="admin-button" type="submit">搜尋</button></form>
    <section className="admin-panel admin-audit-table-wrap"><table className="admin-audit-table"><thead><tr><th>時間／狀態</th><th>學校</th><th>欄位</th><th>變更</th><th>管理員</th><th>Commit</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td><time>{formatDate(entry.occurred_at)}</time><span className={`admin-badge ${entry.status === "success" ? "ok" : entry.status === "conflict" ? "warn" : "error"}`}>{entry.action} · {entry.status}</span></td><td><Link href={`/admin/schools/${encodeURIComponent(entry.school_code)}?region=${encodeURIComponent(entry.region_code)}`}>{entry.school_name}</Link><small>{entry.school_code} · {entry.region_code}</small></td><td><strong>{entry.field || "—"}</strong><small>{entry.source_file}</small></td><td><small>Old：{entry.old_value || "空白"}</small><small>New：{entry.new_value || "空白"}</small>{entry.error_message ? <small className="admin-error-text">{entry.error_message}</small> : null}</td><td>{entry.admin_name}<small>{entry.admin_id}</small></td><td><code>{entry.commit_sha ? entry.commit_sha.slice(0, 12) : "—"}</code></td></tr>)}{!entries.length ? <tr><td colSpan={6}>目前沒有符合條件的修改紀錄。</td></tr> : null}</tbody></table></section>
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(value)); }

