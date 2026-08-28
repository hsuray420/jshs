"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAdmissionRule, type AdmissionDistrict } from "@/lib/admission-score";
import { SOURCE_ACADEMIC_YEAR, SERVICE_YEAR } from "@/lib/trust";
import { SourceBadge } from "@/components/source-badge";

const districts: Array<[AdmissionDistrict, string]> = [["ct", "中投區"], ["tp", "基北區"], ["ilan", "宜蘭區"], ["taoyuan-lienchiang", "桃連區"], ["hsinchu-miaoli", "竹苗區"], ["changhua", "彰化區"], ["yunlin", "雲林區"], ["kaohsiung", "高雄區"]];

export function InteractiveRuleTable() {
  const [district, setDistrict] = useState<AdmissionDistrict>("ct");
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const rule = useMemo(() => getAdmissionRule(district), [district]);
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="flex flex-wrap items-end justify-between gap-4"><label className="grid max-w-sm gap-2 text-sm font-black text-[var(--jshs-primary)]">選擇就學區<select value={district} onChange={(event) => setDistrict(event.target.value as AdmissionDistrict)}>{districts.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label><div className="flex gap-2" role="group" aria-label="規則顯示模式"><button type="button" onClick={() => setMode("quick")} className={`min-h-11 px-4 py-2 text-sm ${mode === "quick" ? "jshs-button-primary" : "jshs-button-secondary"}`}>快速了解</button><button type="button" onClick={() => setMode("full")} className={`min-h-11 px-4 py-2 text-sm ${mode === "full" ? "jshs-button-primary" : "jshs-button-secondary"}`}>完整規則</button></div></div><div className="mt-5 flex flex-wrap items-center gap-3"><SourceBadge sourceType="official_based_calculation" /><span className="text-sm jshs-muted-copy">服務年度 {SERVICE_YEAR}；規則來源 {SOURCE_ACADEMIC_YEAR} 學年度</span></div><div className="mt-4 overflow-x-auto"><table><thead><tr><th>採計項目</th><th>最高分</th><th>目前說明</th><th>展開</th></tr></thead><tbody>{rule.categories.map((item) => <tr key={item.key}><th>{item.label}</th><td>{item.max}</td><td>{item.description}</td><td><details><summary className="cursor-pointer text-[var(--jshs-primary)]">查看</summary><div className="min-w-64 py-3 text-left text-sm leading-6"><p><strong>精確計算：</strong>{item.description}</p><p><strong>上限：</strong>{item.max} 分</p>{mode === "full" ? <><p><strong>條件／注意事項：</strong>請依本區正式簡章與欄位提示核對採計資格。</p><p><strong>排除條件：</strong>未符合採計條件的資料不列入計分。</p><p><strong>官方原文：</strong>請開啟下方來源文件查看原文。</p></> : null}</div></details></td></tr>)}</tbody></table></div><div className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-5 text-sm leading-7"><strong>同分比序：</strong>{rule.tieBreakers.length ? rule.tieBreakers.join("、") : "請依本區正式簡章確認。"}<p className="mt-2 jshs-muted-copy">規則由研究 JSON／MD 轉換，供試算器、欄位提示與結果說明共用；116 正式規則公告後會重新校核。</p><Link href="/trust/sources" className="mt-2 inline-flex font-bold text-[var(--jshs-primary)]">查看官方來源 →</Link></div></section>;
}
