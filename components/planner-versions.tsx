"use client";

import { useEffect, useMemo, useState } from "react";
import { readLocalPlannerSnapshots, saveLocalPlannerSnapshot, writeLocalPlanner, type LocalPlannerItem, type LocalPlannerSnapshot, type LocalPlannerState } from "@/lib/planner-local";

type Version = { id: string; itemCount: number; createdAt: string; state: LocalPlannerState; items?: LocalPlannerItem[] };

export function PlannerVersions({ isMember }: { isMember: boolean }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [viewed, setViewed] = useState<string | null>(null);
  const [status, setStatus] = useState(isMember ? "正在讀取會員版本…" : "正在讀取本機版本…");
  const [restoring, setRestoring] = useState("");

  useEffect(() => {
    if (!isMember) {
      const timer = window.setTimeout(() => {
        const localVersions = readLocalPlannerSnapshots().map(toVersion);
        setVersions(localVersions);
        setStatus(localVersions.length ? "" : "尚未建立版本；新增、刪除或移動志願後會自動留下快照。");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    fetch("/api/planner/versions").then((response) => response.json() as Promise<{ versions?: Version[] }>).then((payload) => {
      const nextVersions = payload.versions || [];
      setVersions(nextVersions);
      setStatus(nextVersions.length ? "" : "尚未建立版本；儲存志願後會自動留下快照。");
    }).catch(() => setStatus("目前無法讀取版本紀錄，請稍後再試。"));
  }, [isMember]);

  const comparison = useMemo(() => {
    const selectedVersions = versions.filter((version) => selected.includes(version.id));
    if (selectedVersions.length !== 2) return null;
    const [left, right] = selectedVersions;
    return { left, right, added: (right.state.order || []).filter((id) => !(left.state.order || []).includes(id)).length, removed: (left.state.order || []).filter((id) => !(right.state.order || []).includes(id)).length };
  }, [selected, versions]);

  async function restore(version: Version) {
    setRestoring(version.id);
    if (!isMember) {
      if (!version.items) { setStatus("這個版本沒有可恢復的本機快照內容。"); setRestoring(""); return; }
      writeLocalPlanner(version.items, version.state);
      saveLocalPlannerSnapshot(version.items, version.state);
      window.dispatchEvent(new Event("jshs-planner"));
      setRestoring("");
      setStatus("已恢復這個本機版本；請回到自己排查看目前順序。");
      return;
    }
    const response = await fetch("/api/planner/versions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ versionId: version.id }) }).catch(() => null);
    setRestoring("");
    setStatus(response?.ok ? "已恢復這個版本；請回到自己排查看目前順序。" : "恢復失敗，請稍後再試。 ");
  }

  const viewedVersion = versions.find((version) => version.id === viewed);
  return <div className="mt-6">
    {status ? <p className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy" role="status">{status}</p> : null}
    {versions.length ? <div className="grid gap-3">{versions.map((version) => <div key={version.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap items-center gap-3"><input aria-label="選取版本比較" type="checkbox" checked={selected.includes(version.id)} disabled={!selected.includes(version.id) && selected.length >= 2} onChange={() => setSelected((current) => current.includes(version.id) ? current.filter((id) => id !== version.id) : [...current, version.id])} /><span className="min-w-0 flex-1"><strong>{new Date(version.createdAt).toLocaleString("zh-TW")}</strong><span className="ml-2 text-sm text-slate-500">{version.itemCount} 個校科</span></span><button type="button" onClick={() => setViewed((current) => current === version.id ? null : version.id)} className="min-h-11 px-3 text-sm jshs-button-secondary">{viewed === version.id ? "收起版本" : "查看版本"}</button><button type="button" disabled={Boolean(restoring)} onClick={() => restore(version)} className="min-h-11 px-3 text-sm jshs-button-secondary">{restoring === version.id ? "恢復中…" : "恢復此版本"}</button></div>{viewed === version.id ? <VersionContent version={version} /> : null}</div>)}</div> : null}
    {viewedVersion && comparison ? <p className="mt-4 rounded-2xl border border-[var(--jshs-border)] p-4 text-sm leading-6" role="status">兩個版本比較：後一個版本新增 {comparison.added} 筆、移除 {comparison.removed} 筆；順序差異請查看兩個版本內容。</p> : null}
    {comparison && !viewedVersion ? <p className="mt-4 rounded-2xl border border-[var(--jshs-border)] p-4 text-sm leading-6" role="status">兩個版本比較：後一個版本新增 {comparison.added} 筆、移除 {comparison.removed} 筆；請點擊「查看版本」確認順序。</p> : null}
  </div>;
}

function VersionContent({ version }: { version: Version }) {
  const items = version.items || [];
  const order = new Map((version.state.order || []).map((id, index) => [id, index]));
  const ordered = [...items].sort((left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  return <div className="mt-4 border-t border-white/70 pt-4"><p className="text-sm font-black text-slate-700">此版本的志願順序</p>{ordered.length ? <ol className="mt-2 grid gap-2 text-sm">{ordered.map((item) => <li key={item.id} className="rounded-xl bg-white p-3"><strong>{item.school_name}</strong>{item.department ? <span className="ml-2 text-slate-500">{item.department}</span> : null}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">這個快照的志願清單為空。</p>}</div>;
}

function toVersion(snapshot: LocalPlannerSnapshot): Version {
  return { id: snapshot.id, itemCount: snapshot.items.length, createdAt: snapshot.created_at, state: snapshot.state, items: [...snapshot.items] };
}
