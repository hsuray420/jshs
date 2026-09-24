import type { Metadata } from "next";
import Link from "next/link";
import {
  listAdminFiles,
  listExtraAdminLineUserIds,
  listLineUsers,
  listSiteSettings,
} from "../../../../db/admin-store";
import { listImportantDates, listNotificationSettings } from "../../../../db/notification-store";
import { listPendingSchoolReviews } from "../../../../db/school-review-store";
import {
  getAlertLineUserIds,
  getAllowedLineUserIds,
  hasLineLoginConfigured,
  hasLineMessagingConfigured,
} from "../../../../lib/line";
import { requireAdmin } from "../../auth";
import "../../styles.css";

const notificationControls = [
  { eventKey: "planner_finalized", label: "志願完成通知", helper: "使用者按下確認完成志願後發送。" },
  { eventKey: "score_calculated", label: "成績試算通知", helper: "使用者成功完成一次成績試算後發送。" },
  { eventKey: "important_date", label: "重要日期通知", helper: "重要日期到達發送時間後，發送給已開通的會員。" },
] as const;

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
  const [files, settings, lineUsers, extraAdminLineUsers, pendingReviews, notificationSettings, importantDates] = await Promise.all([
    listAdminFiles(),
    listSiteSettings(),
    listLineUsers(),
    listExtraAdminLineUserIds(),
    listPendingSchoolReviews(),
    listNotificationSettings(),
    listImportantDates(true),
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
    <main className="admin-module-page admin-compatibility-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">JSHS Admin</p>
          <h1>網站管理後台</h1>
          <p className="admin-muted">LINE 管理員：{admin.user.displayName}</p>
        </div>
        <div className="admin-actions">
          <Link href="/">看前台</Link>
          <Link href="/schools">看學校資料</Link>
          <Link href="/admin/content">內容中心</Link>
          <a href="/admin/code/">看程式碼</a>
          <a href={admin.signOutPath}>登出</a>
        </div>
      </header>

      {params.updated || params.tested ? (
        <section className="admin-flash">
          {params.updated === "schools_csv" ? "學校 CSV 已更新。" : null}
          {params.updated === "code_upload" ? "程式包已上傳，已建立待部署/執行紀錄。" : null}
          {params.updated === "media_synced" ? "Podcast／影片已同步到 GitHub，Actions 會測試並部署到測試與正式環境。" : null}
          {params.updated === "media_invalid" ? "影音資料不完整或超過 25 MB，尚未上傳。" : null}
          {params.updated === "media_type_invalid" ? "檔案格式不符合所選的 Podcast／影片類型。" : null}
          {params.updated === "media_failed" ? "影音上傳失敗，GitHub 尚未更新；請確認 GITHUB_TOKEN 與檔案大小。" : null}
          {params.updated === "line_users_added" ? "已加入 LINE 後台管理員。" : null}
          {params.updated === "line_users_removed" ? "已移除後台新增的 LINE 管理員。" : null}
          {params.updated === "line_users_invalid" ? "LINE userId 格式不正確。" : null}
          {params.updated === "review_published" ? "分享已審核並公開。" : null}
          {params.updated === "review_rejected" ? "分享已退回，不會公開。" : null}
          {params.updated === "notifications" ? "通知設定已更新。" : null}
          {params.updated === "important_date" ? "重要日期已更新。" : null}
          {params.updated === "settings" ? "網站設定已更新。" : null}
          {params.updated === "settings_invalid" ? "綠界付款連結格式不正確，尚未更新。" : null}
          {params.updated === "notifications_invalid" || params.updated === "important_date_invalid" ? "通知資料格式不正確，未更新。" : null}
          {params.tested === "line" ? "LINE 測試通知已送出。" : null}
        </section>
      ) : null}

      <section className="admin-stat-grid" aria-label="系統摘要">
        <StatusCard label="LINE 登入" value={lineLoginReady ? "已啟用" : "待設定"} tone={lineLoginReady ? "ok" : "warn"} />
        <StatusCard label="LINE 推播" value={linePushReady ? "已啟用" : "待設定"} tone={linePushReady ? "ok" : "warn"} />
        <StatusCard label="學校 CSV" value={schoolCsvUpdatedAt ? "後台管理" : "內建資料"} tone="ok" />
        <StatusCard label="檔案庫" value={`${files.length} 個檔案`} tone="ok" />
        <StatusCard label="程式碼" value="可上傳" tone="ok" />
        <StatusCard label="內容中心" value="知識／待辦可發布" tone="ok" />
      </section>

      <section className="admin-panel">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">Notification Control</p>
            <h2>通知主控台</h2>
          </div>
          <span className="admin-badge ok">後台可即時修改</span>
        </div>
        <p className="admin-muted">後台開關是第一層控管；會員仍必須在「通知與提醒」逐項開通，兩者都開啟才會推送。</p>
        <div className="admin-grid">
          {notificationControls.map((control) => {
            const setting = notificationSettings.find((item) => item.event_key === control.eventKey);
            return <form className="admin-panel" key={control.eventKey} action="/api/admin/notifications" method="post">
              <input type="hidden" name="action" value="settings" />
              <input type="hidden" name="event_key" value={control.eventKey} />
              <div className="admin-section-head"><div><p className="admin-eyebrow">{control.eventKey}</p><h3>{control.label}</h3></div><span className={setting?.enabled ? "admin-badge ok" : "admin-badge warn"}>{setting?.enabled ? "後台開啟" : "後台關閉"}</span></div>
              <p className="admin-muted">{control.helper}</p>
              <label className="admin-checkbox"><input name="enabled" type="checkbox" defaultChecked={setting?.enabled === 1} />允許此類通知</label>
              <label>LINE 標題<input name="title" maxLength={80} defaultValue={setting?.title || ""} required /></label>
              <label>通知內容模板<textarea name="body_template" rows={4} maxLength={1000} defaultValue={setting?.body_template || ""} required /></label>
              <p className="admin-muted">可用變數：{control.eventKey === "planner_finalized" ? "{count}" : control.eventKey === "score_calculated" ? "{district}、{academicYear}、{score}" : "{title}、{description}、{eventDate}"}</p>
              <button className="admin-button" type="submit">儲存{control.label}</button>
            </form>;
          })}
        </div>
        <div className="admin-section-head"><div><p className="admin-eyebrow">Important Dates</p><h3>重要日期管理</h3></div><span className="admin-badge ok">{importantDates.length} 筆</span></div>
        <form className="admin-inline-form" action="/api/admin/notifications" method="post">
          <input type="hidden" name="action" value="create_date" />
          <label>日期標題<input name="title" placeholder="例如：免試入學志願選填開始" maxLength={100} required /></label>
          <label>日期<input name="event_date" type="date" required /></label>
          <label>通知時間<input name="send_at" type="datetime-local" /></label>
          <label>說明<input name="description" placeholder="給使用者的提醒內容" maxLength={1000} /></label>
          <label className="admin-checkbox"><input name="enabled" type="checkbox" defaultChecked />啟用</label>
          <button className="admin-button" type="submit">新增重要日期</button>
        </form>
        <div className="admin-table-wrap"><table><thead><tr><th>日期</th><th>通知內容</th><th>發送時間</th><th>狀態</th><th>操作</th></tr></thead><tbody>
          {importantDates.map((item) => { const formId = `update-date-${item.id}`; return <tr key={item.id}><td><input form={formId} name="event_date" type="date" defaultValue={item.event_date} required /></td><td><input form={formId} name="title" defaultValue={item.title} maxLength={100} required /><input form={formId} name="description" defaultValue={item.description} maxLength={1000} /></td><td><input form={formId} name="send_at" type="datetime-local" defaultValue={toDatetimeLocal(item.send_at)} /></td><td><label className="admin-checkbox"><input form={formId} name="enabled" type="checkbox" defaultChecked={item.enabled === 1} />啟用</label>{item.sent_at ? <small>已發送：{formatDate(item.sent_at)}</small> : <small>尚未發送</small>}</td><td className="admin-row-actions"><form id={formId} action="/api/admin/notifications" method="post"><input type="hidden" name="action" value="update_date" /><input type="hidden" name="id" value={item.id} /><button type="submit">儲存</button></form><form action="/api/admin/notifications" method="post"><input type="hidden" name="action" value="delete_date" /><input type="hidden" name="id" value={item.id} /><button type="submit">刪除</button></form></td></tr>; })}
          {!importantDates.length ? <tr><td colSpan={5}>尚未建立重要日期。</td></tr> : null}
        </tbody></table></div>
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
            <a href="#media-upload">上傳 Podcast／影片</a>
            <a href="/api/health">伺服器健康檢查</a>
            <a href="/api/admission/calculate">後端試算 API</a>
            <a href="/api/schools.csv">學校 CSV</a>
            <a href="/tools">積分試算</a>
            <Link href="/schools">學校查詢</Link>
            <Link href="/planner">志願清單</Link>
          </div>
          <p className="admin-muted">LINE 密鑰、管理員名單與告警接收者使用環境變數保護。</p>
        </section>
      </section>

      <section className="admin-grid">
        <form
          id="media-upload"
          className="admin-panel"
          action="/api/admin/media"
          method="post"
          encType="multipart/form-data"
        >
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Media Library</p>
              <h2>Podcast／影片上傳</h2>
            </div>
            <span className="admin-badge ok">GitHub 部署</span>
          </div>
          <p className="admin-muted">這裡只上傳你自己的影音。送出後會把檔案與媒體清單寫入 GitHub，觸發 Actions 測試、建置與 Cloudflare 部署；測試站與正式站會讀取同一份版本化內容。</p>
          <label>內容類型<select name="kind" defaultValue="podcast"><option value="podcast">Podcast／音訊</option><option value="video">影片</option></select></label>
          <label>標題<input name="title" maxLength={160} placeholder="例如：志願排序說明" required /></label>
          <label>內容說明<textarea name="summary" rows={3} maxLength={1000} placeholder="給學生看到的內容摘要" /></label>
          <label>影音檔案<input name="media" type="file" accept="audio/*,video/mp4,video/webm,video/quicktime" required /></label>
          <button className="admin-button" type="submit">上傳並同步 GitHub</button>
          <p className="admin-muted">單檔上限 25 MB；支援 MP3、M4A、WAV、OGG、MP4、WebM。</p>
        </form>
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
          <label>
            綠界付款連結（小額捐款／贊助）
            <input
              name="donation_url"
              type="url"
              inputMode="url"
              placeholder="https://payment.ecpay.com.tw/..."
              defaultValue={settingsMap.get("donation_url") ?? ""}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              付款平台（預留）
              <select name="donation_provider" defaultValue={settingsMap.get("donation_provider") ?? "ecpay"}>
                <option value="ecpay">綠界 ECPay</option>
              </select>
            </label>
            <label>
              綠界商店／商戶 ID（預留）
              <input name="donation_merchant_id" defaultValue={settingsMap.get("donation_merchant_id") ?? ""} placeholder="拿到綠界資料後貼上" />
            </label>
          </div>
          <p className="admin-muted">請填入綠界 HTTPS 付款連結；若要讓捐款金額自動帶入，請在網址要帶金額的位置寫入 <code>{"{amount}"}</code>，例如 <code>https://payment.ecpay.com.tw/...?amount={"{amount}"}</code>。本站不處理信用卡資料或付款結果。</p>
          <p className="admin-muted">未來若改成正式 API 建單，再由環境變數設定 HashKey／HashIV 等機密，不會要求你把機密貼進一般後台欄位。</p>
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

function toDatetimeLocal(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("sv-SE", { timeZone: "Asia/Taipei" }).replace(" ", "T").slice(0, 16);
}
