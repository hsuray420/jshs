"use client";

import { useEffect, useState } from "react";

type PlannerItem = {
  id: string;
  district: string;
  school_code: string;
  school_name: string;
  department: string;
  notes: string;
  created_at: string;
};

export function PlannerWorkspace() {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [status, setStatus] = useState("正在讀取已保存的規劃…");

  useEffect(() => {
    let active = true;
    fetch("/api/planner", { headers: { accept: "application/json" } })
      .then(async (response) => ({ response, payload: await response.json() as { items?: PlannerItem[] } }))
      .then(({ response, payload }) => {
        if (!active) return;
        setItems(payload.items || []);
        setStatus(response.ok ? "規劃已同步" : "暫時無法讀取規劃");
      })
      .catch(() => { if (active) setStatus("暫時無法讀取規劃"); });
    return () => { active = false; };
  }, []);

  async function remove(id: string) {
    const response = await fetch("/api/planner", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-[min(1040px,calc(100%-32px))] py-10 md:py-12">
          <p className="text-xs font-black tracking-[.18em] text-[#2868d7]">我的規劃</p>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">把候選校科放在同一張清單。</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">先收藏想比較的學校與科別，再回到志願策略整理挑戰、適中與穩定選項。</p>
        </div>
      </section>
      <section className="mx-auto w-[min(1040px,calc(100%-32px))] py-8 md:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-3xl font-black">收藏校科</h2><p className="mt-2 text-sm font-bold text-emerald-700">{status}</p></div><a className="rounded-xl bg-[#173d78] px-5 py-3 text-sm font-black text-white" href="/schools">繼續找學校</a></div>
        <div className="mt-6 grid gap-3">
          {items.map((item, index) => <article key={item.id} className="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-[44px_1fr_auto] md:items-center"><span className="grid h-11 w-11 place-items-center bg-blue-50 text-base font-black text-[#2868d7]">{index + 1}</span><div><p className="text-xs font-black tracking-[.12em] text-[#2868d7]">{item.district.toUpperCase()} · {item.school_code}</p><h3 className="mt-1 text-xl font-black">{item.school_name}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.department || "尚未指定科別"}</p></div><button className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-700" type="button" onClick={() => remove(item.id)}>移除</button></article>)}
          {!items.length && status.startsWith("規劃") ? <div className="border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="text-2xl font-black">目前還沒有收藏</h3><p className="mt-3 text-slate-500">從「找學校」加入候選校科後，就會出現在這裡。</p></div> : null}
        </div>
      </section>
    </>
  );
}
