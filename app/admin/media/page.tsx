import { listAdminFiles } from "../../../db/admin-store";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAdmin();
  const files = await listAdminFiles();
  const visibleFiles = files.filter((file) => file.category !== "code-deploy");
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Operations / Media</p><h1>媒體與檔案</h1><p className="admin-muted">Podcast、影片與一般檔案分開管理；程式包上傳不在這裡執行。</p></div></section><section className="admin-dashboard-columns"><form className="admin-panel admin-module-form" action="/api/admin/media" method="post" encType="multipart/form-data"><h2>Podcast／影片</h2><label>類型<select name="kind" defaultValue="podcast"><option value="podcast">Podcast</option><option value="video">影片</option></select></label><label>標題<input name="title" maxLength={160} required /></label><label>摘要<textarea name="summary" rows={3} maxLength={1000} /></label><label>媒體檔案<input name="media" type="file" required /></label><button className="admin-button" type="submit">上傳媒體</button></form><form className="admin-panel admin-module-form" action="/api/admin/files" method="post" encType="multipart/form-data"><h2>一般檔案</h2><label>檔案<input name="file" type="file" required /></label><label>分類<input name="category" defaultValue="download" maxLength={80} /></label><label>可見性<select name="visibility" defaultValue="public"><option value="public">公開</option><option value="private">後台私有</option></select></label><label>說明<textarea name="description" rows={3} maxLength={500} /></label><button className="admin-button" type="submit">上傳檔案</button></form></section><section className="admin-panel"><div className="admin-section-head"><h2>媒體庫使用狀況</h2><span className="admin-badge ok">{visibleFiles.length} 筆</span></div><div className="admin-deployment-list">{visibleFiles.slice(0, 20).map((file) => <div className="admin-deployment-item" key={file.id}><span><strong>{file.file_name}</strong><small>{file.category} · {file.visibility} · {formatBytes(file.size)}</small></span><time>{formatDate(file.created_at)}</time></div>)}{!visibleFiles.length ? <p className="admin-muted">尚無媒體或一般檔案。</p> : null}</div></section></>;
}
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(new Date(value)); }
