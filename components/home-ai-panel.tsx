"use client";

import { useState } from "react";
import { SiteIcon } from "@/components/site-icons";

type Message = { role: "user" | "assistant"; content: string };
const starterMessages: readonly Message[] = [{ role: "user", content: "111" }, { role: "assistant", content: '「111」是一個電話號碼，通常用於緊急服務，如警察、消防或急救。這個號碼在不同國家可能會有不同的意義。能夠說明你想問什麼嗎？' }];

export function HomeAiPanel() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<readonly Message[]>(starterMessages);
  const [loading, setLoading] = useState(false);
  async function submit() {
    const text = question.trim();
    if (text.length < 2 || loading) return;
    setQuestion(""); setMessages((current) => [...current, { role: "user", content: text }]); setLoading(true);
    try { const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: text, stream: false, history: messages.slice(-6) }) }); const payload = await response.json() as { answer?: string }; setMessages((current) => [...current, { role: "assistant", content: payload.answer || "目前沒有收到完整回答，請再試一次。" }]); }
    catch { setMessages((current) => [...current, { role: "assistant", content: "目前無法取得回答，請稍後再試。" }]); }
    finally { setLoading(false); }
  }
  return <aside className="stitch-ai-panel jshs-v2-ai-card" aria-label="AI 小助手"><header className="stitch-ai-header"><div className="stitch-ai-title"><span className="stitch-ai-icon"><SiteIcon name="sparkle" size={16} /></span><div><strong>升學小幫手 <small>AI</small></strong><span>有升學相關問題？</span></div></div><button type="button" aria-label="AI 小助手選單">•••</button></header><div className="stitch-ai-messages">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`stitch-ai-message is-${message.role}`}>{message.role === "assistant" ? <span className="stitch-ai-avatar"><SiteIcon name="sparkle" size={13} /></span> : null}<div><small>{message.role === "assistant" ? <>AI 小助手 <em>正在生成</em></> : "你"}</small><p>{message.content}</p></div></div>)}{loading ? <div className="stitch-ai-loading" role="status">正在思考…</div> : null}</div><form className="stitch-ai-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：基北區 5A++ 可以填哪些志願？" aria-label="輸入訊息" /><button type="submit" aria-label="送出訊息" disabled={loading || question.trim().length < 2}>↑</button><small>Enter 送出 · Shift + Enter 換行</small></form></aside>;
}
