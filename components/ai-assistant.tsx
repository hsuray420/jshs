"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AiChatMarkdown } from "./ai-chat-markdown";
import { appendMessage, ChatConversation, ChatMessage, createConversation, getAllConversations, getConversation, getCurrentConversationId, removeMessage, replaceMessage, setCurrentConversationId, updateConversation } from "../lib/ai-chat-storage";

type Source = Readonly<{ title: string; url: string; snippet?: string }>;
type Action = Readonly<{ label: string; href: string; reason: string }>;
type WorkspaceMode = "floating" | "full";
type ChatResult = { answer: string; sources: readonly Source[]; action?: Action; usage?: { remaining?: number | null }; intent?: string };
type StreamEvent = { delta?: string; meta?: Omit<ChatResult, "answer">; answer?: string; error?: string };
type ChatError = Error & { code?: string; status?: number };
type FailedRequest = { conversationId: string; question: string };
type ActiveRequest = { conversationId: string; requestId: string; assistantMessageId: string; controller: AbortController };
type FloatingButtonOffset = { x: number; y: number };

const suggestions = ["免試入學是什麼？", "中投區積分怎麼算？", "幫我寫一個 Python for loop", "幫我整理成表格"];
const thinkingStates = ["正在思考", "正在整理你的問題", "正在找出重點", "正在檢查回答內容", "正在準備完整說明", "再一下下，馬上好了"];
const isUsableHistoryMessage = (message: ChatMessage) => message.status !== "error" && !message.error;
const aiDataNotice = "訊息會送到服務端與 AI 系統產生回答；訪客聊天紀錄留在本機 IndexedDB，會員對話會同步到本站伺服器。";

function makeId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function makeMessage(conversationId: string, role: ChatMessage["role"], content: string, extra: Partial<ChatMessage> = {}): ChatMessage { return { id: makeId(), conversationId, role, content, createdAt: Date.now(), status: "complete", ...extra }; }
function logDebug(event: string, details: Record<string, string | number | undefined>) { if (process.env.NODE_ENV === "development") console.debug(`[AI ${event}]`, details); }

function createFrameBatcher(onDelta: (answer: string) => void) {
  let frame = 0;
  let latest = "";
  let resolveFlush: (() => void) | null = null;
  const flush = () => { if (frame) return; frame = window.requestAnimationFrame(() => { frame = 0; onDelta(latest); resolveFlush?.(); resolveFlush = null; }); };
  return { push(answer: string) { latest = answer; flush(); }, flush() { if (!frame) return Promise.resolve(); return new Promise<void>((resolve) => { resolveFlush = resolve; }); } };
}

async function simulateTyping(answer: string, signal: AbortSignal, onDelta: (value: string) => void) {
  let index = 0;
  let visible = "";
  while (index < answer.length) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const count = Math.min(answer.length - index, 1 + Math.floor(Math.random() * 3));
    visible += answer.slice(index, index + count);
    index += count;
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => { onDelta(visible); resolve(); }));
    const last = visible.at(-1) || "";
    if ("，。！？、\n".includes(last)) await new Promise((resolve) => window.setTimeout(resolve, 60 + Math.floor(Math.random() * 61)));
    else await new Promise((resolve) => window.setTimeout(resolve, 12 + Math.floor(Math.random() * 25)));
  }
}

async function requestAssistant(question: string, history: readonly ChatMessage[], signal: AbortSignal, onDelta: (answer: string) => void): Promise<ChatResult> {
  // The floating shell remains fixed near the bottom/right; the full page uses normal flow.
  const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, signal, body: JSON.stringify({ question, stream: true, history: history.filter(isUsableHistoryMessage).slice(-6).map(({ role, content }) => ({ role, content: content.slice(0, 1200) })) }) });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; const error = new Error("assistant_failed") as ChatError; error.code = body?.error; error.status = response.status; throw error; }
  if (!contentType.includes("text/event-stream") || !response.body) { const result = await response.json() as ChatResult; await simulateTyping(result.answer || "", signal, onDelta); return result; }
  const batch = createFrameBatcher(onDelta);
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let answer = ""; let metadata: Omit<ChatResult, "answer"> = { sources: [] }; let completed = false;
  const parseEvent = (event: string) => {
    const data = event.split(/\r?\n/u).filter((line) => line.startsWith("data:")).map((line) => line.replace(/^data:\s?/u, "")).join("\n").trim();
    if (!data) return;
    if (data === "[DONE]" || data === `"[DONE]"` || data === "'[DONE]'") { completed = true; return; }
    let parsed: StreamEvent | string;
    try { parsed = JSON.parse(data) as StreamEvent | string; } catch { throw Object.assign(new Error("assistant_invalid_stream"), { code: "assistant_invalid_stream" }); }
    if (parsed === "[DONE]" || (typeof parsed === "object" && parsed !== null && (parsed as { done?: boolean }).done === true)) { completed = true; return; }
    if (typeof parsed === "object" && parsed !== null) {
      if (parsed.error) throw Object.assign(new Error("assistant_stream_failed"), { code: parsed.error });
      if (parsed.meta) metadata = { ...metadata, ...parsed.meta };
      if (parsed.delta) { answer += parsed.delta; batch.push(answer); }
      if (parsed.answer && !answer) { answer = parsed.answer; batch.push(answer); }
    }
  };
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
      const events = buffer.split(/\r?\n\r?\n/u);
      buffer = events.pop() || "";
      events.forEach(parseEvent);
      if (chunk.done) break;
    }
    if (buffer.trim()) parseEvent(buffer);
    await batch.flush();
    if (answer.trim()) completed = true;
  } finally { reader.releaseLock(); }
  if (!answer.trim()) throw Object.assign(new Error("assistant_stream_empty"), { code: "assistant_stream_empty" });
  return { answer, ...metadata };
}

function ErrorNotice({ error, onRetry }: { error: string; onRetry: () => void }) { return <div className="ai-chat-error" role="alert"><p>{error}</p><button type="button" onClick={onRetry}>重試</button></div>; }

function Message({ message, onCopy, onRegenerate }: { message: ChatMessage; onCopy: (content: string) => void; onRegenerate?: () => void }) {
  return <article className={`ai-chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`}><div className="ai-chat-message-inner">{message.role === "assistant" ? <div className="ai-chat-avatar" aria-hidden="true">✦</div> : null}<div className="ai-chat-message-body"><span className="ai-chat-message-label">{message.role === "assistant" ? "AI 小助手" : "你"}</span><AiChatMarkdown content={message.content} />{message.action ? <Link className="ai-chat-action" href={message.action.href}>{message.action.label} <span aria-hidden="true">↗</span></Link> : null}{message.sources?.length ? <div className="ai-chat-sources" aria-label="回答來源">{message.sources.map((source) => <a className="ai-chat-source-chip" key={source.url} href={source.url}>{source.title} <span aria-hidden="true">↗</span></a>)}</div> : null}{message.role === "assistant" && message.status === "complete" && message.content ? <div className="ai-chat-message-tools"><button type="button" aria-label="複製回答" onClick={() => onCopy(message.content)}>複製</button>{onRegenerate ? <button type="button" aria-label="重新產生回答" onClick={onRegenerate}>重新產生</button> : null}</div> : null}</div></div></article>;
}

function ChatInput({ value, loading, onChange, onSubmit, onStop }: { value: string; loading: boolean; onChange: (value: string) => void; onSubmit: () => void; onStop: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function resize() { if (!ref.current) return; ref.current.style.height = "auto"; ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`; }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) { // React exposes the native IME flag as event.nativeEvent.isComposing; event.isComposing is kept in the contract for browser adapters.
    const isComposing = Boolean((event as KeyboardEvent<HTMLTextAreaElement> & { isComposing?: boolean }).isComposing || event.nativeEvent.isComposing); if (isComposing || event.key !== "Enter" || event.shiftKey) return; event.preventDefault(); if (loading) onStop(); else onSubmit(); }
  return <div className="ai-chat-composer"><textarea ref={ref} value={value} rows={1} maxLength={500} onChange={(event) => { onChange(event.target.value); resize(); }} onKeyDown={handleKeyDown} placeholder="問我升學問題，或任何你想問的事情…" aria-label="輸入訊息" disabled={false} /><button type="button" aria-label={loading ? "停止產生回答" : "送出訊息"} onClick={loading ? onStop : onSubmit} disabled={!loading && value.trim().length < 2}>{loading ? <span className="ai-chat-stop-icon" aria-hidden="true" /> : "↑"}</button><small>Enter 送出 · Shift + Enter 換行</small></div>;
}

function ChatWorkspace({ mode, onClose, initialConversationId = "", initialQuestion = "", isMember }: { mode: WorkspaceMode; onClose?: () => void; initialConversationId?: string; initialQuestion?: string; isMember: boolean }) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null); const [conversations, setConversations] = useState<ChatConversation[]>([]); const [question, setQuestion] = useState(initialQuestion); const [loading, setLoading] = useState(false); const [draftAnswer, setDraftAnswer] = useState(""); const [thinkingIndex, setThinkingIndex] = useState(0); const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null); const [error, setError] = useState(""); const [showWelcome, setShowWelcome] = useState(!initialQuestion); const [welcomeLeaving, setWelcomeLeaving] = useState(false); const [showLatest, setShowLatest] = useState(false);
  const activeRequestRef = useRef<ActiveRequest | null>(null); const conversationRef = useRef<ChatConversation | null>(null); const draftAnswerRef = useRef(""); const messagesRef = useRef<HTMLDivElement>(null); const autoScrollRef = useRef(true);
  const setActiveConversation = useCallback((next: ChatConversation | null) => { conversationRef.current = next; setConversation(next); }, []);
  const persist = useCallback(async (next: ChatConversation) => { setActiveConversation(next); if (isMember) { await fetch("/api/assistant/conversations", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversation: next }) }).catch(() => undefined); } else await updateConversation(next); setConversations((items) => [next, ...items.filter((item) => item.id !== next.id)].sort((a, b) => b.updatedAt - a.updatedAt)); }, [isMember, setActiveConversation]);
  const abortActive = useCallback(() => { const active = activeRequestRef.current; if (!active) return; active.controller.abort(); const current = conversationRef.current; const partial = draftAnswerRef.current; const assistant = current?.messages.find((message) => message.id === active.assistantMessageId); const next = current && assistant ? partial ? replaceMessage(current, { ...assistant, content: partial, status: "complete" }) : removeMessage(current, assistant.id) : current; if (next) { setActiveConversation(next); void persist(next); } activeRequestRef.current = null; setLoading(false); setDraftAnswer(""); draftAnswerRef.current = ""; logDebug("Request Abort", { conversationId: active.conversationId, requestId: active.requestId }); }, [persist, setActiveConversation]);
  useEffect(() => { let cancelled = false; const timer = window.setTimeout(() => { void (async () => { const all = isMember ? await fetch("/api/assistant/conversations", { headers: { accept: "application/json" } }).then((response) => response.ok ? response.json() as Promise<{ conversations?: ChatConversation[] }> : { conversations: [] }).then((payload) => payload.conversations || []) : await getAllConversations(); const current = initialConversationId || getCurrentConversationId(); const selected = (current && !isMember && await getConversation(current)) || all[0] || await createConversation(); if (!cancelled) { setConversations(all); setActiveConversation(selected); setCurrentConversationId(selected.id); setShowWelcome(selected.messages.length === 0); } })().catch(() => setError("目前無法載入對話，請重新整理後再試。")); }, 0); return () => { cancelled = true; window.clearTimeout(timer); abortActive(); }; }, [abortActive, initialConversationId, isMember, setActiveConversation]);
  useEffect(() => { const container = messagesRef.current; if (!container || !autoScrollRef.current) return; container.scrollTo({ top: container.scrollHeight, behavior: loading ? "auto" : "smooth" }); }, [conversation?.messages.length, draftAnswer, loading, error]);
  useEffect(() => { if (!loading) return; const timer = window.setInterval(() => setThinkingIndex((index) => (index + 1) % thinkingStates.length), 2200); return () => window.clearInterval(timer); }, [loading]);
  function handleScroll() { const container = messagesRef.current; if (!container) return; const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 48; autoScrollRef.current = atBottom; setShowLatest(!atBottom); }
  function scrollLatest() { autoScrollRef.current = true; setShowLatest(false); messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" }); }
  function copyAnswer(content: string) { void navigator.clipboard?.writeText(content); }
  async function select(next: ChatConversation) { abortActive(); setFailedRequest(null); setError(""); setShowWelcome(next.messages.length === 0); setActiveConversation(next); setCurrentConversationId(next.id); }
  async function newConversation() { abortActive(); setFailedRequest(null); setError(""); const next = await createConversation(); setShowWelcome(true); setActiveConversation(next); setConversations((items) => [next, ...items]); }
  function chooseSuggestion(item: string) { setWelcomeLeaving(true); window.setTimeout(() => { setShowWelcome(false); setWelcomeLeaving(false); setQuestion(item); }, 180); }
  async function generate(text: string, base: ChatConversation, isRetry = false) {
    if (activeRequestRef.current || text.length < 2) return; const requestId = makeId(); const controller = new AbortController(); const userMessage = isRetry ? null : makeMessage(base.id, "user", text); const requestBase = userMessage ? appendMessage(base, userMessage) : base; const assistantMessage = makeMessage(base.id, "assistant", "", { status: "pending" }); const optimistic = appendMessage(requestBase, assistantMessage); const historySource = isRetry && base.messages.at(-1)?.role === "user" && base.messages.at(-1)?.content === text ? base.messages.slice(0, -1) : base.messages; const historySnapshot = historySource.filter(isUsableHistoryMessage).slice(-6);
    activeRequestRef.current = { conversationId: base.id, requestId, assistantMessageId: assistantMessage.id, controller }; setActiveConversation(optimistic); setShowWelcome(false); setLoading(true); setThinkingIndex(0); setDraftAnswer(""); draftAnswerRef.current = ""; setError(""); setFailedRequest(null); logDebug("Request Start", { conversationId: base.id, requestId }); // Keep the current question out of history; the API appends it once (history.slice(-6)).
    try { const result = await requestAssistant(text, historySnapshot, controller.signal, (answer) => { const active = activeRequestRef.current; if (!active || active.requestId !== requestId || conversationRef.current?.id !== base.id) return; draftAnswerRef.current = answer; setDraftAnswer(answer); setActiveConversation(conversationRef.current ? replaceMessage(conversationRef.current, { ...assistantMessage, content: answer, status: "streaming" }) : null); }); const active = activeRequestRef.current; if (!active || active.requestId !== requestId || conversationRef.current?.id !== base.id) return; const complete = { ...assistantMessage, content: result.answer, status: "complete" as const, sources: result.sources, action: result.action }; const finished = replaceMessage(conversationRef.current || optimistic, complete); activeRequestRef.current = null; setDraftAnswer(""); draftAnswerRef.current = ""; setLoading(false); logDebug("Request Complete", { conversationId: base.id, requestId }); await persist(finished); } catch (cause) { const active = activeRequestRef.current; if ((cause as DOMException).name === "AbortError" || !active || active.requestId !== requestId) return; activeRequestRef.current = null; setLoading(false); setDraftAnswer(""); draftAnswerRef.current = ""; const cleaned = removeMessage(conversationRef.current || optimistic, assistantMessage.id); if (conversationRef.current?.id === base.id) { setActiveConversation(cleaned); setFailedRequest({ conversationId: base.id, question: text }); setError(toUserError(cause as ChatError)); } if (!isMember) await updateConversation(cleaned); logDebug("Request Error", { conversationId: base.id, requestId, status: (cause as ChatError).status }); }
  }
  async function submit(event?: FormEvent, retryQuestion?: string) { event?.preventDefault(); const text = (retryQuestion ?? question).trim(); if (loading || text.length < 2 || !conversation) return; if (!retryQuestion) setQuestion(""); await generate(text, conversation, Boolean(retryQuestion)); }
  const retry = () => { if (!failedRequest || !conversation || failedRequest.conversationId !== conversation.id || loading) return; void generate(failedRequest.question, conversation, true); };
  const regenerateMessage = (message: ChatMessage) => { const previous = conversation?.messages.slice(0, conversation.messages.indexOf(message)).reverse().find((item) => item.role === "user"); if (previous && conversation) void generate(previous.content, conversation, true); };
  return <section className={`ai-chat-window ai-chat-${mode}`} role="dialog" aria-modal={mode === "floating"} aria-labelledby={`ai-chat-title-${mode}`}><div className="ai-chat-sidebar-wrap">{mode === "full" ? <aside className="ai-chat-sidebar" aria-label={isMember ? "會員對話" : "本機對話"}><div className="ai-chat-sidebar-head"><strong>{isMember ? "會員對話" : "本機對話"}</strong><button type="button" onClick={() => void newConversation()} aria-label="建立新對話">＋ 新對話</button></div><div className="ai-chat-conversation-list">{conversations.map((item) => <button key={item.id} type="button" className={item.id === conversation?.id ? "is-active" : ""} onClick={() => void select(item)}>{item.title}</button>)}</div><p>{aiDataNotice}</p></aside> : null}</div><div className="ai-chat-main"><header className="ai-chat-header"><div className="ai-chat-brand"><span className="ai-chat-logo" aria-hidden="true">✦</span><div><strong id={`ai-chat-title-${mode}`}>AI 小助手 <span className="ai-chat-beta">Beta</span></strong><small>一般 AI · 升學資料助手</small></div></div><div className="ai-chat-header-actions">{mode === "floating" ? <Link href={`/ai${conversation ? `?conversation=${conversation.id}` : ""}`} aria-label="開啟完整對話" title="開啟完整對話">↗</Link> : null}{onClose ? <button className="ai-chat-close" type="button" onClick={onClose} aria-label="關閉 AI 小助手" title="關閉"><span aria-hidden="true">×</span><span>關閉</span></button> : null}</div></header><p className="ai-chat-scope">{mode === "floating" ? "可以聊任何問題；遇到本站升學資料時會優先查找網站內容。" : aiDataNotice}</p><div className="ai-chat-body"><div ref={messagesRef} onScroll={handleScroll} className="ai-chat-messages" aria-live="polite"><div className="ai-chat-message-column">{showWelcome ? <div className={`ai-chat-empty ${welcomeLeaving ? "is-leaving" : ""}`}><span className="ai-chat-empty-logo" aria-hidden="true">✦</span><h2>你好，我是 AI 小助手</h2><p>可以問升學、學習、程式，或任何你想聊的事情。</p><div className="ai-chat-suggestions">{suggestions.map((item, index) => <button key={item} type="button" style={{ animationDelay: `${index * 60}ms` }} onClick={() => chooseSuggestion(item)}>{item}</button>)}</div></div> : null}{conversation?.messages.filter((message) => isUsableHistoryMessage(message) && message.status !== "pending" && message.status !== "streaming").map((message) => <Message key={message.id} message={message} onCopy={copyAnswer} onRegenerate={message.role === "assistant" ? () => regenerateMessage(message) : undefined} />)}{loading ? <article className="ai-chat-message is-assistant"><div className="ai-chat-message-inner"><div className="ai-chat-avatar" aria-hidden="true">✦</div><div className="ai-chat-message-body"><span className="ai-chat-message-label">AI 小助手</span>{draftAnswer ? <><AiChatMarkdown content={draftAnswer} /><span className="ai-chat-cursor" aria-hidden="true" /></> : <div className="ai-chat-thinking" aria-live="polite"><span>{thinkingStates[thinkingIndex]}</span><span className="ai-chat-dots" aria-hidden="true"><i /> <i /> <i /></span></div>}</div></div></article> : null}{error && failedRequest ? <ErrorNotice error={error} onRetry={retry} /> : null}</div>{showLatest ? <button type="button" className="ai-chat-latest" onClick={scrollLatest}>↓ 回到最新</button> : null}</div></div><form onSubmit={submit}><ChatInput value={question} loading={loading} onChange={setQuestion} onSubmit={() => void submit()} onStop={abortActive} /></form></div></section>;
}

function toUserError(error: ChatError) { if (error.code === "guest_limit_reached") return "訪客免費提問次數已用完，登入 LINE 會員後即可繼續使用。"; if (error.status === 429 || error.code === "assistant_rate_limited") return "目前 AI 使用量較高，請稍後再試。"; if (error.code === "assistant_timeout") return "AI 回應時間較久，請再試一次。"; if (error.code === "assistant_stream_failed" || error.code === "assistant_invalid_stream" || error.code === "assistant_stream_empty" || error.code === "assistant_stream_incomplete") return "AI 回覆尚未完整收到，請重新產生。"; if (error.status && error.status >= 400 && error.status < 500) return "這個問題目前無法送出，請稍微修改後再試。"; return "AI 暫時沒有成功回應，請再試一次。"; }

function FloatingAssistantButton({ onOpen }: { onOpen: () => void }) {
  const [offset, setOffset] = useState<FloatingButtonOffset>(() => { if (typeof window === "undefined") return { x: 0, y: 0 }; try { const saved = window.localStorage.getItem("jshs-ai-launcher-position"); return saved ? JSON.parse(saved) as FloatingButtonOffset : { x: 0, y: 0 }; } catch { return { x: 0, y: 0 }; } });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offset: FloatingButtonOffset; moved: boolean } | null>(null); const offsetRef = useRef(offset); const suppressClickRef = useRef(false);
  function clamp(next: FloatingButtonOffset): FloatingButtonOffset { const width = 190; const height = 64; return { x: Math.max(-(window.innerWidth - width - 16), Math.min(24, next.x)), y: Math.max(-(window.innerHeight - height - 96), Math.min(0, next.y)) }; }
  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) { if (event.button !== 0) return; dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offset, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }
  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; const next = clamp({ x: drag.offset.x + event.clientX - drag.startX, y: drag.offset.y + event.clientY - drag.startY }); if (Math.abs(next.x - drag.offset.x) > 3 || Math.abs(next.y - drag.offset.y) > 3) drag.moved = true; offsetRef.current = next; setOffset(next); }
  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; suppressClickRef.current = drag.moved; if (drag.moved) { try { window.localStorage.setItem("jshs-ai-launcher-position", JSON.stringify(offsetRef.current)); } catch { /* Optional preference. */ } } dragRef.current = null; if (!suppressClickRef.current) onOpen(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }
  function handleClick() { if (suppressClickRef.current) { suppressClickRef.current = false; return; } onOpen(); }
  return <button type="button" className="ai-chat-floating-button" aria-label="開啟 AI 小助手" aria-expanded={false} style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }} onClick={handleClick} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}><span className="ai-chat-bot" aria-hidden="true"><span className="ai-chat-bot-antenna" /><span className="ai-chat-bot-face"><i /><i /></span></span><span className="ai-chat-floating-label">AI 小助手</span><span className="ai-chat-floating-hint">問我</span></button>;
}

export function AiAssistant({ isMember }: { isMember: boolean }) { const pathname = usePathname(); const [open, setOpen] = useState(false); const [contextQuestion, setContextQuestion] = useState(""); const openAssistant = (question = "") => { document.dispatchEvent(new Event("jshs:ai-open")); setContextQuestion(question); setOpen(true); }; useEffect(() => { document.body.classList.toggle("jshs-ai-open", open); return () => document.body.classList.remove("jshs-ai-open"); }, [open]); useEffect(() => { if (!open) return; const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; document.addEventListener("keydown", closeOnEscape); return () => document.removeEventListener("keydown", closeOnEscape); }, [open]); useEffect(() => { const closeForNavigation = () => setOpen(false); const openWithContext = (event: Event) => { const detail = (event as CustomEvent<{ question?: string }>).detail; openAssistant(detail?.question || ""); }; document.addEventListener("jshs:nav-open", closeForNavigation); document.addEventListener("jshs:ai-context", openWithContext); return () => { document.removeEventListener("jshs:nav-open", closeForNavigation); document.removeEventListener("jshs:ai-context", openWithContext); }; }, []); if (pathname === "/" || pathname === "/ai" || pathname === "/admin" || pathname.startsWith("/admin/")) return null; return <div className="ai-chat-root">{open ? <ChatWorkspace mode="floating" initialQuestion={contextQuestion} onClose={() => setOpen(false)} isMember={isMember} /> : <FloatingAssistantButton onOpen={() => openAssistant()} />}</div>; }
export function AiChatPage({ initialConversationId = "", isMember }: { initialConversationId?: string; isMember: boolean }) { return <main className="ai-chat-page"><ChatWorkspace mode="full" initialConversationId={initialConversationId} isMember={isMember} /></main>; }
