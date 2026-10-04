"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";

type Draft = {
  id: string;
  school_code: string;
  file_id: string;
  image_url: string;
  thumbnail_url: string;
  source: string;
  source_url: string;
  license: string;
  credit: string;
  alt: string;
  updated_by: string;
  updated_at: string;
  created_by: string;
};

type School = { code: string; name: string };

export function AdminSchoolMediaDraftReview({ drafts, schools, adminId, canEdit, canPublish }: { drafts: readonly Draft[]; schools: readonly School[]; adminId: string; canEdit: boolean; canPublish: boolean }) {
  const names = new Map(schools.map((school) => [school.code, school.name]));
  return <section className="admin-panel admin-media-draft-review">
    <div className="admin-section-head"><div><p className="admin-eyebrow">Draft review</p><h2>待確認的學校圖片草稿</h2><p className="admin-muted">草稿只保存 ImageKit metadata，不會改變目前正式圖片。只有 Administrator／Owner 可發布。</p></div><span className="admin-badge">{drafts.length} 筆</span></div>
    {drafts.length ? <div className="admin-media-draft-list">{drafts.map((draft) => <article key={draft.id} className="admin-media-draft-item">
      <Image src={draft.thumbnail_url || draft.image_url} width={110} height={76} unoptimized alt={draft.alt || `${names.get(draft.school_code) || draft.school_code}圖片草稿`} />
      <div className="admin-media-draft-info"><strong>{names.get(draft.school_code) || "未知學校"} · {draft.school_code}</strong><span>{draft.license}{draft.credit ? ` · ${draft.credit}` : ""}</span>{draft.source_url ? <a href={draft.source_url} target="_blank" rel="noreferrer">檢視來源 ↗</a> : null}<small>草稿由 {draft.updated_by} 更新 · {formatDate(draft.updated_at)}</small></div>
      {canPublish || canEdit && draft.created_by === adminId ? <div className="admin-row-actions">
        {canPublish ? <ConfirmableForm action="/api/admin/school-media" message={`確認將 ${names.get(draft.school_code) || draft.school_code} 的圖片發布到正式網站？`} confirmLabel="確認發布">
          <input type="hidden" name="action" value="publish-draft" /><input type="hidden" name="draft_id" value={draft.id} />
          <button type="submit">確認發布</button>
        </ConfirmableForm> : null}
        {canPublish || canEdit && draft.created_by === adminId ? <ConfirmableForm action="/api/admin/school-media" message="捨棄此圖片草稿並清理 ImageKit 暫存檔？" confirmLabel="確認捨棄">
          <input type="hidden" name="action" value="discard-draft" /><input type="hidden" name="draft_id" value={draft.id} />
          <button type="submit">捨棄草稿</button>
        </ConfirmableForm> : null}
      </div> : null}
    </article>)}</div> : <p className="admin-muted">目前沒有待確認的圖片草稿。</p>}
  </section>;
}

export function AdminMediaConfirmForm({ schoolCode }: { schoolCode: string }) {
  return <ConfirmableForm action="/api/admin/school-media" message="確定移除目前正式圖片？此操作會影響前台。" confirmLabel="確認移除">
    <input type="hidden" name="action" value="remove" /><input type="hidden" name="school_code" value={schoolCode} /><button type="submit">移除</button>
  </ConfirmableForm>;
}

function ConfirmableForm({ action, message, confirmLabel, children }: { action: string; message: string; confirmLabel: string; children: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  return <>
    <form ref={formRef} action={action} method="post" onSubmit={(event) => { if (!open) { event.preventDefault(); setOpen(true); } }}>
      {children}
    </form>
    {open ? <div className="admin-modal-backdrop" role="presentation"><section className="admin-diff-modal admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title"><h2 id="admin-confirm-title">請確認操作</h2><p>{message}</p><div className="admin-modal-actions"><button className="admin-button-secondary" type="button" onClick={() => setOpen(false)}>取消</button><button className="admin-button" type="button" onClick={() => formRef.current?.submit()}>{confirmLabel}</button></div></section></div> : null}
  </>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(value));
}
