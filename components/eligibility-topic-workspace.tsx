"use client";

import { useState } from "react";

type Topic = "special-admission" | "gifted-special-education" | "direct-selection";
type TopicOption = { value: string; label: string };

const topicConfig: Record<Topic, { title: string; prompt: string; options: TopicOption[]; checklist: string[]; next: string[] }> = {
  "special-admission": { title: "特色招生／特色班準備工作區", prompt: "你想申請哪一種特色管道？", options: [{ value: "specialized", label: "特色招生" }, { value: "class", label: "特色班" }, { value: "skill", label: "術科或專長甄選" }, { value: "portfolio", label: "作品／面試甄選" }], checklist: ["確認招生學校與當年度簡章", "整理競賽、作品或專長證明", "確認術科／面試／作品繳交方式", "記下報名、甄試與放榜日期"], next: ["先選定想申請的學校與招生類型", "向國中輔導室確認報名資格與校內作業", "再到招生學校確認名額、甄試內容與期限"] },
  "gifted-special-education": { title: "資優／特殊教育升學工作區", prompt: "你目前需要確認哪一類支持？", options: [{ value: "gifted", label: "資優鑑定／安置" }, { value: "special", label: "特殊教育安置" }, { value: "iep", label: "個別化教育計畫（IEP）" }, { value: "support", label: "學習與考試支持" }], checklist: ["確認目前鑑定結果與有效期間", "整理安置、IEP 或學習支持紀錄", "與特教組／輔導室確認升學管道", "確認是否需要申請特殊考場或相關服務"], next: ["先找特教組、輔導室或個別化教育計畫團隊", "把鑑定、安置與支持紀錄交由校內承辦人核對", "確認適用管道後，再檢查招生簡章與申請期限"] },
  "direct-selection": { title: "直升與甄選入學工作區", prompt: "你想先整理哪一條路？", options: [{ value: "direct", label: "校內直升" }, { value: "selection", label: "學校甄選" }, { value: "interview", label: "面試／口試" }, { value: "skill", label: "術科／實作" }], checklist: ["確認校內資格與成績條件", "確認招生學校的名額與招生類型", "準備面試、術科或作品資料", "確認報名、甄試、放榜與報到日期"], next: ["先向就讀國中確認校內資格與推薦流程", "再向招生學校確認甄試項目與名額", "把正式期限加入時間日程，避免錯過報名"] },
};

export function EligibilityTopicWorkspace({ topic }: { topic: Topic }) {
  const config = topicConfig[topic];
  const storageKey = `jshs_eligibility_topic_${topic}`;
  const stored = readTopicState(storageKey, config.checklist.length);
  const [option, setOption] = useState(stored.option);
  const [checked, setChecked] = useState<boolean[]>(stored.checked);
  const [confirmed, setConfirmed] = useState(stored.confirmed);

  function save(nextOption = option, nextChecked = checked, nextConfirmed = confirmed) {
    window.localStorage.setItem(storageKey, JSON.stringify({ option: nextOption, checked: nextChecked, confirmed: nextConfirmed }));
  }

  function updateOption(value: string) { setOption(value); save(value); }
  function updateCheck(index: number, value: boolean) { const next = checked.map((item, itemIndex) => itemIndex === index ? value : item); setChecked(next); save(option, next, confirmed); }
  function updateConfirmed(value: boolean) { setConfirmed(value); save(option, checked, value); }

  const completed = checked.filter(Boolean).length;
  // The source link intentionally remains a plain anchor because this is a client-only support workspace.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12" aria-label={config.title}><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><article className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">可操作工作區</p><h2 className="mt-2">{config.title}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">這裡把說明轉成你的準備清單；選擇與勾選只保存在目前裝置，不代表正式資格核定。</p><label className="mt-6 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{config.prompt}<select value={option} onChange={(event) => updateOption(event.target.value)}><option value="">請先選擇</option>{config.options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div className="mt-7 flex items-end justify-between gap-3"><div><p className="jshs-eyebrow">我的準備清單</p><h3 className="mt-1">完成一項，再往下一項</h3></div><span className="jshs-chip">{completed} / {config.checklist.length}</span></div><div className="mt-4 grid gap-3">{config.checklist.map((item, index) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><input type="checkbox" checked={checked[index]} onChange={(event) => updateCheck(index, event.target.checked)} className="mt-1 h-5 w-5" /><span><strong>{item}</strong><small className="mt-1 block leading-5 jshs-muted-copy">完成後可回來繼續，不會遺失目前進度。</small></span></label>)}</div><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--jshs-border)] p-4"><input type="checkbox" checked={confirmed} onChange={(event) => updateConfirmed(event.target.checked)} className="mt-1 h-5 w-5" /><span><strong>我已向校內承辦人確認這條升學路徑</strong><small className="mt-1 block leading-5 jshs-muted-copy">網站只能協助整理，正式資格仍由學校與招生單位確認。</small></span></label></article><aside className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">下一步建議</p><h3 className="mt-2 text-2xl">{option ? config.options.find((item) => item.value === option)?.label : "先選一條路徑"}</h3><ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">{config.next.map((item) => <li key={item} className="rounded-xl bg-[var(--jshs-muted-surface)] p-3">{item}</li>)}</ul><div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>{completed === config.checklist.length && confirmed ? "準備檢查完成" : "目前是準備草稿"}</strong><p className="mt-1">請將這份清單帶去和國中承辦人、招生學校或招生委員會逐項核對。</p></div><a href="/trust/sources" className="mt-6 inline-flex px-4 py-3 text-sm jshs-button-secondary">查看官方資料來源 →</a></aside></div></section>;
}

function readTopicState(key: string, count: number) {
  const fallback = { option: "", checked: Array.from({ length: count }, () => false), confirmed: false };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || "null") as Partial<typeof fallback> | null;
    return { option: typeof stored?.option === "string" ? stored.option : "", checked: Array.from({ length: count }, (_, index) => Boolean(stored?.checked?.[index])), confirmed: stored?.confirmed === true };
  } catch { return fallback; }
}
