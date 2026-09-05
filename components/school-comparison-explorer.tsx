"use client";
import Link from "next/link";
import { useState } from "react";
import type { School } from "@/lib/school-repository";
import { SchoolSelection } from "@/components/school-selection";

const field = (value: string) => value.trim() || "目前沒有資料";
export function SchoolComparisonExplorer({ schools, initialDistrict }: { schools: readonly School[]; initialDistrict?: string }) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const chosen = selected.flatMap(code => schools.filter(s => s.code === code));
  const toggle = (code: string) => setSelected(current => current.includes(code) ? current.filter(c => c !== code) : current.length < 4 ? [...current, code] : current);
  const rows: readonly [string, (s: School) => string][] = [
    ['公私立', s => s.ownership], ['學制', s => s.schoolType], ['男女校', s => s.gender], ['地區', s => `${s.city} ${s.area}`],
    ['招生名額', s => s.admissionRecords.map(r => `${r.sourceDistrict}：${r.admissionQuota || '目前沒有資料'}`).join('；')],
    ['科別', s => s.admissionRecords.map(r => `${r.sourceDistrict}：${r.departmentRaw || '目前沒有資料'}`).join('；')],
    ['特色班', s => s.features], ['課程方向', s => s.courseDirection], ['實習／專題', s => s.project], ['交通', s => s.transport], ['通勤說明', s => s.commute], ['住宿', s => s.lodging],
  ];
  return <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8"><SchoolSelection schools={schools} selected={selected} onToggle={toggle} initialDistrict={initialDistrict} />{chosen.length < 2 ? <p className="mt-6 rounded-xl border border-dashed p-5">請選擇 2 至 4 所學校，查看完整比較。</p> : <section className="mt-8"><h2 className="text-2xl font-bold">學校比較 · 115 學年度</h2><p className="mt-2 text-sm">各招生區名額分別列示，不跨區加總；進修部為獨立招生單位。</p><div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">{chosen.map(s => <article className="min-w-0 rounded-2xl border p-4 md:p-6" key={s.code}><h3 className="text-xl font-bold">{s.name}</h3><Link className="inline-flex min-h-11 items-center text-blue-700" href={`/schools/${s.code}`}>查看學校與官方來源 →</Link><dl className="divide-y">{rows.map(([label, value]) => <div className="py-3" key={label}><dt className="font-bold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-7">{field(value(s))}</dd></div>)}</dl></article>)}</div></section>}</section>;
}
