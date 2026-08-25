"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { AiChatMarkdown } from "./ai-chat-markdown";
import { appendMessage, ChatConversation, ChatMessage, createConversation, getAllConversations, getConversation, getCurrentConversationId, setCurrentConversationId, updateConversation } from "../lib/ai-chat-storage";

type Source = Readonly<{ title: string; url: string; snippet?: string }>;
type Action = Readonly<{ label: string; href: string; reason: string }>;
type WorkspaceMode = "floating" | "full";
const suggestions = ["幫我分析 CSV", "免試入學是什麼？", "我現在該做什麼？", "幫我整理升學資訊"];

function makeMessage(role: ChatMessage["role"], content: string, extra: Partial<ChatMessage> = {}): ChatMessage { return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, content, createdAt: Date.now(), ...extra }; }

function useConversation(initialId = "") {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const refresh = useCallback(async () => { const all = await getAllConversations(); setConversations(all); const current = initialId || getCurrentConversationId(); const selected = (current && await getConversation(current)) || all[0] || await createConversation(); setCurrentConversationId(selected.id); setConversation(selected); }, [initialId]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  async function select(next: ChatConversation) { setCurrentConversationId(next.id); setConversation(next); }
  async function newConversation() { const next = await createConversation(); setConversation(next); setConversations((items) => [next, ...items]); }
  async function save(next: ChatConversation) { setConversation(next); await updateConversation(next); setConversations((items) => [next, ...items.filter((item) => item.id !== next.id)].sort((a, b) => b.updatedAt - a.updatedAt)); }
  return { conversation, conversations, select, newConversation, save };
}

async function requestAssistant(question: string, onDone: (data: { answer: string; sources: readonly Source[]; action?: Action; usage?: { remaining?: number | null } }) => void, onDelta?: (answer: string) => void) {
  const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, stream: true }) });
  if (!response.ok) throw Object.assign(new Error("assistant_failed"), { code: (await response.json().catch(() => null) as { error?: string } | null)?.error });
  if (!response.body) return onDone(await response.json());
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let payload = ""; let answer = ""; let metadata: { sources: readonly Source[]; usage?: { remaining?: number | null } } = { sources: [] };
  while (true) { const chunk = await reader.read(); if (chunk.done) break; for (const event of decoder.decode(chunk.value, { stream: true }).split("\n\n")) { const data = event.replace(/^data:\s*/, "").trim(); if (!data || data === "[DONE]") continue; const parsed = JSON.parse(data) as { delta?: string; meta?: typeof metadata; answer?: string }; if (parsed.meta) metadata = parsed.meta; if (parsed.delta) { answer += parsed.delta; onDelta?.(answer); } if (parsed.answer) payload += data; } }
  onDone(answer ? { answer, ...metadata } : JSON.parse(payload));
}

function ErrorNotice({ error, onRetry }: { error: string; onRetry: () => void }) { return <div className="ai-chat-error" role="alert"><p>{error}</p><button type="button" onClick={onRetry}>重新嘗試</button></div>; }

function Message({ message, onRetry }: { message: ChatMessage; onRetry?: () => void }) {
  return <article className={`ai-chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`}><div className="ai-chat-avatar" aria-hidden="true">{message.role === "assistant" ? "✦" : "你"}</div><div className="ai-chat-message-body"><span className="ai-chat-message-label">{message.role === "assistant" ? "AI 小助手" : "你"}</span><AiChatMarkdown content={message.content} />{message.action ? <Link className="ai-chat-action" href={message.action.href}>{message.action.label} <span aria-hidden="true">↗</span></Link> : null}{message.sources?.length ? <details className="ai-chat-sources"><summary>本站來源（{message.sources.length}）</summary>{message.sources.map((source) => <a key={source.url} href={source.url}>{source.title} <span aria-hidden="true">↗</span></a>)}</details> : null}{message.error ? <button type="button" className="ai-chat-retry" onClick={onRetry}>重新嘗試</button> : null}</div></article>;
}

function ChatInput({ value, loading, onChange, onSubmit }: { value: string; loading: boolean; onChange: (value: string) => void; onSubmit: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSubmit(); } }
  function resize() { if (!ref.current) return; ref.current.style.height = "auto"; ref.current.style.height = `${Math.min(ref.current.scrollHeight, 140)}px`; }
  return <div className="ai-chat-composer"><textarea ref={ref} value={value} rows={1} maxLength={500} onChange={(event) => { onChange(event.target.value); resize(); }} onKeyDown={handleKeyDown} placeholder="輸入訊息…" aria-label="輸入訊息" disabled={loading} /><button type="button" aria-label="送出訊息" onClick={onSubmit} disabled={loading || value.trim().length < 2}>{loading ? <span className="ai-chat-spinner" aria-hidden="true" /> : "↑"}</button><small>本站內容助手，不連外搜尋；重要資訊請以官方公告為準。</small></div>;
}

function ChatWorkspace({ mode, isMember, onClose, initialConversationId = "" }: { mode: WorkspaceMode; isMember: boolean; onClose?: () => void; initialConversationId?: string }) {
  const { conversation, conversations, newConversation, select, save } = useConversation(initialConversationId);
  const [question, setQuestion] = useState(""); const [lastQuestion, setLastQuestion] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [remaining, setRemaining] = useState<number | null>(isMember ? null : 2); const [draftAnswer, setDraftAnswer] = useState(""); const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation?.messages.length, draftAnswer]);
  async function submit(event?: FormEvent, forcedQuestion?: string) {
    event?.preventDefault(); const text = (forcedQuestion ?? question).trim(); if (loading || text.length < 2 || !conversation) return; const userMessage = makeMessage("user", text); const withUser = appendMessage(conversation, userMessage); await save(withUser); setLastQuestion(text); setQuestion(""); setLoading(true); setError(""); setDraftAnswer("");
    try { await requestAssistant(text, async (data) => { setRemaining(typeof data.usage?.remaining === "number" ? data.usage.remaining : remaining); const answer = data.answer || "本站目前沒有足夠資料可以確認這件事，請查看來源頁面或官方公告。"; setDraftAnswer(answer); await save(appendMessage(withUser, makeMessage("assistant", answer, { sources: data.sources, action: data.action }))); }, (partial) => setDraftAnswer(partial)); }
    catch (cause) { const code = (cause as { code?: string }).code; setError(code === "guest_limit_reached" ? "訪客免費提問次數已用完，登入 LINE 會員後即可不限次數使用。" : "抱歉，剛才沒有成功完成這次請求。"); await save(appendMessage(withUser, makeMessage("assistant", "這次請求沒有完成。", { error: true }))); }
    finally { setDraftAnswer(""); setLoading(false); }
  }
  return <section className={`ai-chat-window ai-chat-${mode}`} aria-label="AI 小助手"><header className="ai-chat-header"><div className="ai-chat-brand"><span className="ai-chat-logo" aria-hidden="true">✦</span><div><strong>AI 小助手</strong><small>{isMember ? "會員不限次數" : `訪客剩餘 ${remaining ?? 2} 次`}</small></div></div><div className="ai-chat-header-actions"><button type="button" onClick={newConversation} aria-label="新增對話" title="新增對話">＋</button>{mode === "floating" ? <Link href={`/ai${conversation ? `?conversation=${conversation.id}` : ""}`} aria-label="開啟完整對話" title="開啟完整對話">↗</Link> : null}{onClose ? <button type="button" onClick={onClose} aria-label="關閉 AI 小助手" title="關閉">×</button> : null}</div></header>{mode === "floating" ? <p className="ai-chat-scope">只根據本站資料回答；成績與落點請使用專用工具。</p> : null}<div className="ai-chat-body"><div className="ai-chat-messages">{conversation?.messages.length ? conversation.messages.map((message) => <Message key={message.id} message={message} onRetry={() => void submit(undefined, lastQuestion)} />) : <div className="ai-chat-empty"><span className="ai-chat-empty-logo" aria-hidden="true">✦</span><h2>你好，我是 AI 小助手</h2><p>有什麼我可以幫你處理的？</p><div className="ai-chat-suggestions">{suggestions.map((item) => <button key={item} type="button" onClick={() => setQuestion(item)}>{item}</button>)}</div></div>}{loading ? <div className="ai-chat-message is-assistant"><div className="ai-chat-avatar" aria-hidden="true">✦</div><div className="ai-chat-message-body"><span className="ai-chat-message-label">AI 小助手</span>{draftAnswer ? <AiChatMarkdown content={draftAnswer} /> : <span className="ai-chat-dots" aria-label="AI 正在思考"><i /> <i /> <i /></span>}</div></div> : null}{error ? <ErrorNotice error={error} onRetry={() => void submit(undefined, lastQuestion)} /> : null}<div ref={bottomRef} /></div></div><form onSubmit={submit}><ChatInput value={question} loading={loading} onChange={setQuestion} onSubmit={() => void submit()} /></form>{mode === "full" ? <aside className="ai-chat-sidebar" aria-label="本機對話"><div className="ai-chat-sidebar-head"><strong>本機對話</strong><button type="button" onClick={newConversation}>＋ 新對話</button></div><div className="ai-chat-conversation-list">{conversations.map((item) => <button key={item.id} type="button" className={item.id === conversation?.id ? "is-active" : ""} onClick={() => void select(item)}>{item.title}</button>)}</div><p>對話只儲存在這台裝置的 IndexedDB，不會上傳雲端。</p></aside> : null}</section>;
}

// The widget is fixed bottom/right on every route; the full app reuses the same local conversation.
export function AiAssistant({ isMember = false }: { isMember?: boolean }) { const [open, setOpen] = useState(false); return <div className="ai-chat-root">{open ? <ChatWorkspace mode="floating" isMember={isMember} onClose={() => setOpen(false)} /> : null}<button type="button" className="ai-chat-floating-button" aria-label={open ? "關閉 AI 小助手" : "開啟 AI 小助手"} aria-expanded={open} onClick={() => setOpen((value) => !value)}><span aria-hidden="true">{open ? "×" : "✦"}</span>{!open ? <span className="ai-chat-floating-label">AI 小助手</span> : null}</button></div>; }
export function AiChatPage({ isMember = false, initialConversationId = "" }: { isMember?: boolean; initialConversationId?: string }) { return <main className="ai-chat-page"><ChatWorkspace mode="full" isMember={isMember} initialConversationId={initialConversationId} /></main>; }
