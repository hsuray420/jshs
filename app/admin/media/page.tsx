import Image from "next/image";
import { listAdminFiles } from "../../../db/admin-store";
import { listSchoolMediaDrafts, listSchoolMediaMetadata } from "../../../db/school-media-store";
import { AdminMissingSchoolMediaBatch } from "../../../components/admin-missing-school-media-batch";
import { AdminMediaConfirmForm, AdminSchoolMediaDraftReview } from "../../../components/admin-school-media-review";
import { AdminSchoolMediaEditor } from "../../../components/admin-school-media-editor";
import { getImageKitConfig } from "../../../lib/imagekit-server";
import { getSchoolSearchIndex } from "../../../lib/school-search-index";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ updated?: string; mode?: string; school_code?: string }> }) {
  const admin = await requireAdmin();
  const canEdit = ["editor", "administrator", "owner"].includes(admin.user.role);
  const canPublish = admin.user.role === "owner" || admin.user.role === "administrator";
  const params = await searchParams;
  const [files, schoolMedia, mediaDrafts] = await Promise.all([
    listAdminFiles(),
    listSchoolMediaMetadata(),
    listSchoolMediaDrafts(),
  ]);
  const schools = getSchoolSearchIndex();
  const schoolNames = new Map(schools.map((school) => [school.code, school.name]));
  const mediaCodes = new Set(schoolMedia.map((item) => item.school_code));
  const missingSchools = schools.filter((school) => !mediaCodes.has(school.code));
  const draftedCodes = new Set(mediaDrafts.map((draft) => draft.school_code));
  const batchSchools = missingSchools.filter((school) => !draftedCodes.has(school.code));
  const mediaOptions = params.mode === "missing" ? missingSchools : schools;
  const visibleFiles = files.filter((file) => file.category !== "code-deploy");

  return <>
    <section className="admin-page-heading">
      <div><p className="admin-eyebrow">Operations / Media</p><h1>媒體與檔案</h1><p className="admin-muted">圖片草稿需經管理員確認後才更新正式網站；Podcast、影片與一般檔案分開管理。</p></div>
    </section>
    {params.updated ? <section className="admin-flash">{flashMessage(params.updated)}</section> : null}

    {params.mode === "missing" ? <>
      {canEdit ? <AdminMissingSchoolMediaBatch
        imageKitConfigured={Boolean(getImageKitConfig())}
        schools={batchSchools.map(({ code, name, city, area }) => ({ code, name, city, area }))}
      /> : <section className="admin-panel"><p className="admin-muted">目前角色為唯讀，無法建立圖片草稿。</p></section>}
      <section className="admin-panel admin-missing-media-workspace">
        <div className="admin-section-head">
          <div><p className="admin-eyebrow">Missing images</p><h2>缺圖與待處理學校</h2><p className="admin-muted">已發布圖片會計入覆蓋率；已有草稿的學校保留在待確認清單，不會重複加入批次。</p></div>
          <span className="admin-badge warn">{missingSchools.length} 所缺圖</span>
        </div>
        <div className="admin-missing-school-list">
          {missingSchools.map((school) => <a key={school.code} href={`/admin/media?mode=missing&school_code=${encodeURIComponent(school.code)}#school-image-upload`}>
            <strong>{school.name}{draftedCodes.has(school.code) ? " · 有待審草稿" : ""}</strong>
            <span>{school.code} · {school.city}{school.area ? ` · ${school.area}` : ""}</span>
          </a>)}
          {!missingSchools.length ? <p className="admin-muted">目前所有學校都已有管理員圖片。</p> : null}
        </div>
      </section>
    </> : null}

    {(params.mode !== "missing" || params.school_code) ? <section className="admin-panel admin-school-media-panel">
      <div className="admin-section-head">
        <div><p className="admin-eyebrow">School Media</p><h2>學校圖片管理</h2></div>
        <span className="admin-badge ok">{schoolMedia.length} 所已發布</span>
      </div>
      <p className="admin-muted" data-source-field="source_url">僅接受 JPEG、PNG、WebP、AVIF。D1 只保存 ImageKit metadata；圖片本體不會寫入 D1。</p>
      {canEdit ? <AdminSchoolMediaEditor
        key={params.school_code || "all-schools"}
        imageKitConfigured={Boolean(getImageKitConfig())}
        schools={mediaOptions.map((school) => ({ code: school.code, name: school.name }))}
        initialSchoolCode={params.school_code || ""}
      /> : <p className="admin-muted">目前角色為唯讀。</p>}
      <div className="admin-media-current">
        <div className="admin-section-head"><div><p className="admin-eyebrow">Current images</p><h3>已發布的學校圖片</h3></div></div>
        <div className="admin-deployment-list">
          {schoolMedia.map((item) => <div className="admin-deployment-item" key={item.school_code}>
            <span className="admin-current-media-info">
              <Image
                className="admin-current-media-thumb"
                src={`/api/school-media?code=${encodeURIComponent(item.school_code)}`}
                width={64}
                height={64}
                unoptimized
                alt={`${schoolNames.get(item.school_code) || item.school_code}目前圖片`}
              />
              <span><strong>{schoolNames.get(item.school_code) || "未知學校"}</strong><small>{item.school_code} · {item.source} · {item.license}{item.credit ? ` · ${item.credit}` : ""}</small></span>
            </span>
            <span className="admin-row-actions">
              <a href={`/api/school-media?code=${encodeURIComponent(item.school_code)}`} target="_blank" rel="noreferrer">預覽</a>
              {canPublish ? <AdminMediaConfirmForm schoolCode={item.school_code} /> : null}
            </span>
          </div>)}
          {!schoolMedia.length ? <p className="admin-muted">尚未設定學校圖片。</p> : null}
        </div>
      </div>
    </section> : null}

    <AdminSchoolMediaDraftReview
      drafts={mediaDrafts}
      schools={schools.map(({ code, name }) => ({ code, name }))}
      adminId={admin.user.lineUserId}
      canEdit={canEdit}
      canPublish={canPublish}
    />
    <section className="admin-dashboard-columns">
      <form className="admin-panel admin-module-form" action="/api/admin/media" method="post" encType="multipart/form-data">
        <h2>Podcast／影片</h2>
        <label>類型<select name="kind" defaultValue="podcast"><option value="podcast">Podcast</option><option value="video">影片</option></select></label>
        <label>標題<input name="title" maxLength={160} required /></label>
        <label>摘要<textarea name="summary" rows={3} maxLength={1000} /></label>
        <label>媒體檔案<input name="media" type="file" required /></label>
        <button className="admin-button" type="submit">上傳媒體</button>
      </form>
      <form className="admin-panel admin-module-form" action="/api/admin/files" method="post" encType="multipart/form-data">
        <h2>一般檔案</h2>
        <label>檔案<input name="file" type="file" required /></label>
        <label>分類<input name="category" defaultValue="download" maxLength={80} /></label>
        <label>可見性<select name="visibility" defaultValue="public"><option value="public">公開</option><option value="private">後台私有</option></select></label>
        <label>說明<textarea name="description" rows={3} maxLength={500} /></label>
        <button className="admin-button" type="submit">上傳檔案</button>
      </form>
    </section>
    <section className="admin-panel">
      <div className="admin-section-head"><h2>媒體庫使用狀況</h2><span className="admin-badge ok">{visibleFiles.length} 筆</span></div>
      <div className="admin-deployment-list">
        {visibleFiles.slice(0, 20).map((file) => <div className="admin-deployment-item" key={file.id}>
          <span><strong>{file.file_name}</strong><small>{file.category} · {file.visibility} · {formatBytes(file.size)}</small></span>
          <time>{formatDate(file.created_at)}</time>
        </div>)}
        {!visibleFiles.length ? <p className="admin-muted">尚無媒體或一般檔案。</p> : null}
      </div>
    </section>
  </>;
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(new Date(value));
}

function flashMessage(value: string) {
  const messages: Record<string, string> = {
    school_image_draft_saved: "圖片已保存為後台草稿，正式圖片保持不變。",
    school_image_published: "圖片已確認發布並更新正式網站。",
    school_image_draft_discarded: "圖片草稿已捨棄，系統已清理或排入 ImageKit 清理工作。",
    school_image_draft_missing: "找不到可用的圖片草稿，可能已由其他管理員處理。",
    school_image_draft_conflict: "另一位管理員已有這所學校的待審圖片草稿；請先審閱或捨棄該草稿。",
    school_image_draft_failed: "草稿未能保存；新上傳的 ImageKit 檔案已清理或排入清理工作。",
    school_image_removed: "正式圖片已移除，前台會恢復既有圖片解析或 fallback。",
    school_image_invalid_school: "找不到這個學校代碼，尚未儲存。",
    school_image_invalid_file: "圖片格式或大小不符合（僅接受 JPEG、PNG、WebP、AVIF，5 MB 以內）。",
    school_image_invalid_provenance: "來源或授權資訊不完整，尚未儲存。",
    school_image_upload_failed: "ImageKit 上傳失敗，正式網站與後台草稿均未變更。",
    school_image_delete_failed: "ImageKit 刪除失敗，正式圖片設定未變更。",
    school_image_not_configured: "圖片服務尚未設定，請至系統資源完成 ImageKit 設定；未上傳圖片，也未儲存到 D1。",
  };
  return messages[value] || "操作完成。";
}
