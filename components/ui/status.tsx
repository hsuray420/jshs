import type { ReactNode } from "react";

export function LoadingState({ label = "正在載入資料…" }: { label?: string }) {
  return <div className="jshs-state-card" role="status" aria-live="polite"><span className="jshs-loading-dot" aria-hidden="true" />{label}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="jshs-state-card"><h2>{title}</h2>{description ? <p>{description}</p> : null}{action ? <div className="jshs-state-action">{action}</div> : null}</div>;
}

export function ErrorState({ title = "資料暫時無法載入", description = "請重新整理頁面；如果問題持續，請稍後再試。", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="jshs-state-card jshs-state-error" role="alert"><h2>{title}</h2><p>{description}</p>{action ? <div className="jshs-state-action">{action}</div> : null}</div>;
}
