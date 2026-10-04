"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type School = { code: string; name: string; city: string; area: string };
type QueueItem = { id: string; file: File; previewUrl: string; schoolCode: string; alt: string };
type BatchResult = { schoolCode: string; schoolName: string; status: "saved" | "failed"; message: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function AdminMissingSchoolMediaBatch({ schools, imageKitConfigured }: { schools: readonly School[]; imageKitConfigured: boolean }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [source, setSource] = useState("jshs-owned");
  const [sourceUrl, setSourceUrl] = useState("");
  const [license, setLicense] = useState("");
  const [credit, setCredit] = useState("");
  const [message, setMessage] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const activePreviewUrls = useRef(new Set<string>());

  useEffect(() => () => {
    activePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    activePreviewUrls.current.clear();
  }, []);

  function addFiles(fileList: FileList | null) {
    const incoming = Array.from(fileList || []);
    const invalid = incoming.find((file) => !ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_IMAGE_BYTES);
    if (invalid) { setMessage(`${invalid.name} 格式不符或超過 5 MB；本次未加入檔案。`); return; }
    const used = new Set(items.map((item) => item.schoolCode));
    const freeSchools = schools.filter((school) => !used.has(school.code));
    if (!incoming.length) return;
    if (incoming.length > freeSchools.length) {
      setMessage(`目前只剩 ${freeSchools.length} 所可選學校，無法安全配對 ${incoming.length} 個檔案；請先調整選取範圍。`);
      return;
    }
    const queue = incoming.map((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      activePreviewUrls.current.add(previewUrl);
      return { id: crypto.randomUUID(), file, previewUrl, schoolCode: freeSchools[index].code, alt: `${freeSchools[index].name}校園圖片` };
    });
    setItems((current) => [...current, ...queue]);
    setMessage(`已將 ${incoming.length} 張圖片加入待處理清單；請逐張確認學校配對。`);
    setResults([]);
  }

  function addFileForSchool(file: File, schoolCode: string) {
    if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setMessage(`${file.name} 格式不符或超過 5 MB；本次未加入檔案。`);
      return;
    }
    const existing = items.find((item) => item.schoolCode === schoolCode);
    if (existing) {
      URL.revokeObjectURL(existing.previewUrl);
      activePreviewUrls.current.delete(existing.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    activePreviewUrls.current.add(previewUrl);
    const school = schools.find((entry) => entry.code === schoolCode);
    const next = { id: existing?.id || crypto.randomUUID(), file, previewUrl, schoolCode, alt: `${school?.name || schoolCode}校園圖片` };
    setItems((current) => existing ? current.map((item) => item.id === existing.id ? next : item) : [...current, next]);
    setResults([]);
    setMessage(`${school?.name || schoolCode} 已加入待處理清單；圖片仍是未保存草稿。`);
  }

  function updateItem(id: string, values: Partial<Pick<QueueItem, "schoolCode" | "alt">>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...values } : item));
  }

  const duplicateSchool = new Set(items.map((item) => item.schoolCode)).size !== items.length;
  const sourceRequiresUrl = source !== "jshs-owned";
  const sourceUrlIsValid = !sourceRequiresUrl || isHttpsUrl(sourceUrl);

  async function saveBatch() {
    if (!items.length || saving || duplicateSchool || !license.trim() || !sourceUrlIsValid || !imageKitConfigured) return;
    setSaving(true);
    setReviewOpen(false);
    const nextResults: BatchResult[] = [];
    for (const item of items) {
      const school = schools.find((entry) => entry.code === item.schoolCode);
      const form = new FormData();
      form.set("action", "save-draft");
      form.set("school_code", item.schoolCode);
      form.set("image", item.file);
      form.set("source", source);
      form.set("source_url", sourceUrl);
      form.set("license", license);
      form.set("credit", credit);
      form.set("alt", item.alt || `${school?.name || item.schoolCode}校園圖片`);
      let response = await fetch("/api/admin/school-media", { method: "POST", body: form, redirect: "follow" }).catch(() => null);
      if (response?.status === 429) {
        const wait = Math.min(60, Math.max(1, Number(response.headers.get("retry-after") || 1)));
        setMessage(`已達圖片服務速率限制，將等待 ${wait} 秒後繼續；已保存項目不會重複提交。`);
        await new Promise((resolve) => setTimeout(resolve, wait * 1000));
        response = await fetch("/api/admin/school-media", { method: "POST", body: form, redirect: "follow" }).catch(() => null);
      }
      const outcome = response?.ok ? new URL(response.url).searchParams.get("updated") : null;
      const saved = outcome === "school_image_draft_saved";
      nextResults.push({
        schoolCode: item.schoolCode,
        schoolName: school?.name || item.schoolCode,
        status: saved ? "saved" : "failed",
        message: saved ? "已保存草稿，尚未發布" : uploadFailureMessage(outcome),
      });
      setResults([...nextResults]);
    }
    setSaving(false);
    setMessage(nextResults.every((result) => result.status === "saved")
      ? `${nextResults.length} 張圖片均已保存為草稿；請至下方草稿區逐筆確認發布。`
      : "批次已完成但有項目失敗；請查看結果。已成功的項目仍只是草稿。");
  }

  return <section className="admin-panel admin-media-batch">
    <div className="admin-section-head"><div><p className="admin-eyebrow">Batch image intake</p><h2>缺圖批次處理</h2><p className="admin-muted">一次選取多張圖片、逐張指定學校並預覽配對；保存後是 ImageKit 草稿，不會改動正式圖片。</p></div><span className="admin-badge">{schools.length} 所可配對</span></div>
    {!imageKitConfigured ? <p className="admin-alert" role="alert">ImageKit 未設定，禁止上傳；不會改用 D1 儲存圖片。</p> : null}
    <label className="admin-batch-file-label">選取多張圖片<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={!imageKitConfigured || saving} onChange={(event) => { addFiles(event.target.files); event.currentTarget.value = ""; }} /></label>
    <div className="admin-media-metadata-grid">
      <label>素材類型<select value={source} onChange={(event) => setSource(event.target.value)}><option value="jshs-owned">JSHS 自有／已取得同意</option><option value="official-school-site">學校官方網站</option><option value="licensed-public">具授權的公開素材</option><option value="admin-provided">管理員提供</option></select></label>
      <label>授權／使用依據<input value={license} onChange={(event) => setLicense(event.target.value)} maxLength={160} placeholder="例如：校方同意、CC BY 4.0" required /></label>
      <label>來源網址（非自有素材必填）<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} maxLength={500} placeholder="https://…" required={sourceRequiresUrl} /></label>
      <label>圖片署名（選填）<input value={credit} onChange={(event) => setCredit(event.target.value)} maxLength={160} /></label>
    </div>
    {items.length ? <p className="admin-batch-summary" role="status">已準備 {items.length} 間學校 · 共 {items.length} 張圖片</p> : null}
    {items.length ? <div className="admin-media-batch-list">{items.map((item) => {
      const school = schools.find((entry) => entry.code === item.schoolCode);
      return <article className="admin-media-batch-item" key={item.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) addFileForSchool(file, item.schoolCode); }}>
        <Image src={item.previewUrl} width={92} height={68} unoptimized alt={`待配對圖片：${item.file.name}`} />
        <div><strong>{item.file.name}</strong><small>{formatBytes(item.file.size)}</small></div>
        <label>關聯學校<select value={item.schoolCode} onChange={(event) => updateItem(item.id, { schoolCode: event.target.value })}><option value="">選擇學校</option>{schools.map((candidate) => <option key={candidate.code} value={candidate.code} disabled={items.some((other) => other.id !== item.id && other.schoolCode === candidate.code)}>{candidate.name} · {candidate.code}</option>)}</select></label>
        <label>替代文字<input value={item.alt} onChange={(event) => updateItem(item.id, { alt: event.target.value })} maxLength={160} /></label>
        <button className="admin-button-secondary" type="button" onClick={() => { URL.revokeObjectURL(item.previewUrl); activePreviewUrls.current.delete(item.previewUrl); setItems((current) => current.filter((entry) => entry.id !== item.id)); }}>移除</button>
        <small>{school ? `${school.name} · ${school.city}${school.area ? ` ${school.area}` : ""}` : "尚未選擇學校"}</small>
      </article>;
    })}</div> : <p className="admin-muted">尚未選取圖片。也可以直接把圖片拖到下方指定學校。</p>}
    <div className="admin-missing-drop-list" aria-label="缺少圖片的學校拖放目標">{schools.filter((school) => !items.some((item) => item.schoolCode === school.code)).map((school) => <div key={school.code} className="admin-missing-drop-target" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) addFileForSchool(file, school.code); }}><strong>{school.name}</strong><span>{school.code} · {school.city}{school.area ? ` · ${school.area}` : ""}</span><small>拖曳圖片到這裡</small></div>)}</div>
    {results.length ? <ul className="admin-batch-results" aria-live="polite">{results.map((result) => <li key={result.schoolCode} className={result.status}><strong>{result.schoolName}</strong><span>{result.message}</span></li>)}</ul> : null}
    <p className="admin-paste-status" role="status">{message}</p>
    <button className="admin-button" type="button" disabled={!items.length || !license.trim() || !sourceUrlIsValid || duplicateSchool || saving || !imageKitConfigured} onClick={() => setReviewOpen(true)}>預覽批次配對</button>
    {reviewOpen ? <div className="admin-modal-backdrop" role="presentation"><section className="admin-diff-modal admin-batch-review-dialog" role="dialog" aria-modal="true" aria-labelledby="media-batch-title">
      <p className="admin-eyebrow">Batch review</p><h2 id="media-batch-title">確認 {items.length} 張圖片的學校配對</h2>
      <p>這一步只會上傳至 ImageKit 並建立私有後台草稿，不會發布至正式學校頁面。</p>
      <ul>{items.map((item) => <li key={item.id}><strong>{schools.find((school) => school.code === item.schoolCode)?.name || item.schoolCode}</strong><span>{item.file.name} · {item.alt}</span></li>)}</ul>
      <div className="admin-modal-actions"><button className="admin-button-secondary" type="button" onClick={() => setReviewOpen(false)}>返回調整</button><button className="admin-button" type="button" onClick={() => void saveBatch()}>確認保存 {items.length} 筆草稿</button></div>
    </section></div> : null}
  </section>;
}

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

function uploadFailureMessage(code: string | null) {
  const messages: Record<string, string> = {
    school_image_invalid_school: "學校代碼不正確",
    school_image_invalid_file: "圖片格式或大小不符",
    school_image_invalid_provenance: "來源／授權資料不完整",
    school_image_upload_failed: "ImageKit 上傳失敗",
    school_image_not_configured: "ImageKit 未設定",
    school_image_draft_failed: "草稿保存失敗；已嘗試清理 ImageKit 檔案",
  };
  return messages[code || ""] || "請求失敗，草稿未確認保存";
}
