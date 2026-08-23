"use client";

import { useEffect, useState } from "react";

type SharedItem = { id: string; school_name: string; department: string; district: string; school_code: string; tier?: string; notes?: string };
type SharedPayload = { items?: SharedItem[]; state?: { itemMeta?: Record<string, { tier?: string; reason?: string; perspective?: string }> } };

export function PlannerShare() {
  const [payload, setPayload] = useState<SharedPayload | null>(null);
  useEffect(() => {
    if (!window.location.hash) return;
    const frameId = window.requestAnimationFrame(() => setPayload(decodeShare(window.location.hash.slice(1))));
    return () => window.cancelAnimationFrame(frameId);
  }, []);
  const items = payload?.items || [];
  return <section className="mx-auto w-[min(900px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">只讀分享 · 不公開索引</p><h1 className="mt-3">家庭升學規劃摘要</h1><p className="mt-4 max-w-2xl text-base leading-7 jshs-muted-copy">這是一份只讀快照，分享者之後的修改不會影響這個頁面。</p>{items.length ? <div className="mt-8 grid gap-3">{items.map((item, index) => { const meta = payload?.state?.itemMeta?.[item.id]; const reason = meta?.reason || item.notes || ""; return <article key={item.id} className="p-5 jshs-surface-card"><div className="flex flex-wrap items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--jshs-muted-surface)] font-black text-[var(--jshs-primary)]">{index + 1}</span><div><h2 className="text-xl">{item.school_name}</h2><p className="mt-1 text-sm jshs-muted-copy">{item.district.toUpperCase()} · {item.school_code} · {item.department || "未指定科別"}</p></div><span className="jshs-chip">{tierLabel(meta?.tier || item.tier)}</span></div>{reason ? <p className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 text-slate-600">為什麼想選：{reason}</p> : null}<p className="mt-3 text-xs text-slate-500">觀點：{perspectiveLabel(meta?.perspective)}</p></article>; })}</div> : <div className="mt-8 p-6 jshs-surface-card"><h2 className="text-xl">分享連結沒有可讀資料</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">請回到建立分享的裝置重新產生連結。</p></div>}</section>;
}

function decodeShare(value: string): SharedPayload | null { try { const normalized = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4); const binary = atob(normalized); const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0)); return JSON.parse(new TextDecoder().decode(bytes)) as SharedPayload; } catch { return null; } }
function tierLabel(value?: string) { return ({ challenge: "挑戰", balanced: "適中", stable: "穩定" } as Record<string, string>)[value || "balanced"] || "適中"; }
function perspectiveLabel(value?: string) { return ({ student: "學生觀點", family: "家長觀點", both: "共同確認" } as Record<string, string>)[value || "student"] || "學生觀點"; }
