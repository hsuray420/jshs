"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildPlannerRecommendations, type RecommendationSchool } from "@/lib/planner-recommendation";
import { readLocalPlanner, writeLocalPlanner } from "@/lib/planner-local";
import { analyzePlannerHealth, type PlannerHealthCheck } from "@/lib/planner-health";

type PlannerItem = { id: string; district: string; school_code: string; school_name: string; department: string; tier: string; notes: string; created_at: string };
type PlannerState = { order?: string[] };

export function PlannerModeWorkspace({ mode, schools, isMember }: { mode: "recommend" | "custom"; schools: readonly RecommendationSchool[]; isMember: boolean }) {
  const [score, setScore] = useState<number | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [items, setItems] = useState<PlannerItem[]>(() => isMember ? [] : readLocalPlanner().items as PlannerItem[]);
  const [plannerState, setPlannerState] = useState<PlannerState>(() => isMember ? { order: [] } : readLocalPlanner().state as PlannerState);
  const [message, setMessage] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => { try { const latest = JSON.parse(window.localStorage.getItem("jshs_score_latest") || "null") as { district?: string; result?: { totalScore?: number } } | null; setScore(typeof latest?.result?.totalScore === "number" ? latest.result.totalScore : null); setDistrict(typeof latest?.district === "string" ? latest.district : null); } catch { setScore(null); setDistrict(null); } }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    if (!isMember) {
      return;
    }
    Promise.all([
      fetch("/api/planner").then((response) => response.json() as Promise<{ items?: PlannerItem[] }>),
      fetch("/api/planner/state").then((response) => response.json() as Promise<{ state?: PlannerState }>),
    ]).then(([itemsPayload, statePayload]) => {
      const nextState = statePayload.state || { order: [] };
      const nextItems = itemsPayload.items || [];
      setPlannerState(nextState);
      setItems(sortItems(nextItems, nextState));
    }).catch(() => setMessage("目前無法讀取已保存的志願。"));
  }, [isMember]);
  const districtSchools = useMemo(() => district ? schools.filter((school) => school.district === district) : schools, [district, schools]);
  const recommendations = useMemo(() => score === null ? null : buildPlannerRecommendations(districtSchools, score), [districtSchools, score]);
  if (score === null) return <Gate />;
  if (mode === "recommend") return <RecommendationView groups={recommendations!} message={message} onAdd={addItem} />;
  return <CustomView schools={districtSchools} score={score} items={items} message={message} onAdd={addItem} onMove={moveItem} onDelete={deleteItem} />;

  async function saveState(next: PlannerState) {
    setPlannerState(next);
    if (!isMember) {
      writeLocalPlanner(items, next);
      return true;
    }
    const response = await fetch("/api/planner/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: next }) }).catch(() => null);
    if (!response?.ok) setMessage("順序已更新，但同步失敗，請稍後再試。");
    return Boolean(response?.ok);
  }
  async function addItem(school: RecommendationSchool, tier = "balanced") {
    if (!isMember) {
      const item = { id: crypto.randomUUID(), district: school.district || "", school_code: school.code, school_name: school.name, department: school.department || "", tier, notes: "", created_at: new Date().toISOString() };
      const nextItems = [...items, item];
      const nextState = { ...plannerState, order: [...(plannerState.order || []), item.id] };
      setItems(sortItems(nextItems, nextState));
      writeLocalPlanner(nextItems, nextState);
      setMessage("已保存於目前裝置；登入 LINE 後才會跨裝置同步。");
      return;
    }
    const response = await fetch("/api/planner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ schoolName: school.name, schoolCode: school.code, district: school.district || "", department: school.department || "", tier }) }).catch(() => null);
    if (!response?.ok) { setMessage("加入失敗，請確認已登入。"); return; }
    const payload = await response.json() as { item?: PlannerItem };
    if (payload.item) {
      const nextItems = [...items, payload.item];
      const nextState = { ...plannerState, order: [...(plannerState.order || []), payload.item.id] };
      setItems(sortItems(nextItems, nextState));
      await saveState(nextState);
    }
  }
  async function moveItem(index: number, direction: -1 | 1) {
    const current = sortItems(items, plannerState);
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    await saveState({ ...plannerState, order: next.map((item) => item.id) });
    setItems(next);
    setMessage("順序已更新並同步保存。");
  }
  async function deleteItem(item: PlannerItem) {
    if (isMember) {
      const response = await fetch("/api/planner", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id }) }).catch(() => null);
      if (!response?.ok) { setMessage("刪除失敗，請稍後再試。"); return; }
    }
    const nextItems = items.filter((candidate) => candidate.id !== item.id);
    const nextState = { ...plannerState, order: (plannerState.order || []).filter((id) => id !== item.id) };
    setItems(sortItems(nextItems, nextState));
    setPlannerState(nextState);
    if (!isMember) writeLocalPlanner(nextItems, nextState);
    else await saveState(nextState);
    setMessage("已從志願清單移除。");
  }
}

function sortItems(items: readonly PlannerItem[], state: PlannerState) {
  const order = new Map((state.order || []).map((id, index) => [id, index]));
  return [...items].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.created_at.localeCompare(b.created_at));
}

function Gate() { return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-12"><div className="max-w-2xl p-6 jshs-surface-card"><p className="jshs-eyebrow">需要先試算</p><h1 className="mt-2 text-2xl">先完成一次成績試算，才能填志願。</h1><p className="mt-3 text-sm leading-7 jshs-muted-copy">系統推薦與自選排序的建議都會以你的試算成績為依據。</p><Link href="/tools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">前往試算成績 →</Link></div></section>; }
function RecommendationView({ groups, message, onAdd }: { groups: { challenge: RecommendationSchool[]; stable: RecommendationSchool[]; safe: RecommendationSchool[] }; message: string; onAdd: (school: RecommendationSchool, tier: string) => void }) { return <PlannerLayout title="系統推薦" intro="依你的試算成績，排出挑戰、適中、穩定三組；這是 JSHS 推估，不是錄取保證。"><div className="grid gap-5 lg:grid-cols-3"><Group title="挑戰" description="目前資料下風險較高，但保留你想爭取的選項。" schools={groups.challenge} tier="challenge" onAdd={onAdd} /><Group title="適中" description="條件與目前資料較接近，仍請核對官方名額與規則。" schools={groups.stable} tier="balanced" onAdd={onAdd} /><Group title="穩定" description="相對降低不確定性，但不代表錄取保證。" schools={groups.safe} tier="stable" onAdd={onAdd} /></div>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</PlannerLayout>; }
function Group({ title, description, schools, tier, onAdd }: { title: string; description: string; schools: readonly RecommendationSchool[]; tier: string; onAdd: (school: RecommendationSchool, tier: string) => void }) { return <section className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h2 className="text-xl">{title} <span className="text-sm font-normal text-slate-500">{schools.length}/8</span></h2><p className="mt-2 text-xs leading-5 jshs-muted-copy">{description}</p><div className="mt-4 grid gap-2">{schools.map((school) => <SchoolRow key={school.code} school={school} action={() => onAdd(school, tier)} />)}{!schools.length ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">目前資料不足，請回到學校查詢補充選項。</p> : null}</div></section>; }
function CustomView({ schools, score, items, message, onAdd, onMove, onDelete }: { schools: readonly RecommendationSchool[]; score: number; items: readonly PlannerItem[]; message: string; onAdd: (school: RecommendationSchool) => void; onMove: (index: number, direction: -1 | 1) => void; onDelete: (item: PlannerItem) => void }) { const selected = new Set(items.map((item) => item.school_code)); const health = analyzePlannerHealth({ serviceYear: "116", items: items.map((item) => ({ id: item.id, schoolCode: item.school_code, tier: item.tier, qualificationStatus: "unknown", hasQuota: false })) }); return <PlannerLayout title="自己排" intro={`你的試算成績是 ${score} 分。加入並調整校科後，系統會即時進行結構化志願健檢。`}><div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><section><h2 className="text-xl">我的志願順序 <span className="text-sm font-normal text-slate-500">{items.length} 所</span></h2><div className="mt-4 grid gap-2">{items.map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3 jshs-surface-card"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--jshs-muted-surface)] font-black">{index + 1}</span><strong className="min-w-0 flex-1">{item.school_name}</strong><button type="button" aria-label={`將 ${item.school_name} 上移`} onClick={() => onMove(index, -1)} className="min-h-11 min-w-11 text-sm text-[var(--jshs-primary)]">↑</button><button type="button" aria-label={`將 ${item.school_name} 下移`} onClick={() => onMove(index, 1)} className="min-h-11 min-w-11 text-sm text-[var(--jshs-primary)]">↓</button><button type="button" aria-label={`刪除 ${item.school_name}`} onClick={() => onDelete(item)} className="min-h-11 px-2 text-sm text-red-700">刪除</button></div>)}{!items.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">從右側加入學校，就會出現在這裡。</p> : null}</div><PlannerHealthPanel checks={health} /></section><section><h2 className="text-xl">加入學校</h2><div className="mt-4 grid max-h-[560px] gap-2 overflow-auto">{schools.filter((school) => !selected.has(school.code)).slice(0, 30).map((school) => <SchoolRow key={school.code} school={school} action={() => onAdd(school)} />)}</div></section></div>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</PlannerLayout>; }
function PlannerHealthPanel({ checks }: { checks: readonly PlannerHealthCheck[] }) { return <section className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-center justify-between gap-3"><h2 className="text-lg">志願健檢</h2><span className="text-xs jshs-muted-copy">結構化檢查</span></div><div className="mt-3 grid gap-2">{checks.map((check) => <details key={check.id} className="rounded-xl bg-white p-3"><summary className="cursor-pointer font-bold"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${check.status === "pass" ? "bg-emerald-500" : check.status === "error" ? "bg-red-500" : "bg-amber-500"}`} />{check.label} {check.status === "pass" ? "✓" : "⚠"}</summary><p className="mt-2 text-sm leading-6 jshs-muted-copy">{check.detail}</p><Link href={check.actionHref} className="mt-2 inline-flex text-sm font-bold text-[var(--jshs-primary)]">{check.actionLabel} →</Link></details>)}</div></section>; }
function SchoolRow({ school, action }: { school: RecommendationSchool; action: () => void }) { return <div className="flex items-center gap-3 rounded-xl bg-white p-3"><div className="min-w-0 flex-1"><strong className="block">{school.name}</strong><span className="text-xs text-slate-500">{school.referenceScore ? `參考 ${school.referenceScore} 分` : "參考分數待補"}</span></div><button type="button" onClick={action} className="shrink-0 px-3 py-2 text-xs jshs-button-secondary">加入</button></div>; }
function PlannerLayout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) { return <><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><p className="jshs-eyebrow">我的志願 · <Link href="/planner">回到選擇方式</Link></p><h1 className="mt-3">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">{intro}</p></div></section><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8">{children}</section></>; }
