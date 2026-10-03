import { redirect } from "next/navigation";
import {
  NOTIFICATION_EVENT_KEYS,
  createImportantDate,
  deleteImportantDate,
  updateImportantDate,
  upsertNotificationSetting,
  type NotificationEventKey,
} from "../../../../db/notification-store";
import { requireAdmin } from "../../../admin/auth";

const eventKeys: readonly NotificationEventKey[] = NOTIFICATION_EVENT_KEYS;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const form = await request.formData();
  const action = clean(form.get("action"), 40);

  if (action === "settings") {
    const eventKey = clean(form.get("event_key"), 40) as NotificationEventKey;
    if (!eventKeys.includes(eventKey)) return redirect("/admin/notifications?updated=notifications_invalid");
    const title = clean(form.get("title"), 80);
    const bodyTemplate = clean(form.get("body_template"), 1000);
    if (!title || !bodyTemplate) return redirect("/admin/notifications?updated=notifications_invalid");
    await upsertNotificationSetting({
      eventKey,
      enabled: form.get("enabled") === "on",
      title,
      bodyTemplate,
      updatedBy: admin.user.lineUserId,
    });
    return redirect("/admin/notifications?updated=notifications");
  }

  if (action === "delete_date") {
    const id = clean(form.get("id"), 80);
    if (id) await deleteImportantDate(id);
    return redirect("/admin/notifications?updated=important_date");
  }

  if (action === "create_date" || action === "update_date") {
    const id = clean(form.get("id"), 80) || crypto.randomUUID();
    const title = clean(form.get("title"), 100);
    const description = clean(form.get("description"), 1000);
    const eventDate = clean(form.get("event_date"), 10);
    const sendAtInput = clean(form.get("send_at"), 30);
    const academicYear = clean(form.get("academic_year"), 4) || "116";
    const district = clean(form.get("district"), 40) || "all";
    const status = clean(form.get("status"), 30) as "confirmed" | "pending" | "previous_year_reference" | "provisional";
    const sourceUrl = clean(form.get("source_url"), 500);
    const sourcePages = clean(form.get("source_pages"), 40);
    const verifiedAt = clean(form.get("verified_at"), 30);
    if (!title || !isDate(eventDate)) return redirect("/admin/notifications?updated=important_date_invalid");
    const sendAt = parseTaipeiDateTime(sendAtInput, eventDate);
    if (!sendAt) return redirect("/admin/notifications?updated=important_date_invalid");
    if (!/^[0-9]{3,4}$/.test(academicYear) || !["confirmed", "pending", "previous_year_reference", "provisional"].includes(status || "pending") || !isSafeHttpUrl(sourceUrl) || (verifiedAt && !isDate(verifiedAt))) return redirect("/admin/notifications?updated=important_date_invalid");
    const input = { id, title, description, eventDate, sendAt, enabled: form.get("enabled") === "on", updatedBy: admin.user.lineUserId, academicYear, district, status: status || "pending", sourceUrl, sourcePages, verifiedAt };
    if (action === "create_date") await createImportantDate(input);
    else await updateImportantDate(input);
    return redirect("/admin/notifications?updated=important_date");
  }

  return redirect("/admin/notifications?updated=notifications_invalid");
}

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isSafeHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseTaipeiDateTime(value: string, eventDate: string) {
  const local = value || `${eventDate}T09:00`;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const date = new Date(`${local}:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
