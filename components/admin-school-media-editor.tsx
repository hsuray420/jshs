"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type SchoolOption = Readonly<{ code: string; name: string }>;
const MAX_IMAGE_BYTES = 700_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function formatDimensions(width: number, height: number) { return width && height ? `${width} × ${height}` : "尺寸讀取中"; }

export function AdminSchoolMediaEditor({ schools }: { schools: readonly SchoolOption[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [schoolCode, setSchoolCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const selectedSchool = schools.find((school) => school.code === schoolCode);
  const previewUrl = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : "", [selectedFile]);

  useEffect(() => {
    if (!previewUrl) return;
    const image = new Image();
    image.onload = () => setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = previewUrl;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.kind === "file" && item.type.startsWith("image/"));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) { event.preventDefault(); handleSelectedImage(file); }
      } else if (event.clipboardData?.items.length) setMessage("剪貼簿中沒有圖片檔案；未下載或抓取任何網址圖片。");
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  function validateImage(file: File) {
    if (!ALLOWED_TYPES.has(file.type)) return "圖片格式不符合，請使用 JPEG、PNG 或 WebP。";
    if (!file.size || file.size > MAX_IMAGE_BYTES) return "圖片大小不符合，請使用 700 KB 以內的檔案。";
    return "";
  }

  function handleSelectedImage(file: File) {
    const error = validateImage(file);
    if (error) { setSelectedFile(null); setMessage(error); if (inputRef.current) inputRef.current.value = ""; return; }
    setSelectedFile(file); setDimensions({ width: 0, height: 0 }); setMessage(`${file.name} 已加入待儲存預覽。`);
    if (inputRef.current) {
      try { const transfer = new DataTransfer(); transfer.items.add(file); inputRef.current.files = transfer.files; }
      catch { setMessage("圖片已顯示預覽；請再點擊選擇圖片以完成檔案綁定。"); }
    }
  }

  function removeSelectedImage() { setSelectedFile(null); setDimensions({ width: 0, height: 0 }); setMessage("已移除尚未儲存的新圖片；目前伺服器圖片不會被刪除。"); if (inputRef.current) inputRef.current.value = ""; }
  function handleSubmit(event: FormEvent<HTMLFormElement>) { if (!selectedFile) { event.preventDefault(); setMessage("請先選擇要儲存的圖片。"); return; } setSaving(true); setMessage("正在儲存圖片與素材資訊…"); }

  return <form className="admin-school-media-editor" action="/api/admin/school-media" method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
    <div className="admin-media-section"><div className="admin-media-section-heading"><div><p className="admin-eyebrow">School</p><h3>學校</h3><p className="admin-field-help">先選擇要管理的學校，再加入新的校園圖片。</p></div></div><label>學校搜尋／代碼<input name="school_code" list="school-codes" pattern="[A-Za-z0-9]{4,12}" placeholder="例如 060322" value={schoolCode} onChange={(event) => setSchoolCode(event.target.value)} required /><datalist id="school-codes">{schools.map((school) => <option key={school.code} value={school.code}>{school.name}</option>)}</datalist></label>{selectedSchool ? <p className="admin-school-match"><strong>{selectedSchool.name}</strong><span>{selectedSchool.code}</span></p> : null}</div>
    <div className="admin-media-section"><div className="admin-media-section-heading"><div><p className="admin-eyebrow">Image</p><h3>校園圖片</h3><p className="admin-field-help">支援直接拖曳、點擊選擇，或使用 Cmd/Ctrl + V 貼上剪貼簿中的圖片檔案。</p></div></div><input id="school-image-upload" ref={inputRef} className="admin-visually-hidden" name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleSelectedImage(file); }} required aria-label="選擇校園圖片" />{selectedFile && previewUrl ? <div className="admin-media-preview" aria-label="新圖片預覽"><div className="admin-media-preview-image"><img src={previewUrl} alt="待儲存的新校園圖片預覽" /></div><div className="admin-media-preview-details"><div><p className="admin-preview-kicker">New image preview</p><strong>{selectedFile.name}</strong><p>{formatDimensions(dimensions.width, dimensions.height)} · {formatBytes(selectedFile.size)}</p></div><div className="admin-media-preview-actions"><button type="button" className="admin-button-secondary" onClick={() => inputRef.current?.click()}>更換圖片</button><button type="button" className="admin-button-secondary" onClick={removeSelectedImage}>移除</button></div></div></div> : <label className={`admin-upload-zone ${dragOver ? "is-drag-over" : ""}`} htmlFor="school-image-upload" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }} onDragEnter={(event) => { event.preventDefault(); setDragOver(true); }} onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragOver(false); }} onDrop={(event) => { event.preventDefault(); setDragOver(false); const file = event.dataTransfer.files[0]; if (file) handleSelectedImage(file); }}><span className="admin-upload-icon" aria-hidden="true">＋</span><strong>{dragOver ? "放開以上傳圖片" : "拖曳圖片到這裡"}</strong><span>或點擊選擇圖片</span><small>JPEG、PNG、WebP · 700 KB 以內</small></label>}<p className="admin-paste-status" aria-live="polite">{message}</p></div>
    <div className="admin-media-section admin-media-metadata"><div className="admin-media-section-heading"><div><p className="admin-eyebrow">Metadata</p><h3>素材資訊</h3><p className="admin-field-help">公開前請確認授權與來源資訊完整。</p></div></div><div className="admin-media-metadata-grid"><label>素材類型<select name="source" defaultValue="jshs-owned"><option value="jshs-owned">JSHS 自有／已取得同意</option><option value="official-school-site">學校官方網站</option><option value="licensed-public">具授權的公開素材</option><option value="admin-provided">管理員提供（需填來源）</option></select></label><label>授權／使用依據<input name="license" maxLength={160} placeholder="例如：校方同意、CC BY 4.0" required /></label><label>來源網址（非 JSHS 自有素材必填）<input name="source_url" type="url" maxLength={500} placeholder="https://…" /></label><label>圖片署名（選填）<input name="credit" maxLength={160} /></label><label className="admin-media-metadata-wide">替代文字（選填）<input name="alt" maxLength={160} placeholder="預設為學校名稱＋校園圖片" /></label></div></div>
    <div className="admin-media-actions"><p className="admin-field-help">儲存後才會取代目前前台使用的正式圖片。</p><button className="admin-button" type="submit" disabled={saving}>{saving ? <><span className="admin-button-spinner" aria-hidden="true" />儲存中…</> : "儲存學校圖片"}</button></div>
  </form>;
}
