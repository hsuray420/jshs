"use client";

import { useEffect, useState } from "react";

type PreferenceKey = "planner_finalized_enabled" | "score_calculated_enabled" | "important_date_enabled" | "weekly_report_enabled";
type Preferences = Record<PreferenceKey, boolean>;

const settings: readonly [PreferenceKey, string, string][] = [
  ["planner_finalized_enabled", "志願完成通知", "每次按下「確認完成志願」後，收到保存結果。"],
  ["score_calculated_enabled", "成績試算通知", "每次成功完成成績試算後，收到試算摘要。"],
  ["important_date_enabled", "重要日期通知", "重要升學日期到期前，收到後台發布的提醒。"],
  ["weekly_report_enabled", "LINE 每週摘要", "每週收到試算、志願與重要日期的進度摘要。"],
];

const emptyPreferences: Preferences = {
  planner_finalized_enabled: false,
  score_calculated_enabled: false,
  important_date_enabled: false,
  weekly_report_enabled: false,
};

export function NotificationCenter({ isMember, focus, title = "由你決定要不要收到 LINE 通知", intro }: { isMember: boolean; focus?: readonly PreferenceKey[]; title?: string; intro?: string }) {
  const [enabled, setEnabled] = useState<Preferences>(emptyPreferences);
  const [status, setStatus] = useState(isMember ? "正在讀取通知設定…" : "請先使用 LINE 登入，再開通通知。");
  const [saving, setSaving] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    if (!isMember) return;
    let active = true;
    fetch("/api/notifications/preferences", { headers: { accept: "application/json" } })
      .then(async (response) => ({ response, payload: await response.json() as { preferences?: Preferences } }))
      .then(({ response, payload }) => {
        if (!active) return;
        if (response.ok && payload.preferences) {
          setEnabled(payload.preferences);
          setStatus("通知設定已從會員帳號讀取。");
        } else setStatus("目前無法讀取通知設定。");
      })
      .catch(() => { if (active) setStatus("目前無法讀取通知設定。"); });
    return () => { active = false; };
  }, [isMember]);

  async function toggle(key: PreferenceKey) {
    if (!isMember || saving) return;
    const nextValue = !enabled[key];
    setEnabled((current) => ({ ...current, [key]: nextValue }));
    setSaving(key);
    const response = await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: nextValue }),
    }).catch(() => null);
    setSaving(null);
    if (response?.ok) setStatus(nextValue ? "已開通這項 LINE 通知。" : "已關閉這項 LINE 通知。");
    else {
      setEnabled((current) => ({ ...current, [key]: !nextValue }));
      setStatus("設定儲存失敗，請稍後再試。");
    }
  }

  const visibleSettings = focus ? settings.filter(([id]) => focus.includes(id)) : settings;
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="p-6 md:p-8 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">通知與提醒</p><h2 className="mt-2">{title}</h2>{intro ? <p className="mt-3 max-w-2xl text-sm leading-6 jshs-muted-copy">{intro}</p> : null}</div><span className="jshs-chip">預設全部關閉</span></div>{!isMember ? <p className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">LINE 通知需要會員身分與你的主動開通。<a className="ml-1 font-black text-[var(--jshs-primary)] underline" href="/api/line/login/start">使用 LINE 登入</a></p> : null}<div className="mt-6 grid gap-3">{visibleSettings.map(([id, settingTitle, detail]) => <label id={id} key={id} className={`flex items-center gap-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 ${!isMember ? "opacity-60" : "cursor-pointer"}`}><input type="checkbox" checked={Boolean(enabled[id])} disabled={!isMember || Boolean(saving)} onChange={() => void toggle(id)} className="h-5 w-5" /><span className="min-w-0"><strong className="block">{settingTitle}</strong><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{detail}</span></span><span className="ml-auto text-xs font-black text-[var(--jshs-primary)]">{enabled[id] ? "已開通" : "未開通"}</span></label>)}</div>{status ? <p className="mt-5 text-sm font-bold text-[var(--jshs-success)]" role="status">{status}</p> : null}<p className="mt-3 text-xs leading-5 jshs-muted-copy">後台仍可暫停任何一類通知；即使後台開啟，也必須先由你在這裡開通才會推送。</p></div></section>;
}
