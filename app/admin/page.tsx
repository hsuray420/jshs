import type { Metadata } from "next";
import Link from "next/link";
import {
  listAdminFiles,
  listExtraAdminLineUserIds,
  listLineUsers,
  listSiteSettings,
} from "../../db/admin-store";
import { listPendingSchoolReviews } from "../../db/school-review-store";
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
  title: "管理後台｜全國國中升學資訊網",
  description: "網站管理、檔案上傳與營運設定。",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; tested?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const [files, settings, lineUsers, extraAdminLineUsers, pendingReviews] = await Promise.all([
    listAdminFiles(),
    listSiteSettings(),
    listLineUsers(),
    listExtraAdminLineUserIds(),
    listPendingSchoolReviews(),
  ]);
  const settingsMap = new Map(settings.map((item) => [item.key, item.value]));
  const publicFiles = files.filter((file) => file.visibility === "public");
  const privateFiles = files.filter((file) => file.visibility === "private");
  const schoolCsvUpdatedAt = settingsMap.get("schools_csv_updated_at");
  const lineLoginReady = hasLineLoginConfigured();
  const linePushReady = hasLineMessagingConfigured();
  const envAllowedLineUsers = getAllowedLineUserIds();
  const allowedLineUsers = Array.from(new Set([...envAllowedLineUsers, ...extraAdminLineUsers]));
  const alertLineUsers = getAlertLineUserIds(admin.user.lineUserId);
  const pendingLineUsers = lineUsers.filter(
    (user) => !allowedLineUsers.includes(user.line_user_id) && user.status !== "blocked",
  );

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">JSHS Admin</p>
          <h1>網站管理後台</h1>
          <p className="admin-muted">LINE 管理員：{admin.user.displayName}</p>
        </div>
        <div className="admin-actions">
          <Link href="/">看前台</Link>
          <Link href="/schools">看學校資料</Link>
          <a href="/admin/code/">看程式碼</a>
          <a href={admin.signOutPath}>登出</a>
        </div>
      </header>

      {params.updated || params.tested ? (
        <section className="admin-flash">
          {params.updated === "schools_csv" ? "學校 CSV 已更新。" : null}
          {params.updated === "code_upload" ? "程式包已上傳，已建立待部署/執行紀錄。" : null}
          {params.updated === "line_users_added" ? "已加入 LINE 後台管理員。" : null}
          {params.updated === "line_users_removed" ? "已移除後台新增的 LINE 管理員。" : null}
          {params.updated === "line_users_invalid" ? "LINE userId 格式不正確。" : null}
          {params.updated === "review_published" ? "分享已審核並公開。" : null}
          {params.updated === "review_rejected" ? "分享已退回，不會公開。" : null}
          {params.tested === "line" ? "LINE 測試通知已送出。" : null}
        </section>
      ) : null}

      <section className="admin-stat-grid" aria-label="系統摘要">
        <StatusCard label="LINE 登入" value={lineLoginReady ? "已啟用" : "待設定"} tone={lineLoginReady ? "ok" : "warn"} />
        <StatusCard label="LINE 推播" value={linePushReady ? "已啟用" : "待設定"} tone={linePushReady ? "ok" : "warn"} />
        <StatusCard label="學校 CSV" value={schoolCsvUpdatedAt ? "後台管理" : "內建資料"} tone="ok" />
        <StatusCard label="檔案庫" value={`${files.length} 個檔案`} tone="ok" />
        <StatusCard label="程式碼" value="可上傳" tone="ok" />
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
            <dd>{allowedLineUsers.length} 位（環境 {envAllowedLineUsers.length} / 後台 {extraAdminLineUsers.length}）</dd>
            <dt>待授權好友</dt>
            <dd>{pendingLineUsers.length} 位</dd>
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

      <section className="admin-panel">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">Moderation</p>
            <h2>匿名分享待審核</h2>
          </div>
          <span className={pendingReviews.length ? "admin-badge warn" : "admin-badge ok"}>{pendingReviews.length} 筆待處理</span>
        </div>
        <p className="admin-muted">使用者送出的會考成績、錄取結果與經驗，先進入 D1 待審核資料表；只有按下公開後，前台 API 才會讀取。</p>
        <div className="admin-review-list">
          {pendingReviews.map((review) => (
            <article className="admin-review-card" key={review.id}>
              <div>
                <strong>{review.school_name}</strong>
                <small>{review.district} · {review.school_code} · {review.nickname || "匿名學長姐"}</small>
              </div>
              <dl className="admin-kv">
                <dt>會考成績</dt><dd>{review.exam_score || "未填"}</dd>
                <dt>最低錄取</dt><dd>{review.admission_score || "未填"}</dd>
                <dt>錄取結果</dt><dd>{review.admission_result || "未填"}</dd>
                <dt>分享內容</dt><dd>{review.content}</dd>
              </dl>
              <div className="admin-row-actions">
                <form action="/api/admin/school-reviews" method="post"><input type="hidden" name="id" value={review.id} /><input type="hidden" name="status" value="published" /><button type="submit">審核公開</button></form>
                <form action="/api/admin/school-reviews" method="post"><input type="hidden" name="id" value={review.id} /><input type="hidden" name="status" value="rejected" /><button type="submit">退回</button></form>
              </div>
            </article>
          ))}
          {!pendingReviews.length ? <p className="admin-muted">目前沒有待審核分享。</p> : null}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">LINE Access</p>
            <h2>LINE 好友與管理員權限</h2>
          </div>
          <span className="admin-badge ok">{lineUsers.length} 位已記錄</span>
        </div>
        <form className="admin-inline-form" action="/api/admin/line-users" method="post">
          <label>
            手動加入 LINE userId
            <input name="line_user_id" placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required />
          </label>
          <button className="admin-button" type="submit">加入管理員</button>
        </form>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>LINE 使用者</th>
                <th>狀態</th>
                <th>最後互動</th>
                <th>權限</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {lineUsers.map((user) => {
                const isEnvAdmin = envAllowedLineUsers.includes(user.line_user_id);
                const isExtraAdmin = extraAdminLineUsers.includes(user.line_user_id);
                const isAdmin = isEnvAdmin || isExtraAdmin;
                return (
                  <tr key={user.line_user_id}>
                    <td>
                      <strong>{user.display_name || "未取得名稱"}</strong>
                      <small>{user.line_user_id}</small>
                    </td>
                    <td>{user.status === "blocked" ? "已封鎖/取消好友" : "好友/已互動"}</td>
                    <td>{formatDate(user.last_seen_at)}</td>
                    <td>{isAdmin ? (isEnvAdmin ? "環境管理員" : "後台管理員") : "未授權"}</td>
                    <td className="admin-row-actions">
                      {isAdmin ? (
                        <form action="/api/admin/line-users" method="post">
                          <input type="hidden" name="line_user_id" value={user.line_user_id} />
                          <input type="hidden" name="action" value="remove" />
                          <button type="submit" disabled={isEnvAdmin}>移除</button>
                        </form>
                      ) : (
                        <form action="/api/admin/line-users" method="post">
                          <input type="hidden" name="line_user_id" value={user.line_user_id} />
                          <input type="hidden" name="display_name" value={user.display_name} />
                          <button type="submit">加成管理員</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!lineUsers.length ? (
                <tr>
                  <td colSpan={5}>尚未記錄 LINE 好友。請先讓使用者加入官方帳號或登入一次。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="admin-muted">加入 LINE 官方帳號或傳訊息後，Webhook 會自動記錄 userId；環境管理員不可在後台移除，避免鎖住第一位管理者。</p>
      </section>

      <section className="admin-grid">
        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Backend</p>
              <h2>後端位置與備份</h2>
            </div>
            <span className="admin-badge warn">需補定期備份</span>
          </div>
          <dl className="admin-kv">
            <dt>網站程式</dt>
            <dd>Cloudflare Workers 部署版本 + 本機自動部署來源</dd>
            <dt>資料庫</dt>
            <dd>Cloudflare D1：規劃、後台檔案、網站設定</dd>
            <dt>檔案空間</dt>
            <dd>Cloudflare Assets：學校 CSV 與靜態資料；D1：後台小型檔案</dd>
            <dt>目前備份</dt>
            <dd>Workers 版本可回復；D1 由 Cloudflare Time Travel 保護</dd>
          </dl>
        </section>

        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Control</p>
              <h2>後台功能入口</h2>
            </div>
            <span className="admin-badge ok">集中管理</span>
          </div>
          <div className="admin-link-grid">
            <a href="/admin/code/">查看所有程式碼</a>
            <a href="#code-upload">上傳程式包</a>
            <a href="/api/health">伺服器健康檢查</a>
            <a href="/api/admission/calculate">後端試算 API</a>
            <a href="/api/schools.csv">學校 CSV</a>
            <a href="/tools">積分試算</a>
            <Link href="/schools">學校查詢</Link>
            <a href="/planner">志願清單</a>
          </div>
          <p className="admin-muted">LINE 密鑰、管理員名單與告警接收者使用環境變數保護。</p>
        </section>
      </section>

      <section className="admin-grid">
        <form
          id="code-upload"
          className="admin-panel"
          action="/api/admin/code-upload"
          method="post"
          encType="multipart/form-data"
        >
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Program Upload</p>
              <h2>程式上傳與執行紀錄</h2>
            </div>
            <span className="admin-badge warn">待部署</span>
          </div>
          <p className="admin-muted">
            上傳你修改後的程式包，系統會保存到後台私有檔案庫並建立「待部署/執行」紀錄。正式執行仍需由受控部署流程套用，避免任意程式直接影響線上網站。
          </p>
          <label>
            程式檔或壓縮包
            <input
              name="program"
              type="file"
              accept=".zip,.tar,.tgz,.gz,.js,.ts,.tsx,.html,.css,.json,.md"
              required
            />
          </label>
          <label>
            修改內容與執行說明
            <textarea
              name="run_note"
              rows={4}
              placeholder="例如：更新積分試算公式、修改前台選單、補學校 CSV 欄位..."
            />
          </label>
          <button className="admin-button" type="submit">
            上傳並建立執行紀錄
          </button>
          <p className="admin-muted">上傳後可在下方檔案庫找到分類為 code-deploy 的紀錄。</p>
        </form>

        <form
          className="admin-panel"
          action="/api/admin/files"
          method="post"
          encType="multipart/form-data"
        >
          <p className="admin-eyebrow">Files</p>
          <h2>檔案與下載管理</h2>
          <p className="admin-muted">750 KB 以下檔案直接保存在 Cloudflare D1，不經任何外部檔案服務。</p>
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
              <option value="code">程式碼備份</option>
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
          <h2>網站內容與 LINE</h2>
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
          <label>
            LINE 官方帳號連結
            <input
              name="official_line_url"
              type="url"
              placeholder="https://lin.ee/..."
              defaultValue={settingsMap.get("official_line_url") ?? ""}
            />
          </label>
          <button className="admin-button" type="submit">
            儲存設定
          </button>
          <p className="admin-muted">LINE 保留為你已指定的通知整合；網站程式與核心資料仍只放 Cloudflare。</p>
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
