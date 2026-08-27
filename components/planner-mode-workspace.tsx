"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildPlannerRecommendations, type RecommendationSchool } from "@/lib/planner-recommendation";
import { readLocalPlanner, writeLocalPlanner } from "@/lib/planner-local";

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
  return <CustomView schools={districtSchools} score={score} items={items} message={message} onAdd={addItem} onMove={moveItem} />;

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
}

function sortItems(items: readonly PlannerItem[], state: PlannerState) {
  const order = new Map((state.order || []).map((id, index) => [id, index]));
  return [...items].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.created_at.localeCompare(b.created_at));
}

function Gate() { return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-12"><div className="max-w-2xl p-6 jshs-surface-card"><p className="jshs-eyebrow">需要先試算</p><h1 className="mt-2 text-2xl">先完成一次成績試算，才能填志願。</h1><p className="mt-3 text-sm leading-7 jshs-muted-copy">系統推薦與自選排序的建議都會以你的試算成績為依據。</p><Link href="/tools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">前往試算成績 →</Link></div></section>; }
function RecommendationView({ groups, message, onAdd }: { groups: { challenge: RecommendationSchool[]; stable: RecommendationSchool[]; safe: RecommendationSchool[] }; message: string; onAdd: (school: RecommendationSchool, tier: string) => void }) { return <PlannerLayout title="系統推薦" intro="依你的試算成績，排出挑戰、穩定、保底三組；每組最多八所學校。"><div className="grid gap-5 lg:grid-cols-3"><Group title="挑戰" description="分數略高，適合保留期待。" schools={groups.challenge} tier="challenge" onAdd={onAdd} /><Group title="穩定" description="參考分數與目前成績接近。" schools={groups.stable} tier="stable" onAdd={onAdd} /><Group title="保底" description="參考分數相對較低，增加選擇安全感。" schools={groups.safe} tier="stable" onAdd={onAdd} /></div>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</PlannerLayout>; }
function Group({ title, description, schools, tier, onAdd }: { title: string; description: string; schools: readonly RecommendationSchool[]; tier: string; onAdd: (school: RecommendationSchool, tier: string) => void }) { return <section className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h2 className="text-xl">{title} <span className="text-sm font-normal text-slate-500">{schools.length}/8</span></h2><p className="mt-2 text-xs leading-5 jshs-muted-copy">{description}</p><div className="mt-4 grid gap-2">{schools.map((school) => <SchoolRow key={school.code} school={school} action={() => onAdd(school, tier)} />)}{!schools.length ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">目前資料不足，請回到學校查詢補充選項。</p> : null}</div></section>; }
function CustomView({ schools, score, items, message, onAdd, onMove }: { schools: readonly RecommendationSchool[]; score: number; items: readonly PlannerItem[]; message: string; onAdd: (school: RecommendationSchool) => void; onMove: (index: number, direction: -1 | 1) => void }) { const selected = new Set(items.map((item) => item.school_code)); return <PlannerLayout title="自選排序" intro={`你的試算成績是 ${score} 分。自己挑選學校後，系統會在清單中標示風險並給你排序參考。`}><div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><section><h2 className="text-xl">我的志願順序 <span className="text-sm font-normal text-slate-500">{items.length} 所</span></h2><div className="mt-4 grid gap-2">{items.map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3 jshs-surface-card"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--jshs-muted-surface)] font-black">{index + 1}</span><strong className="min-w-0 flex-1">{item.school_name}</strong><button type="button" onClick={() => onMove(index, -1)} className="text-sm text-[var(--jshs-primary)]">↑</button><button type="button" onClick={() => onMove(index, 1)} className="text-sm text-[var(--jshs-primary)]">↓</button></div>)}{!items.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">從右側加入學校，就會出現在這裡。</p> : null}</div></section><section><h2 className="text-xl">加入學校</h2><div className="mt-4 grid max-h-[560px] gap-2 overflow-auto">{schools.filter((school) => !selected.has(school.code)).slice(0, 30).map((school) => <SchoolRow key={school.code} school={school} action={() => onAdd(school)} />)}</div></section></div>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</PlannerLayout>; }
function SchoolRow({ school, action }: { school: RecommendationSchool; action: () => void }) { return <div className="flex items-center gap-3 rounded-xl bg-white p-3"><div className="min-w-0 flex-1"><strong className="block">{school.name}</strong><span className="text-xs text-slate-500">{school.referenceScore ? `參考 ${school.referenceScore} 分` : "參考分數待補"}</span></div><button type="button" onClick={action} className="shrink-0 px-3 py-2 text-xs jshs-button-secondary">加入</button></div>; }
function PlannerLayout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) { return <><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><p className="jshs-eyebrow">我的志願 · <Link href="/planner">回到選擇方式</Link></p><h1 className="mt-3">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">{intro}</p></div></section><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8">{children}</section></>; }
