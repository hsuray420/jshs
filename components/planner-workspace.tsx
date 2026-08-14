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
  const [status, setStatus] = useState("正在從 Cloudflare D1 載入…");

  useEffect(() => {
    let active = true;
    fetch("/api/planner", { headers: { accept: "application/json" } })
      .then(async (response) => ({ response, payload: await response.json() as { items?: PlannerItem[] } }))
      .then(({ response, payload }) => {
        if (!active) return;
        setItems(payload.items || []);
        setStatus(response.ok ? "已和 Cloudflare D1 同步" : "暫時無法讀取規劃");
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
      <section className="border-b border-blue-100 bg-[radial-gradient(circle_at_82%_0%,#dcecff,transparent_34%),linear-gradient(135deg,#fff,#edf5ff)]">
        <div className="mx-auto w-[min(1040px,calc(100%-32px))] py-16 md:py-24">
          <p className="text-xs font-black tracking-[.18em] text-[#2868d7]">CLOUDFLARE PRIVATE PLANNER</p>
          <h1 className="mt-5 text-5xl font-black leading-[1.08] tracking-[-.055em] md:text-7xl">你的志願規劃，<br />不再只存在這台瀏覽器。</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">收藏項目儲存在 JSHS 的 Cloudflare D1，瀏覽器只保留匿名、安全的規劃識別碼；不經 Google Drive 或其他資料服務。</p>
        </div>
      </section>
      <section className="mx-auto w-[min(1040px,calc(100%-32px))] py-12 md:py-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-3xl font-black">收藏校科</h2><p className="mt-2 text-sm font-bold text-emerald-700">{status}</p></div><a className="rounded-xl bg-[#173d78] px-5 py-3 text-sm font-black text-white" href="/schools">繼續找學校</a></div>
        <div className="mt-7 grid gap-4">
          {items.map((item, index) => <article key={item.id} className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[56px_1fr_auto] md:items-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-lg font-black text-[#2868d7]">{index + 1}</span><div><p className="text-xs font-black tracking-[.12em] text-[#2868d7]">{item.district.toUpperCase()} · {item.school_code}</p><h3 className="mt-2 text-2xl font-black">{item.school_name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.department || "尚未指定科別"}</p></div><button className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-700" type="button" onClick={() => remove(item.id)}>移除</button></article>)}
          {!items.length && status.startsWith("已") ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="text-2xl font-black">目前還沒有收藏</h3><p className="mt-3 text-slate-500">從「找學校」加入候選校科後，就會出現在這裡。</p></div> : null}
        </div>
      </section>
    </>
  );
}
