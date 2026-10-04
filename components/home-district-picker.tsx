"use client";

import { useEffect, useState } from "react";
import { markProgress } from "@/lib/progress";

type DistrictOption = Readonly<{
  code: string;
  label: string;
  academicYear: string;
  dataStatus: string;
  updatedAt: string;
  calculator: boolean;
}>;

const statusLabels: Readonly<Record<string, string>> = { ready: "已校核", reference: "參考資料" };

export function HomeDistrictPicker({ options }: { options: readonly DistrictOption[] }) {
  const [district, setDistrict] = useState("");

  useEffect(() => {
    const sync = () => setDistrict(window.localStorage.getItem("jshs_district") || "");
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("jshs-progress", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("jshs-progress", sync);
    };
  }, []);

  const selected = options.find((option) => option.code === district);

  return (
    <section aria-labelledby="home-district-title" className="mt-6 border-t border-[var(--jshs-border)] pt-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-black tracking-[.12em] text-[var(--jshs-primary)]">就學區上下文</p><h2 id="home-district-title" className="mt-2 text-lg font-black">現在使用哪一區？</h2></div>
        <span className="jshs-chip">{selected ? `${selected.academicYear} 學年度` : "尚未選擇"}</span>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-bold text-[var(--jshs-primary)]">
        <span className="sr-only">選擇就學區</span>
        <select value={district} onChange={(event) => { const next = event.target.value; setDistrict(next); markProgress("district", next); }} className="h-12 rounded-full border border-[var(--jshs-border)] bg-white px-4 text-base text-[var(--jshs-ink)]">
          <option value="">請先選擇就學區</option>
          {options.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
        </select>
      </label>
      {selected ? <p className="mt-3 text-xs leading-5 jshs-muted-copy">資料狀態：{statusLabels[selected.dataStatus] || selected.dataStatus} · 更新：{selected.updatedAt} · {selected.calculator ? "可使用積分試算" : "目前先提供校科查詢"}</p> : <p className="mt-3 text-xs leading-5 jshs-muted-copy">先選區域，首頁進度與後續工具才會使用正確的規則脈絡。</p>}
    </section>
  );
}
