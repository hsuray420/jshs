import Link from "next/link";
import { requireAdminRole } from "../auth";
import { listJshsMembers } from "../../../db/member-identity-store";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminRole("reviewer");
  const [{ q = "" }, members] = await Promise.all([searchParams, listJshsMembers()]);
  const query = q.trim().toLowerCase();
  const visible = query ? members.filter((member) => [member.user_id, member.display_name, member.line_user_id].some((value) => value.toLowerCase().includes(query))) : members;
  return <>
    <section className="admin-page-heading"><div><p className="admin-eyebrow">Members / Privacy</p><h1>使用者</h1><p className="admin-muted">僅顯示營運與審核所需資訊；LINE 原始資料與私人內容不會直接列在列表。</p></div><Link className="admin-button-secondary" href="/admin/system/resources">系統資源</Link></section>
    <section className="admin-panel"><form className="admin-search-form" method="get"><label>搜尋 JSHS user_id、名稱或 LINE identity<input name="q" defaultValue={q} maxLength={120} /></label><button className="admin-button" type="submit">搜尋</button></form></section>
    <section className="admin-panel"><div className="admin-section-head"><h2>已建立 JSHS Identity</h2><span className="admin-badge info">{visible.length} 筆</span></div><div className="admin-audit-table-wrap"><table className="admin-audit-table"><thead><tr><th>JSHS user_id</th><th>顯示名稱</th><th>LINE Identity</th><th>好友狀態</th><th>最後登入</th></tr></thead><tbody>{visible.map((member) => <tr key={member.user_id}><td><code>{member.user_id}</code></td><td>{member.display_name || "未提供"}</td><td><code>{maskIdentity(member.line_user_id)}</code></td><td><span className={`admin-badge ${member.is_friend ? "ok" : "warn"}`}>{member.is_friend ? "已驗證" : "未驗證"}</span></td><td>{formatDate(member.last_login_at)}</td></tr>)}{!visible.length ? <tr><td colSpan={5} className="admin-muted">尚無已建立的 JSHS Identity。既有使用者會在下一次 LINE 回呼時安全建立對應，不會重設歷史資料。</td></tr> : null}</tbody></table></div></section>
  </>;
}

function maskIdentity(value: string) { return value.length > 10 ? `${value.slice(0, 4)}…${value.slice(-4)}` : "已綁定"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(value)); }
