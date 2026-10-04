"use client";

import { useEffect, useMemo, useState } from "react";

type MockRecord = { id: string; name: string; date: string; subjects: Record<string, number | null>; essay: string; createdAt: string; updatedAt?: string };
const KEY = "jshs_mock_exam_records";
const subjects = ["國文", "數學", "英文", "社會", "自然"] as const;
type FormState = { name: string; date: string; subjects: Record<string, string>; essay: string };

function newForm(): FormState { return { name: "", date: new Date().toISOString().slice(0, 10), subjects: Object.fromEntries(subjects.map((subject) => [subject, ""])), essay: "" }; }
function formFromRecord(record: MockRecord): FormState { return { name: record.name, date: record.date, subjects: Object.fromEntries(subjects.map((subject) => [subject, record.subjects[subject] == null ? "" : String(record.subjects[subject])])), essay: record.essay }; }
function parseLocal(): MockRecord[] { try { const value = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }

export function MockExamWorkspace({ mode = "manage", isMember = false }: { mode?: "manage" | "trends"; isMember?: boolean }) {
  const [records, setRecords] = useState<MockRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(newForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const localRecords = parseLocal();
      try {
        if (!isMember) setRecords(localRecords);
        else {
          const response = await fetch("/api/mock-exams", { headers: { accept: "application/json" } });
          if (!response.ok) throw new Error("sync");
          const payload = await response.json() as { records?: MockRecord[] };
          const cloudRecords = payload.records || [];
          setRecords(cloudRecords.sort((a, b) => b.date.localeCompare(a.date)));
        }
      } catch { setRecords(localRecords); setError(isMember ? "會員模考紀錄同步失敗，仍顯示本機資料；請重試。" : "讀取本機模考紀錄失敗，請重試。"); }
      finally { setLoaded(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isMember]);

  async function saveRecord(record: MockRecord) {
    const next = [record, ...records.filter((item) => item.id !== record.id)].sort((a, b) => b.date.localeCompare(a.date));
    setRecords(next); localStorage.setItem(KEY, JSON.stringify(next));
    if (isMember) {
      const response = await fetch("/api/mock-exams", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record) });
      if (!response.ok) throw new Error("sync");
    }
  }

  async function removeRecord(id: string) {
    const previous = records;
    const next = previous.filter((record) => record.id !== id);
    setRecords(next); localStorage.setItem(KEY, JSON.stringify(next));
    if (isMember) {
      const response = await fetch("/api/mock-exams", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) { setRecords(previous); localStorage.setItem(KEY, JSON.stringify(previous)); throw new Error("delete"); }
    }
  }

  async function clearRecords() {
    const previous = records; setRecords([]); localStorage.setItem(KEY, "[]");
    if (isMember) { const response = await fetch("/api/mock-exams", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) }); if (!response.ok) { setRecords(previous); localStorage.setItem(KEY, JSON.stringify(previous)); throw new Error("clear"); } }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const parsed = Object.fromEntries(subjects.map((subject) => [subject, form.subjects[subject] === "" ? null : Number(form.subjects[subject])])) as Record<string, number | null>;
    if (!form.name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.date) || Object.values(parsed).some((value) => value !== null && (!Number.isInteger(value) || value < 0 || value > 100))) { setError("請填寫考試名稱、有效日期與 0–100 的整數科目分數。"); return; }
    setSaving(true);
    const existing = editingId ? records.find((record) => record.id === editingId) : undefined;
    const record: MockRecord = { id: existing?.id || crypto.randomUUID(), name: form.name.trim(), date: form.date, subjects: parsed, essay: form.essay.trim().slice(0, 40), createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    try { await saveRecord(record); setForm(newForm()); setEditingId(null); } catch { setError(isMember ? "保存或同步失敗，資料已留在本機，請重試。" : "保存失敗，請檢查瀏覽器儲存空間後重試。"); } finally { setSaving(false); }
  }

  async function runAction(action: () => Promise<void>, message: string) { setError(""); try { await action(); } catch { setError(message); } }
  const trend = useMemo(() => subjects.map((subject) => { const values = [...records].sort((a, b) => b.date.localeCompare(a.date)).map((record) => record.subjects[subject]).filter((value): value is number => typeof value === "number"); return { subject, latest: values[0], best: values.length ? Math.max(...values) : undefined, delta: values.length > 1 ? values[0] - values[1] : undefined }; }), [records]);
  if (!loaded) return <section className="jshs-state-card"><h2>載入模考紀錄中</h2></section>;
  if (mode === "trends") return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="jshs-surface-card p-6"><h2>科目趨勢與待加強</h2>{records.length < 2 ? <p className="mt-3 jshs-muted-copy">{records.length === 0 ? "尚無紀錄，新增至少兩次模考後才能分析。" : "目前只有一筆資料，先保存下一次模考才能比較變化。"}</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{trend.map((item) => <article key={item.subject} className="rounded-xl bg-[var(--jshs-muted-surface)] p-4"><strong>{item.subject}</strong><p className="mt-2 text-sm">最新 {item.latest ?? "尚未提供"} · 最高 {item.best ?? "尚未提供"}</p><p className="mt-1 text-sm">近期變化：{item.delta === undefined ? "資料不足" : `${item.delta > 0 ? "+" : ""}${item.delta}`}</p></article>)}</div>}</div><p className="mt-4 text-sm jshs-muted-copy">分析只使用你保存的五科分數，不推測逐題錯誤、排名或章節弱點。</p></section>;
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><form onSubmit={submit} className="jshs-surface-card grid gap-3 p-6"><h2>{editingId ? "編輯模擬考紀錄" : "建立模擬考紀錄"}</h2><input aria-label="考試名稱" placeholder="考試名稱" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><input aria-label="考試日期" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />{subjects.map((subject) => <input key={subject} aria-label={`${subject}成績`} type="number" min="0" max="100" step="1" placeholder={`${subject}分數（可留白）`} value={form.subjects[subject]} onChange={(event) => setForm({ ...form, subjects: { ...form.subjects, [subject]: event.target.value } })} />)}<input aria-label="作文成績" type="text" placeholder="作文級分或標示（可留白）" value={form.essay} onChange={(event) => setForm({ ...form, essay: event.target.value })} /><div className="flex flex-wrap gap-2"><button className="jshs-button-primary" type="submit" disabled={saving}>{saving ? "保存中…" : editingId ? "更新模考" : "保存模考"}</button>{editingId ? <button type="button" className="jshs-button-secondary" onClick={() => { setEditingId(null); setForm(newForm()); }}>取消編輯</button> : null}</div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<p className="text-xs jshs-muted-copy">未登入時保存於本機；登入後同步會員資料。本站不產生答案、排名或錄取預測。</p></form><div className="jshs-surface-card p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2>歷次紀錄</h2><button type="button" className="text-sm text-red-700" onClick={() => runAction(clearRecords, "清除同步失敗，請重試。")}>清除全部</button></div>{!records.length ? <p className="mt-4 jshs-muted-copy">尚無紀錄，先建立一次模擬考。</p> : <div className="mt-4 grid gap-3">{records.map((record) => <article key={record.id} className="rounded-xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap justify-between gap-3"><strong>{record.name}</strong><time dateTime={record.date}>{record.date}</time></div><p className="mt-2 text-sm">{subjects.map((subject) => `${subject} ${record.subjects[subject] ?? "未提供"}`).join(" · ")}</p><div className="mt-3 flex flex-wrap gap-3 text-sm"><button type="button" className="font-bold text-[var(--jshs-primary)]" onClick={() => { setEditingId(record.id); setForm(formFromRecord(record)); }}>編輯</button><button type="button" className="font-bold text-[var(--jshs-primary)]" onClick={() => setViewedId((current) => current === record.id ? null : record.id)}>{viewedId === record.id ? "收起詳情" : "查看詳情"}</button><button type="button" className="font-bold text-red-700" onClick={() => runAction(() => removeRecord(record.id), "刪除同步失敗，資料已保留，請重試。")}>刪除</button></div>{viewedId === record.id ? <div className="mt-3 border-t border-[var(--jshs-border)] pt-3 text-sm leading-6"><p>作文：{record.essay || "尚未提供"}</p><p>建立：{new Date(record.createdAt).toLocaleString("zh-TW")}</p><p>最後更新：{record.updatedAt ? new Date(record.updatedAt).toLocaleString("zh-TW") : "尚未提供"}</p></div> : null}</article>)}</div>}</div></div></section>;
}
