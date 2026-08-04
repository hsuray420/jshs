import type { Metadata } from "next";
import { listAdminFiles, listSiteSettings } from "../../db/admin-store";
import { requireAdmin } from "./auth";
import "./styles.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理後台｜中投區國中升學資訊網",
  description: "網站管理、檔案上傳與營運設定。",
};

export default async function AdminPage() {
  const admin = await requireAdmin();

  if (!admin.allowed) {
    return (
      <main className="admin-shell">
        <section className="admin-panel">
          <p className="admin-eyebrow">Admin</p>
          <h1>此帳號沒有管理權限</h1>
          <p className="admin-muted">你已登入 LINE，但不在管理員名單內。</p>
          <a className="admin-button" href={admin.signOutPath}>
            登出
          </a>
        </section>
      </main>
    );
  }

  const [files, settings] = await Promise.all([
    listAdminFiles(),
    listSiteSettings(),
  ]);
  const settingsMap = new Map(settings.map((item) => [item.key, item.value]));

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">JSHS Admin</p>
          <h1>網站管理後台</h1>
          <p className="admin-muted">LINE 管理員：{admin.user.displayName}</p>
        </div>
        <div className="admin-actions">
          <a href="/jshs/jshs.html">看前台</a>
          <a href={admin.signOutPath}>登出</a>
        </div>
      </header>

      <section className="admin-grid">
        <form
          className="admin-panel"
          action="/api/admin/files"
          method="post"
          encType="multipart/form-data"
        >
          <p className="admin-eyebrow">Files</p>
          <h2>上傳檔案</h2>
          <label>
            檔案
            <input name="file" type="file" required />
          </label>
          <label>
            分類
            <select name="category" defaultValue="download">
              <option value="download">資料下載</option>
              <option value="notice">公告附件</option>
              <option value="school">學校資料</option>
              <option value="general">一般檔案</option>
            </select>
          </label>
          <label>
            可見性
            <select name="visibility" defaultValue="public">
              <option value="public">公開下載</option>
              <option value="private">後台保存</option>
            </select>
          </label>
          <label>
            說明
            <textarea name="description" rows={4} />
          </label>
          <button className="admin-button" type="submit">
            上傳
          </button>
        </form>

        <form className="admin-panel" action="/api/admin/settings" method="post">
          <p className="admin-eyebrow">Settings</p>
          <h2>網站營運設定</h2>
          <label>
            首頁公告
            <textarea
              name="site_notice"
              rows={5}
              defaultValue={settingsMap.get("site_notice") ?? ""}
            />
          </label>
          <label>
            聯絡信箱
            <input
              name="contact_email"
              type="email"
              defaultValue={settingsMap.get("contact_email") ?? ""}
            />
          </label>
          <button className="admin-button" type="submit">
            儲存設定
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">Library</p>
            <h2>檔案庫</h2>
          </div>
          <span>{files.length} 個檔案</span>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>檔名</th>
                <th>分類</th>
                <th>狀態</th>
                <th>大小</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <strong>{file.file_name}</strong>
                    <small>{file.description || "沒有說明"}</small>
                  </td>
                  <td>{file.category}</td>
                  <td>{file.visibility === "public" ? "公開" : "後台"}</td>
                  <td>{formatBytes(file.size)}</td>
                  <td className="admin-row-actions">
                    <a href={`/api/files/${file.id}`}>下載</a>
                    <form action={`/api/admin/files/${file.id}`} method="post">
                      <input type="hidden" name="_method" value="delete" />
                      <button type="submit">刪除</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!files.length ? (
                <tr>
                  <td colSpan={5}>目前還沒有上傳檔案。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
