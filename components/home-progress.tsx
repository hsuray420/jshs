"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultProgress, PROGRESS_STORAGE_KEY, readProgress, type ProgressState } from "@/lib/progress";
import { SERVICE_YEAR } from "@/lib/trust";

const steps = [
  { key: "district", label: "選擇就學區", detail: "先確認適用區域與資料狀態。", href: "/districts" },
  { key: "schoolSearch", label: "開始找校科", detail: "搜尋學校、科系與學制分類。", href: "/schools" },
  { key: "calculator", label: "完成試算", detail: "用已校核規則整理個人分數。", href: "/tools" },
  { key: "planner", label: "建立規劃", detail: "收藏、分層並留下下一步。", href: "/planner" },
] as const;

const districtLabels: Readonly<Record<string, string>> = {
  tp: "基北區", ilan: "宜蘭區", "taoyuan-lienchiang": "桃連區", "hsinchu-miaoli": "竹苗區", ct: "中投區",
  changhua: "彰化區", yunlin: "雲林區", chiayi: "嘉義區", tainan: "臺南區", kaohsiung: "高雄區", pingtung: "屏東區",
  hualien: "花蓮區", taitung: "臺東區", penghu: "澎湖區", kinmen: "金門區",
};

export function HomeProgress() {
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);

  useEffect(() => {
    const sync = () => setProgress(readProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("jshs-progress", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("jshs-progress", sync);
    };
  }, []);

  const completed = steps.filter((step) => step.key === "district" ? Boolean(progress.district) : progress[step.key]).length;
  const next = steps.find((step) => step.key === "district" ? !progress.district : !progress[step.key]) || steps[steps.length - 1];

  return (
    <section aria-labelledby="home-progress-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8 md:py-10">
      <div className="p-5 md:p-6 jshs-surface-card">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="jshs-eyebrow">{SERVICE_YEAR} 學年度 · 你的升學進度</p>
            <h2 id="home-progress-title" className="mt-2 text-2xl font-black">下一步：{next.label}</h2>
            <p className="mt-2 text-sm leading-6 jshs-muted-copy">已完成 {completed} / {steps.length} 個核心步驟{progress.district ? ` · 目前：${districtLabels[progress.district] || progress.district}` : ""}</p>
          </div>
          <Link href={next.href} className="px-4 py-3 text-sm jshs-button-primary">繼續這一步 →</Link>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const done = step.key === "district" ? Boolean(progress.district) : progress[step.key];
            return <Link key={step.key} href={step.href} data-progress-step={step.key} className={`rounded-[1.5rem] border p-4 ${done ? "border-[var(--brand-tint-strong)] bg-[var(--jshs-muted-surface)]" : "border-[var(--jshs-border)] bg-white"}`}><span className="text-xs font-black text-[var(--jshs-primary)]">{done ? "✓ 已完成" : `0${index + 1}`}</span><b className="mt-2 block text-sm text-[var(--jshs-ink)]">{step.label}</b><span className="mt-1 block text-xs leading-5 jshs-muted-copy">{step.detail}</span></Link>;
          })}
        </div>
      </div>
    </section>
  );
}
