"use client";

import Link from "next/link";
import { NotificationCenter } from "@/components/notification-center";

type Feature = "push" | "line" | "email" | "calendar";
type ChannelStatus = "available" | "requires_login" | "requires_permission" | "not_configured" | "unavailable";
// Existing LINE preference key retained for delivery compatibility; it is not an Email switch.
const linePreferenceKeys = ["weekly_report_enabled"] as const;

const labels: Record<ChannelStatus, string> = { available: "可使用", requires_login: "需要登入", requires_permission: "需要授權", not_configured: "尚未設定", unavailable: "目前未提供" };

export function NotificationFeatureWorkspace({ feature, isMember }: { feature: Feature; isMember: boolean }) {
  const officialLineUrl = "";
  const lineStatus: ChannelStatus = isMember ? "available" : "requires_login";
  if (feature === "line") return <><ChannelState status={lineStatus} title="LINE 通知" body={isMember ? `此 channel 已有送達機制；可管理 ${linePreferenceKeys.length} 組既有 LINE 設定。` : "請先登入 LINE 會員，才能讀取與開通通知設定。"} action={!isMember ? <a href={officialLineUrl || "/api/line/login/start"} className="mt-4 inline-flex px-4 py-3 text-sm jshs-button-primary">使用 LINE 登入</a> : undefined} />{isMember ? <NotificationCenter isMember focus={undefined} title="管理 LINE 通知" intro="每個分類預設關閉，只有已開通的 LINE 通知才會送出。" /> : null}</>;
  if (feature === "calendar") return <ChannelState status="available" title="行事曆匯出" body="目前提供 ICS 匯出，不是背景推播服務。" action={<div className="mt-4 flex flex-wrap gap-3"><Link href="/schedule/timeline" className="inline-flex px-4 py-3 text-sm jshs-button-primary">前往重要時程匯出 ICS</Link><Link href="/schools/open-days" className="inline-flex px-4 py-3 text-sm jshs-button-secondary">管理校園開放日紀錄</Link></div>} />;
  if (feature === "email") return <ChannelState status="not_configured" title="Email 通知" body="目前尚未提供 Email 通知，也沒有可開啟的寄送 switch。" />;
  return <ChannelState status="unavailable" title="手機推播" body="目前尚未提供手機推播；不會顯示無法實際送達的啟用開關。" />;
}

function ChannelState({ status, title, body, action }: { status: ChannelStatus; title: string; body: string; action?: React.ReactNode }) { return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">通知方式</p><h2 className="mt-2">{title}</h2><span className="mt-3 inline-flex jshs-chip">{labels[status]}</span><p className="mt-4 text-sm leading-7 jshs-muted-copy">{body}</p>{action}</div></section>; }
