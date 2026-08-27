"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAdmissionRule, type AdmissionDistrict } from "@/lib/admission-score";
import { getDistrictAdmissionSchedule } from "@/lib/admission-schedules";

type Identity = "none" | "indigenous" | "disability" | "other";
type DocumentKey = "identity" | "school" | "proof" | "special";

const districts: readonly { code: AdmissionDistrict; label: string }[] = [
  ["tp", "基北區"], ["ct", "中投區"], ["ilan", "宜蘭區"], ["taoyuan-lienchiang", "桃連區"], ["hsinchu-miaoli", "竹苗區"],
  ["changhua", "彰化區"], ["yunlin", "雲林區"], ["chiayi", "嘉義區"], ["tainan", "臺南區"], ["kaohsiung", "高雄區"],
  ["pingtung", "屏東區"], ["hualien", "花蓮區"], ["taitung", "臺東區"], ["penghu", "澎湖區"], ["kinmen", "金門區"],
].map(([code, label]) => ({ code: code as AdmissionDistrict, label }));

const identityOptions: readonly { value: Identity; label: string; short: string }[] = [
  { value: "none", label: "目前沒有特殊身分", short: "使用一般免試入學規則" },
  { value: "indigenous", label: "原住民學生", short: "可能涉及外加名額或升學優待" },
  { value: "disability", label: "身心障礙學生", short: "可能涉及外加名額、優待或特教安置" },
  { value: "other", label: "其他依法享有升學優待者", short: "需由學校承辦人確認適用法規" },
];

const documentLabels: Record<DocumentKey, string> = {
  identity: "身分證明或戶籍資料",
  school: "就讀國中學籍／在校資料",
  proof: "主管機關或公所核發的有效證明",
  special: "特殊身分申請表、安置或相關核定文件",
};

const storageKey = "jshs_special_qualification_workspace";

export function SpecialQualificationWorkspace() {
  const stored = loadStoredQualificationState();
  const [district, setDistrict] = useState<AdmissionDistrict>(stored.district);
  const [identity, setIdentity] = useState<Identity>(stored.identity);
  const [documents, setDocuments] = useState<Record<DocumentKey, boolean>>(stored.documents);
  const [confirmedWithSchool, setConfirmedWithSchool] = useState(stored.confirmedWithSchool);
  const [saved, setSaved] = useState(false);

  const rule = getAdmissionRule(district);
  const selectedIdentity = identityOptions.find((item) => item.value === identity) || identityOptions[0];
  const schedule = getDistrictAdmissionSchedule(district);
  const reviewDate = schedule.find((item) => /審查|積分/.test(item.title));
  const requiredDocuments = identity === "none" ? ["identity", "school"] as DocumentKey[] : ["identity", "school", "proof", "special"] as DocumentKey[];
  const completedDocuments = requiredDocuments.filter((key) => documents[key]).length;
  const isReady = identity === "none" || (completedDocuments === requiredDocuments.length && confirmedWithSchool);
  const status = identity === "none" ? "一般資格路徑" : isReady ? "已完成自我準備檢查" : "還需要補齊或確認";

  const guidance = useMemo(() => {
    if (identity === "none") return ["直接使用一般免試入學試算", "仍需確認就學區、學年度與一般報名文件"];
    if (identity === "indigenous") return ["請向國中註冊組確認原住民身分認定與外加名額／優待管道", "特殊身分不直接加進一般總分，須依招生簡章另行比序"];
    if (identity === "disability") return ["請與特教組、輔導室及註冊組一起確認鑑定、安置與報名管道", "體適能免測或替代計分，和特殊身分升學優待是不同事項"];
    return ["請把具體身分類別與證明交給國中承辦人判定", "不要只依網站勾選結果決定是否具備報名資格"];
  }, [identity]);

  function updateState(next: Partial<{ district: AdmissionDistrict; identity: Identity; documents: Record<DocumentKey, boolean>; confirmedWithSchool: boolean }>) {
    const snapshot = { district: next.district ?? district, identity: next.identity ?? identity, documents: next.documents ?? documents, confirmedWithSchool: next.confirmedWithSchool ?? confirmedWithSchool };
    setDistrict(snapshot.district); setIdentity(snapshot.identity); setDocuments(snapshot.documents); setConfirmedWithSchool(snapshot.confirmedWithSchool);
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot)); setSaved(true); window.setTimeout(() => setSaved(false), 1600);
  }

  function exportSummary() {
    const text = [`115學年度特殊資格準備摘要`, `就學區：${districts.find((item) => item.code === district)?.label}`, `特殊身分：${selectedIdentity.label}`, `狀態：${status}`, `文件：${requiredDocuments.map((key) => `${documentLabels[key]} ${documents[key] ? "已準備" : "待補"}`).join("；")}`, `已向學校承辦人確認：${confirmedWithSchool ? "是" : "否"}`, `下一步：${guidance.join("；")}`, `提醒：本摘要不是資格核定，仍以當年度簡章、學校與招生委員會審查為準。`].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "jshs-特殊資格準備摘要.txt"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] pb-12" aria-label="特殊資格準備工作區">
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <article className="p-6 md:p-8 jshs-surface-card">
        <p className="jshs-eyebrow">特殊資格工作區</p><h2 className="mt-2">用三分鐘整理好自己的申請路徑</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">先選區域與身分，再逐項確認文件。這裡協助你準備，不取代學校或招生委員會的正式審查。</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">適用就學區<select value={district} onChange={(event) => updateState({ district: event.target.value as AdmissionDistrict })}>{districts.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select><small className="font-normal jshs-muted-copy">目前套用 {rule.label} 的 115 學年度資料。</small></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">你的身分類型<select value={identity} onChange={(event) => updateState({ identity: event.target.value as Identity })}>{identityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small className="font-normal jshs-muted-copy">{selectedIdentity.short}</small></label></div>
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950"><strong>重要：特殊身分不會自動加到一般總分。</strong><p className="mt-1">原住民、身心障礙及其他依法優待身分，通常要依專屬法規、外加名額或招生簡章附錄辦理。</p></div>
        <div className="mt-7"><div className="flex items-end justify-between gap-3"><div><p className="jshs-eyebrow">文件準備</p><h3 className="mt-1">逐項確認，不再漏帶資料</h3></div><span className="jshs-chip">{completedDocuments} / {requiredDocuments.length} 已準備</span></div><div className="mt-4 grid gap-3">{requiredDocuments.map((key) => <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><input type="checkbox" checked={documents[key]} onChange={(event) => updateState({ documents: { ...documents, [key]: event.target.checked } })} className="mt-1 h-5 w-5" /><span><strong>{documentLabels[key]}</strong><small className="mt-1 block leading-5 jshs-muted-copy">請以學校承辦人提供的當年度文件名稱與有效期限為準。</small></span></label>)}</div>{identity !== "none" ? <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--jshs-border)] p-4"><input type="checkbox" checked={confirmedWithSchool} onChange={(event) => updateState({ confirmedWithSchool: event.target.checked })} className="mt-1 h-5 w-5" /><span><strong>我已向就讀國中承辦人確認適用管道</strong><small className="mt-1 block leading-5 jshs-muted-copy">網站結果只能整理問題；正式資格由學校與招生單位核定。</small></span></label> : null}</div>
        {saved ? <p className="mt-4 text-sm font-bold text-[var(--jshs-success)]" role="status">已儲存在這台裝置。</p> : null}
      </article>
      <aside className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">你的目前狀態</p><div className={`mt-3 rounded-2xl p-5 ${isReady ? "bg-emerald-50 text-emerald-950" : "bg-[var(--jshs-muted-surface)]"}`}><span className="text-sm font-bold">{status}</span><h3 className="mt-2 text-2xl">{identity === "none" ? "可走一般試算" : isReady ? "可以帶著資料去確認" : "還差最後幾步"}</h3></div><div className="mt-6"><p className="font-black text-[var(--jshs-primary)]">建議下一步</p><ul className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">{guidance.map((item) => <li key={item} className="rounded-xl bg-[var(--jshs-muted-surface)] p-3">{item}</li>)}</ul></div>{reviewDate ? <p className="mt-5 rounded-xl border border-[var(--jshs-border)] p-3 text-sm leading-6 text-slate-600">近期相關節點：{reviewDate.eventDate} · {reviewDate.title}<br /><small>{reviewDate.description}</small></p> : null}<div className="mt-6 grid gap-2"><Link href={`/tools/rules?district=${district}`} className="px-4 py-3 text-center text-sm jshs-button-primary">查看 {rule.label} 規則</Link><Link href={`/tools/summary?district=${district}`} className="px-4 py-3 text-center text-sm jshs-button-secondary">回到 {rule.label} 試算</Link><button type="button" onClick={exportSummary} className="px-4 py-3 text-sm jshs-button-secondary">匯出準備摘要</button></div></aside>
    </div>
  </section>;
}

function loadStoredQualificationState() {
  const fallback = { district: "ct" as AdmissionDistrict, identity: "none" as Identity, documents: { identity: false, school: false, proof: false, special: false }, confirmedWithSchool: false };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "null") as Partial<typeof fallback> | null;
    return {
      district: stored?.district && districts.some((item) => item.code === stored.district) ? stored.district : fallback.district,
      identity: stored?.identity && identityOptions.some((item) => item.value === stored.identity) ? stored.identity : fallback.identity,
      documents: { ...fallback.documents, ...(stored?.documents || {}) },
      confirmedWithSchool: stored?.confirmedWithSchool === true,
    };
  } catch { return fallback; }
}
