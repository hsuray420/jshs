"use client";

import { FormEvent, useState } from "react";

type Source = Readonly<{ title: string; url: string; snippet: string }>;
type Action = Readonly<{ label: string; href: string; reason: string }>;

export function AiAssistant({ isMember }: { isMember: boolean }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<readonly Source[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const [remaining, setRemaining] = useState<number | null>(isMember ? null : 2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || question.trim().length < 2) return;
    setLoading(true); setError(""); setAnswer(""); setSources([]); setAction(null);
    const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) }).catch(() => null);
    const data = await response?.json().catch(() => null) as { ok?: boolean; answer?: string; sources?: readonly Source[]; action?: Action; usage?: { remaining?: number | null }; error?: string } | null;
    setLoading(false);
    if (!data?.ok) {
      setError(data?.error === "guest_limit_reached" ? "訪客免費提問次數已用完，登入 LINE 會員後即可不限次數使用。" : data?.error === "assistant_not_configured" ? "AI 小助手正在完成設定，請稍後再試。" : "目前無法回答，請稍後再試。" );
      return;
    }
    setAnswer(data.answer || ""); setSources(data.sources || []); setAction(data.action || null);
    if (typeof data.usage?.remaining === "number") setRemaining(data.usage.remaining);
  }

  return <>
    {open ? <section id="ai" aria-label="AI 問答小助手" className="fixed bottom-24 right-4 z-40 w-[min(420px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-[var(--jshs-border)] bg-white shadow-2xl">
      <div className="border-b border-[var(--jshs-border)] bg-[var(--jshs-primary)] px-5 py-4 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black tracking-widest text-white/70">AI 問答小助手</p><h2 className="mt-1 text-lg font-black">陪你查本站升學資料</h2></div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{isMember ? "會員不限次數" : `訪客剩餘 ${remaining ?? 2} 次`}</span></div><p className="mt-2 text-xs leading-5 text-white/80">只使用本站內容，不連外搜尋；成績與落點請使用專用工具。</p></div>
      <div className="max-h-[min(65vh,560px)] overflow-y-auto p-5"><form onSubmit={submit} className="flex gap-2"><label className="sr-only" htmlFor="ai-question">輸入升學問題</label><input id="ai-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="例如：你好，免試入學是什麼？" className="min-w-0 flex-1" autoFocus /><button type="submit" disabled={loading || question.trim().length < 2} className="rounded-2xl px-4 py-3 text-sm font-black jshs-button-primary disabled:cursor-not-allowed disabled:opacity-50">{loading ? "查找中" : "送出"}</button></form>{error ? <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900" role="alert">{error}<a href="/account" className="ml-2 underline">前往會員登入</a></p> : null}{answer ? <div className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><p className="whitespace-pre-wrap text-sm leading-7 text-[var(--jshs-primary)]">{answer}</p>{action ? <a href={action.href} className="mt-4 inline-flex px-4 py-3 text-sm jshs-button-primary">{action.label} →</a> : null}{sources.length ? <div className="mt-4 border-t border-[var(--jshs-border)] pt-3"><p className="text-xs font-black tracking-wide text-[var(--jshs-muted)]">本站來源</p><div className="mt-2 grid gap-2">{sources.map((source) => <a key={source.url} href={source.url} className="text-xs font-bold text-[var(--jshs-primary)] underline">{source.title} →</a>)}</div></div> : null}</div> : null}</div>
    </section> : null}
    <button type="button" aria-label={open ? "關閉 AI 小助手" : "開啟 AI 小助手"} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-[var(--jshs-primary)] px-5 py-3.5 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"><span className="text-lg" aria-hidden="true">{open ? "×" : "✦"}</span><span>{open ? "關閉小助手" : "AI 小助手"}</span></button>
  </>;
}
