import { getAlertLineUserIds, hasLineMessagingConfigured, pushLineText } from "./line";
import {
  getNotificationSetting,
  isMemberNotificationEnabled,
  listDueImportantDates,
  listOptedInLineUserIds,
  listWeeklyReportLineUserIds,
  markImportantDateSent,
  MAX_TEMPLATE_LENGTH,
} from "../db/notification-store";

export const MAX_BODY_LENGTH = 4000;
export { MAX_TEMPLATE_LENGTH };
type MemberNotificationEventKey = "planner_finalized" | "score_calculated";

type TemplateValues = Record<string, string | number | undefined>;

export function renderNotificationTemplate(template: string, values: TemplateValues) {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (placeholder, key) => {
    const value = values[key];
    return value === undefined ? placeholder : String(value);
  }).slice(0, MAX_BODY_LENGTH);
}

export async function notifyMember(input: {
  eventKey: MemberNotificationEventKey;
  lineUserId: string;
  values: TemplateValues;
  referenceId?: string;
}) {
  try {
    if (!(await isMemberNotificationEnabled(input.lineUserId, input.eventKey))) {
      return { ok: false, skipped: true, reason: "member_not_opted_in", sent: 0 } as const;
    }
    const setting = await getNotificationSetting(input.eventKey);
    if (!setting?.enabled) return { ok: false, skipped: true, reason: "admin_disabled", sent: 0 } as const;
    return deliverLineText(input.lineUserId, setting.title, renderNotificationTemplate(setting.body_template.slice(0, MAX_TEMPLATE_LENGTH), input.values));
  } catch {
    return { ok: false, skipped: true, reason: "notification_unavailable", sent: 0 } as const;
  }
}

export async function dispatchDueImportantDateNotifications() {
  const dates = await listDueImportantDates();
  let sent = 0;
  let skipped = 0;
  for (const importantDate of dates) {
    const setting = await getNotificationSetting("important_date");
    if (!setting?.enabled) {
      skipped += 1;
      continue;
    }
    const recipients = await listOptedInLineUserIds("important_date");
    if (!recipients.length) {
      await markImportantDateSent(importantDate.id);
      skipped += 1;
      continue;
    }
    let dateSent = 0;
    for (const lineUserId of recipients) {
      const result = await deliverLineText(
        lineUserId,
        setting.title,
        renderNotificationTemplate(setting.body_template.slice(0, MAX_TEMPLATE_LENGTH), {
          title: importantDate.title,
          description: importantDate.description,
          eventDate: importantDate.event_date,
        }),
      );
      if (result.ok) {
        dateSent += 1;
        sent += 1;
      } else {
        skipped += 1;
      }
    }
    if (dateSent === recipients.length) await markImportantDateSent(importantDate.id);
  }
  return { ok: true, processed: dates.length, sent, skipped };
}

export async function dispatchWeeklyReportNotifications() {
  const recipients = await listWeeklyReportLineUserIds();
  if (!recipients.length) return { ok: true, sent: 0, skipped: 0 };
  let sent = 0;
  for (const lineUserId of recipients) {
    const result = await deliverLineText(lineUserId, "JSHS LINE 每週摘要", "本週升學摘要已整理完成。請回到 JSHS 查看你的成績試算、志願規劃與重要日期；正式規則仍以官方公告為準。");
    if (result.ok) sent += 1;
  }
  return { ok: true, sent, skipped: recipients.length - sent };
}

export async function notifyLineAdminsForTest(text: string, fallbackUserId?: string) {
  const targets = getAlertLineUserIds(fallbackUserId);
  if (!targets.length || !hasLineMessagingConfigured()) return { ok: false, skipped: true, sent: 0 } as const;
  let sent = 0;
  for (const lineUserId of targets) {
    const result = await deliverLineText(lineUserId, "LINE 通知測試", text);
    if (result.ok) sent += 1;
  }
  return { ok: sent > 0, sent } as const;
}

async function deliverLineText(lineUserId: string, title: string, body: string) {
  if (!hasLineMessagingConfigured()) return { ok: false, skipped: true, reason: "line_push_not_configured", sent: 0 } as const;
  try {
    const result = await pushLineText(lineUserId, `${title}\n${body}`.slice(0, MAX_BODY_LENGTH));
    return result.ok ? { ok: true, sent: 1 } as const : { ok: false, skipped: true, reason: "line_push_skipped", sent: 0 } as const;
  } catch {
    return { ok: false, skipped: false, reason: "line_push_failed", sent: 0 } as const;
  }
}
