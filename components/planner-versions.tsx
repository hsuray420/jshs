"use client";

import { useEffect, useMemo, useState } from "react";

type Version = { id: string; itemCount: number; createdAt: string; state: { order?: string[]; itemMeta?: Record<string, { tier?: string; reason?: string }> } };

export function PlannerVersions({ isMember }: { isMember: boolean }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState(isMember ? "正在讀取會員版本…" : "訪客版本只保存在本機規劃中。");
  const [restoring, setRestoring] = useState("");
  useEffect(() => { if (!isMember) return; fetch("/api/planner/versions").then((response) => response.json() as Promise<{ versions?: Version[] }>).then((payload) => { setVersions(payload.versions || []); setStatus(payload.versions?.length ? "" : "尚未建立版本；儲存志願後會自動留下快照。"); }).catch(() => setStatus("目前無法讀取版本紀錄。")); }, [isMember]);
  const comparison = useMemo(() => { const selectedVersions = versions.filter((version) => selected.includes(version.id)); if (selectedVersions.length !== 2) return null; const [left, right] = selectedVersions; return { left, right, added: (right.state.order || []).filter((id) => !(left.state.order || []).includes(id)).length, removed: (left.state.order || []).filter((id) => !(right.state.order || []).includes(id)).length }; }, [selected, versions]);
  async function restore(versionId: string) {
    setRestoring(versionId);
    const response = await fetch("/api/planner/versions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ versionId }) }).catch(() => null);
    setRestoring("");
    setStatus(response?.ok ? "已恢復這個版本；請回到自己排查看目前順序。" : "恢復失敗，請稍後再試。");
  }
  return <div className="mt-6">{status ? <p className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy" role="status">{status}</p> : null}{versions.length ? <div className="grid gap-3">{versions.map((version) => <div key={version.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><input aria-label="選取版本比較" type="checkbox" checked={selected.includes(version.id)} disabled={!selected.includes(version.id) && selected.length >= 2} onChange={() => setSelected((current) => current.includes(version.id) ? current.filter((id) => id !== version.id) : [...current, version.id])} /><span className="min-w-0 flex-1"><strong>{new Date(version.createdAt).toLocaleString("zh-TW")}</strong><span className="ml-2 text-sm text-slate-500">{version.itemCount} 個校科</span></span><button type="button" disabled={Boolean(restoring)} onClick={() => restore(version.id)} className="min-h-11 px-3 text-sm jshs-button-secondary">{restoring === version.id ? "恢復中…" : "恢復此版本"}</button></div>)}</div> : null}{comparison ? <p className="mt-4 rounded-2xl border border-[var(--jshs-border)] p-4 text-sm leading-6" role="status">兩個版本比較：後一個版本新增 {comparison.added} 筆、移除 {comparison.removed} 筆；順序差異請回到自己排逐項確認。</p> : null}</div>;
}
