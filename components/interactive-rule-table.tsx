"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAdmissionRule, type AdmissionDistrict, type ResearchField, type ScoreCategory } from "@/lib/admission-score";
import { SOURCE_ACADEMIC_YEAR, SERVICE_YEAR } from "@/lib/trust";
import { SourceBadge } from "@/components/source-badge";
import { humanizeRuleExplanation } from "@/lib/rule-display";
import { getDistrictOptions } from "@/lib/district-context";

const districts = getDistrictOptions().map(({ code, label }) => [code, label] as [AdmissionDistrict, string]);

const tieBreakerGroups = [
  ["總積分與志願序", "先比較整體積分，再依志願選填順序判定先後。"],
  ["就近入學與弱勢身分", "符合就近入學或扶助弱勢條件時，依本區規則列入比序。"],
  ["多元學習表現", "依均衡學習、服務學習、品德與獎勵等已核對資料比較。"],
  ["會考成績與同分比序", "若前項仍相同，再依會考成績、等級與官方公告順序比較。"],
] as const;

export function InteractiveRuleTable() {
  const [district, setDistrict] = useState<AdmissionDistrict>("ct");
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const rule = useMemo(() => getAdmissionRule(district), [district]);

  return (
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="grid max-w-sm gap-2 text-sm font-black text-[var(--jshs-primary)]">
          選擇就學區
          <select id="rule-district" name="district" value={district} onChange={(event) => setDistrict(event.target.value as AdmissionDistrict)}>
            {districts.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <div className="flex gap-2" role="group" aria-label="規則顯示模式">
          <button type="button" onClick={() => setMode("quick")} className={`min-h-11 px-4 py-2 text-sm ${mode === "quick" ? "jshs-button-primary" : "jshs-button-secondary"}`}>快速了解</button>
          <button type="button" onClick={() => setMode("full")} className={`min-h-11 px-4 py-2 text-sm ${mode === "full" ? "jshs-button-primary" : "jshs-button-secondary"}`}>完整規則</button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SourceBadge sourceType="official_based_calculation" />
        <span className="text-sm jshs-muted-copy">服務年度 {SERVICE_YEAR}；規則來源 {SOURCE_ACADEMIC_YEAR} 學年度</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table>
          <thead><tr><th>採計項目</th><th>最高分</th><th>目前說明</th><th>展開</th></tr></thead>
          <tbody>{rule.categories.map((item) => <CategoryRow key={item.key} item={item} fields={fieldsForCategory(rule.fields || [], item)} mode={mode} sourceNote={rule.sourceNote} />)}</tbody>
        </table>
      </div>
      <div className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-5 text-sm leading-7">
        <strong>同分比序：</strong>分成四個容易理解的階段，實際順序依所選就學區規則套用。
        <details className="mt-3 rounded-xl bg-white/70 p-4">
          <summary className="cursor-pointer font-bold text-[var(--jshs-primary)]">查看同分比序說明</summary>
          <div className="mt-3 grid gap-3">
            {tieBreakerGroups.map(([label, description]) => <div key={label}><strong>{label}</strong><p className="jshs-muted-copy">{description}</p></div>)}
            <p className="text-xs leading-5 text-slate-500">這裡呈現的是給學生與家長看的規則分組；完整欄位與逐項計算方式，請在上方切換「完整規則」後展開各採計項目。</p>
          </div>
        </details>
        <p className="mt-2 jshs-muted-copy">同分比序會依已核對的規則資料套用；116 正式規則公告後會重新校核。</p>
        <Link href="/trust/sources" className="mt-2 inline-flex font-bold text-[var(--jshs-primary)]">查看資料來源與版本 →</Link>
      </div>
    </section>
  );
}

function CategoryRow({ item, fields, mode, sourceNote }: { item: ScoreCategory; fields: readonly ResearchField[]; mode: "quick" | "full"; sourceNote: string }) {
  return (
    <tr>
      <th>{item.label}</th><td>{item.max}</td><td>{item.description}</td>
      <td><details><summary className="cursor-pointer text-[var(--jshs-primary)]">查看</summary>
        <div className="min-w-[18rem] max-w-3xl py-3 text-left text-sm leading-6">
          <p><strong>如何計算：</strong>{humanizeRuleExplanation(item.calculation, item.description)}</p>
          <p><strong>上限：</strong>{item.max} 分</p>
          {mode === "full" ? <>
            {fields.length ? <div className="mt-3 grid gap-2"><strong>需要填寫的資料與說明</strong>{fields.map((field) => <FieldDetail key={field.field_id} field={field} />)}</div> : null}
            <p className="mt-3"><strong>規則來源：</strong>{sourceNote}</p>
          </> : <p className="mt-3 jshs-muted-copy">切換「完整規則」可查看此項目使用的欄位、條件、上限、可核對分值與官方原文。</p>}
        </div>
      </details></td>
    </tr>
  );
}

function FieldDetail({ field }: { field: ResearchField }) {
  const optionScores = (field.options || []).filter((option) => option.score !== null && option.score !== undefined).map((option) => `${option.label}：${option.score} 分`);
  return <details className="rounded-xl bg-[var(--jshs-muted-surface)] p-3"><summary className="cursor-pointer font-bold">{field.label}</summary><div className="mt-2 grid gap-1 text-slate-700">
    {field.calculation ? <p><strong>如何計算：</strong>{humanizeRuleExplanation(field.calculation, field.helper_text || "依本區規則換算")}</p> : null}
    {field.conditions?.length ? <p><strong>條件：</strong>{field.conditions.join("；")}</p> : null}
    {field.score_cap !== undefined && field.score_cap !== null ? <p><strong>欄位上限：</strong>{field.score_cap} 分</p> : null}
    {optionScores.length ? <p><strong>可核對分值：</strong>{optionScores.join("；")}</p> : null}
    {field.adopted_period ? <p><strong>採計期間：</strong>{field.adopted_period}</p> : null}
    {field.evidence_description ? <p><strong>證明資料：</strong>{field.evidence_description}</p> : null}
    {field.helper_text ? <p><strong>欄位提示：</strong>{field.helper_text}</p> : null}
    {field.official_rule ? <p><strong>官方原文：</strong>{field.official_rule}</p> : null}
  </div></details>;
}

function fieldsForCategory(fields: readonly ResearchField[], category: ScoreCategory) {
  const related = fields.filter((field) => {
    const fieldCategory = field.category?.trim();
    if (!fieldCategory) return false;
    return fieldCategory === category.label || category.label.includes(fieldCategory) || fieldCategory.includes(category.label);
  });
  return related.length ? related : fields.filter((field) => field.category === category.label);
}
