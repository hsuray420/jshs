import type { Metadata } from "next";
import { listAdminFiles, listSiteSettings } from "../../db/admin-store";
import {
  getAlertLineUserIds,
  getAllowedLineUserIds,
  hasLineLoginConfigured,
  hasLineMessagingConfigured,
} from "../../lib/line";
import { requireAdmin } from "./auth";
import "./styles.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理後台｜中投區國中升學資訊網",
  description: "網站管理、檔案上傳與營運設定。",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; tested?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const [files, settings] = await Promise.all([
    listAdminFiles(),
    listSiteSettings(),
  ]);
  const settingsMap = new Map(settings.map((item) => [item.key, item.value]));
  const publicFiles = files.filter((file) => file.visibility === "public");
  const privateFiles = files.filter((file) => file.visibility === "private");
  const schoolCsvUpdatedAt = settingsMap.get("schools_csv_updated_at");
  const lineLoginReady = hasLineLoginConfigured();
  const linePushReady = hasLineMessagingConfigured();
  const allowedLineUsers = getAllowedLineUserIds();
  const alertLineUsers = getAlertLineUserIds(admin.user.lineUserId);

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
          <a href="/it_hs/it_hs.html#schools">看學校資料</a>
          <a href={admin.signOutPath}>登出</a>
        </div>
      </header>

      {params.updated || params.tested ? (
        <section className="admin-flash">
          {params.updated === "schools_csv" ? "學校 CSV 已更新。" : null}
          {params.tested === "line" ? "LINE 測試通知已送出。" : null}
        </section>
      ) : null}

      <section className="admin-stat-grid" aria-label="系統摘要">
        <StatusCard label="LINE 登入" value={lineLoginReady ? "已啟用" : "待設定"} tone={lineLoginReady ? "ok" : "warn"} />
        <StatusCard label="LINE 推播" value={linePushReady ? "已啟用" : "待設定"} tone={linePushReady ? "ok" : "warn"} />
        <StatusCard label="學校 CSV" value={schoolCsvUpdatedAt ? "後台管理" : "內建資料"} tone="ok" />
        <StatusCard label="檔案庫" value={`${files.length} 個檔案`} tone="ok" />
      </section>

      <section className="admin-grid admin-grid-3">
        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">LINE</p>
              <h2>LINE 登入與通知</h2>
            </div>
            <span className={linePushReady ? "admin-badge ok" : "admin-badge warn"}>
              {linePushReady ? "可推播" : "缺 Token"}
            </span>
          </div>
          <dl className="admin-kv">
            <dt>LINE Login</dt>
            <dd>{lineLoginReady ? "已設定 Channel ID / Secret" : "尚未設定"}</dd>
            <dt>官方帳號推播</dt>
            <dd>{linePushReady ? "已設定 Channel access token" : "尚未設定"}</dd>
            <dt>可登入管理員</dt>
            <dd>{allowedLineUsers.length} 位</dd>
            <dt>告警接收者</dt>
            <dd>{alertLineUsers.length} 位</dd>
          </dl>
          <form action="/api/admin/line/test" method="post">
            <button className="admin-button" type="submit" disabled={!linePushReady}>
              發送 LINE 測試通知
            </button>
          </form>
          <p className="admin-muted">密鑰由環境變數保護，不在後台顯示明文。</p>
        </section>

        <form
          className="admin-panel"
          action="/api/admin/schools-csv"
          method="post"
          encType="multipart/form-data"
        >
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Schools CSV</p>
              <h2>學校資料管理</h2>
            </div>
            <span className="admin-badge ok">前台即時讀取</span>
          </div>
          <dl className="admin-kv">
            <dt>目前來源</dt>
            <dd>{settingsMap.get("schools_csv_file_name") || "內建 schools.csv"}</dd>
            <dt>更新時間</dt>
            <dd>{formatDate(schoolCsvUpdatedAt) || "尚未由後台更新"}</dd>
          </dl>
          <label>
            上傳新版 schools.csv
            <input name="schools_csv" type="file" accept=".csv,text/csv" required />
          </label>
          <button className="admin-button" type="submit">
            更新學校 CSV
          </button>
          <a className="admin-plain-link" href="/api/schools.csv">
            查看目前前台讀取的 CSV
          </a>
        </form>

        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Server</p>
              <h2>伺服器狀態</h2>
            </div>
            <span className="admin-badge ok">運作中</span>
          </div>
          <dl className="admin-kv">
            <dt>健康檢查</dt>
            <dd><a href="/api/health">/api/health</a></dd>
            <dt>LINE Webhook</dt>
            <dd><a href="/api/line/webhook">/api/line/webhook</a></dd>
            <dt>告警 API</dt>
            <dd>/api/monitor/alert</dd>
            <dt>部署網域</dt>
            <dd>ct-jshs-edu.abrdns.com</dd>
          </dl>
          <p className="admin-muted">整台服務掛掉時需要外部監控服務檢查健康檢查網址。</p>
        </section>
      </section>

      <section className="admin-grid">
        <form
          className="admin-panel"
          action="/api/admin/files"
          method="post"
          encType="multipart/form-data"
        >
          <p className="admin-eyebrow">Files</p>
          <h2>檔案與下載管理</h2>
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
            上傳檔案
          </button>
        </form>

        <form className="admin-panel" action="/api/admin/settings" method="post">
          <p className="admin-eyebrow">Settings</p>
          <h2>網站內容設定</h2>
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
          <span>{publicFiles.length} 公開 / {privateFiles.length} 後台</span>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>檔名</th>
                <th>分類</th>
                <th>狀態</th>
                <th>大小</th>
                <th>上傳者</th>
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
                  <td>{file.uploaded_by}</td>
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
                  <td colSpan={6}>目前還沒有上傳檔案。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn";
}) {
  return (
    <article className={`admin-stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}
