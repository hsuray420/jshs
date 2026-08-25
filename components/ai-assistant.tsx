"use client";

import { FormEvent, useState } from "react";

type Source = Readonly<{ title: string; url: string; snippet: string }>;
type Action = Readonly<{ label: string; href: string; reason: string }>;

export function AiAssistant({ isMember }: { isMember: boolean }) {
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

  return <section id="ai" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="p-6 md:p-8 jshs-surface-card"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="jshs-eyebrow">AI 問答小幫手</p><h2 className="mt-2">只用本站資料回答你的升學問題</h2><p className="mt-2 max-w-3xl text-sm leading-7 jshs-muted-copy">不替你算成績；遇到成績、積分或落點問題，會直接帶你到對應工具。答案會附本站來源，正式規則仍以官方公告為準。</p></div><span className="jshs-chip">{isMember ? "會員不限次數" : `訪客剩餘 ${remaining ?? 2} 次`}</span></div><form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="ai-question">輸入升學問題</label><input id="ai-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="例如：中投區的就學區包含哪些地方？" className="min-w-0 flex-1" /><button type="submit" disabled={loading || question.trim().length < 2} className="px-5 py-3.5 text-sm jshs-button-primary disabled:cursor-not-allowed disabled:opacity-50">{loading ? "查找本站資料…" : "詢問小助手"}</button></form>{error ? <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900" role="alert">{error}<a href="/account" className="ml-2 underline">前往會員登入</a></p> : null}{answer ? <div className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><p className="whitespace-pre-wrap text-sm leading-7 text-[var(--jshs-primary)]">{answer}</p>{action ? <a href={action.href} className="mt-4 inline-flex px-4 py-3 text-sm jshs-button-primary">{action.label} →</a> : null}{sources.length ? <div className="mt-5 border-t border-[var(--jshs-border)] pt-4"><p className="text-xs font-black tracking-wide text-[var(--jshs-muted)]">本站來源</p><div className="mt-2 grid gap-2">{sources.map((source) => <a key={source.url} href={source.url} className="text-xs font-bold text-[var(--jshs-primary)] underline">{source.title} →</a>)}</div></div> : null}</div> : null}</div></section>;
}
