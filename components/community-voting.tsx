"use client";

import { useEffect, useState } from "react";

type Topic = { id: string; title: string; description: string; options: { id: string; label: string }[]; counts: { option_id: string; count: number }[] };

export function CommunityVoting({ isMember }: { isMember: boolean }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [status, setStatus] = useState("正在讀取投票議題…");
  useEffect(() => { fetch("/api/community/votes").then((response) => response.json() as Promise<{ topics?: Topic[] }>).then((payload) => { setTopics(payload.topics || []); setStatus(payload.topics?.length ? "" : "目前沒有開放中的議題。"); }).catch(() => setStatus("目前無法讀取投票議題。")); }, []);
  async function vote(topicId: string, optionId: string) {
    if (!isMember) { setStatus("投票需要先使用 LINE 登入。"); return; }
    const response = await fetch("/api/community/votes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topicId, optionId }) });
    const payload = await response.json() as { results?: Topic["counts"]; error?: string };
    if (response.ok) { setTopics((current) => current.map((topic) => topic.id === topicId ? { ...topic, counts: payload.results || topic.counts } : topic)); setStatus("已完成投票，每個議題每個 LINE 帳號只能投一次。"); }
    else setStatus(payload.error === "member_required" ? "投票需要先使用 LINE 登入。" : "這個議題已投過票或已關閉。");
  }
  return <div className="mt-6 grid gap-4">{topics.map((topic) => <article key={topic.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><h3>{topic.title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{topic.description}</p><div className="mt-4 grid gap-2">{topic.options.map((option) => { const count = topic.counts.find((item) => item.option_id === option.id)?.count || 0; return <button key={option.id} type="button" onClick={() => void vote(topic.id, option.id)} className="flex items-center justify-between rounded-xl border border-[var(--jshs-border)] bg-white px-4 py-3 text-left text-sm font-bold hover:border-[var(--jshs-primary)]"><span>{option.label}</span><span className="text-[var(--jshs-primary)]">{count} 票</span></button>; })}</div></article>)}{status ? <p className="text-sm font-bold text-[var(--jshs-primary)]" role="status">{status}</p> : null}</div>;
}
