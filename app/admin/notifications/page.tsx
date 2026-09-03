import { listNotificationSettings } from "../../../db/notification-store";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

const labels: Record<string, { title: string; description: string }> = {
  planner_finalized: { title: "志願完成通知", description: "使用者完成志願規劃後發送 LINE 通知。" },
  score_calculated: { title: "成績試算完成通知", description: "使用者完成成績試算後發送 LINE 通知。" },
  important_date: { title: "重要日期通知", description: "重要日期到達設定時間後發送提醒。" },
};

export default async function NotificationsPage() {
  await requireAdmin();
  const settings = await listNotificationSettings();
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Operations / Notifications</p><h1>通知中心</h1><p className="admin-muted">先用中文管理通知；工程事件與可用變數收在進階設定。</p></div></section><section className="admin-module-stack">{settings.map((setting) => { const label = labels[setting.event_key] || { title: setting.event_key, description: "後台通知事件。" }; return <form className="admin-panel admin-setting-row" key={setting.event_key} action="/api/admin/notifications" method="post"><input type="hidden" name="action" value="update_setting" /><input type="hidden" name="event_key" value={setting.event_key} /><div className="admin-setting-heading"><div><h2>{label.title}</h2><p className="admin-muted">{label.description}</p></div><label className="admin-switch"><input name="enabled" type="checkbox" defaultChecked={setting.enabled === 1} /> <span>{setting.enabled ? "已開啟" : "已關閉"}</span></label></div><label>通知標題<input name="title" defaultValue={setting.title} maxLength={100} required /></label><label>通知內容<textarea name="body_template" defaultValue={setting.body_template} rows={4} maxLength={1000} required /></label><details><summary>進階設定</summary><p className="admin-muted">Event ID：<code>{setting.event_key}</code> · 可用變數：<code>{setting.event_key === "planner_finalized" ? "{count}" : setting.event_key === "score_calculated" ? "{district} {academicYear} {score}" : "{date}"}</code></p></details><button className="admin-button" type="submit">儲存</button></form>; })}</section></>;
}
