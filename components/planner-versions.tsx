"use client";

import { useEffect, useMemo, useState } from "react";

type Version = { id: string; itemCount: number; createdAt: string; state: { order?: string[]; itemMeta?: Record<string, { tier?: string; reason?: string }> } };

export function PlannerVersions({ isMember }: { isMember: boolean }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState(isMember ? "正在讀取會員版本…" : "訪客版本只保存在本機規劃中。");
  useEffect(() => { if (!isMember) return; fetch("/api/planner/versions").then((response) => response.json() as Promise<{ versions?: Version[] }>).then((payload) => { setVersions(payload.versions || []); setStatus(payload.versions?.length ? "" : "尚未建立版本；儲存志願後會自動留下快照。"); }).catch(() => setStatus("目前無法讀取版本紀錄。")); }, [isMember]);
  const comparison = useMemo(() => { const selectedVersions = versions.filter((version) => selected.includes(version.id)); if (selectedVersions.length !== 2) return null; const [left, right] = selectedVersions; return { left, right, added: (right.state.order || []).filter((id) => !(left.state.order || []).includes(id)).length, removed: (left.state.order || []).filter((id) => !(right.state.order || []).includes(id)).length }; }, [selected, versions]);
  return <div className="mt-6">{status ? <p className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy" role="status">{status}</p> : null}{versions.length ? <div className="grid gap-3">{versions.map((version) => <label key={version.id} className="flex items-center gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><input type="checkbox" checked={selected.includes(version.id)} disabled={!selected.includes(version.id) && selected.length >= 2} onChange={() => setSelected((current) => current.includes(version.id) ? current.filter((id) => id !== version.id) : [...current, version.id])} /><span><strong>{new Date(version.createdAt).toLocaleString("zh-TW")}</strong><span className="ml-2 text-sm text-slate-500">{version.itemCount} 個校科</span></span></label>)}</div> : null}{comparison ? <p className="mt-4 rounded-2xl border border-[var(--jshs-border)] p-4 text-sm leading-6" role="status">兩個版本比較：後一個版本新增 {comparison.added} 筆、移除 {comparison.removed} 筆；順序差異請回到我的志願逐項確認。</p> : null}</div>;
}
