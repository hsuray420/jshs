"use client";

import { useState } from "react";
import { DATA_REPORT_CATEGORIES } from "@/lib/data-report.mjs";

export function DataReportForm({ initialPageUrl = "" }: { initialPageUrl?: string }) {
  const [pageUrl, setPageUrl] = useState(initialPageUrl);
  const [academicYear, setAcademicYear] = useState("");
  const [category, setCategory] = useState("學校資料");
  const [field, setField] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!suggestedValue.trim()) { setStatus("請寫下建議修正內容，讓我們知道要查什麼。"); return; }
    setSubmitting(true);
    setStatus("");
    const response = await fetch("/api/data-reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageUrl, category, academicYear, field, currentValue, suggestedValue, sourceUrl, note, contact }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { ok?: boolean; message?: string; error?: string } | null;
    if (response?.ok && payload?.ok) {
      setField(""); setCurrentValue(""); setSuggestedValue(""); setSourceUrl(""); setNote(""); setContact("");
      setStatus(payload.message || "已收到回報，謝謝你協助維護資料。");
    } else {
      setStatus(payload?.error === "rate_limited" ? "回報次數已達上限，請稍後再試。" : "回報尚未送出，請檢查內容後再試。");
    }
    setSubmitting(false);
  }

  return <div className="mt-6 grid gap-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-5">
    <div className="grid gap-2 sm:grid-cols-3">
      <label className="grid gap-2 text-sm font-bold">問題類型<select value={category} onChange={(event) => setCategory(event.target.value)}>{DATA_REPORT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-bold">資料年度<input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="例如：115" inputMode="numeric" /></label>
      <label className="grid gap-2 text-sm font-bold">頁面 URL<input value={pageUrl} onChange={(event) => setPageUrl(event.target.value)} placeholder="/schools/ct/123" aria-label="頁面 URL" /></label>
    </div>
    <label className="grid gap-2 text-sm font-bold">欄位名稱<input value={field} onChange={(event) => setField(event.target.value)} placeholder="例如：招生名額、地址、科別" /></label>
    <label className="grid gap-2 text-sm font-bold">目前內容<textarea value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} rows={3} placeholder="頁面現在顯示什麼？" /></label>
    <label className="grid gap-2 text-sm font-bold">建議修正內容<textarea value={suggestedValue} onChange={(event) => setSuggestedValue(event.target.value)} rows={3} placeholder="你認為應該顯示什麼？" required /></label>
    <label className="grid gap-2 text-sm font-bold">官方來源（選填）<input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" inputMode="url" /></label>
    <label className="grid gap-2 text-sm font-bold">補充說明（選填）<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="例如：官方簡章第 3 頁或公告日期" /></label>
    <label className="grid gap-2 text-sm font-bold">聯絡方式（選填）<input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="若希望收到回覆，可留下 Email" autoComplete="email" /></label>
    <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={submit} disabled={submitting} className="px-4 py-3 text-sm jshs-button-primary">{submitting ? "送出中…" : "送出資料回報"}</button><p className="text-xs leading-5 jshs-muted-copy">請不要填寫身分證字號、完整地址或其他不必要的個人資料。</p></div>
    {status ? <p role="status" className="text-sm font-bold text-[var(--jshs-primary)]">{status}</p> : null}
  </div>;
}
