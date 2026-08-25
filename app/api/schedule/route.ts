import { listImportantDates } from "../../../db/notification-store";
import { listPublishedContent, parseContentBody } from "../../../db/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [dates, taskEntries] = await Promise.all([listImportantDates(), listPublishedContent("schedule_task")]);
  return Response.json({
    ok: true,
    dates: dates.map(({ id, title, description, event_date, send_at }) => ({
      id,
      title,
      description,
      eventDate: event_date,
      sendAt: send_at,
    })),
    tasks: taskEntries.map((entry) => ({
      id: entry.slug,
      title: entry.title,
      detail: parseContentBody(entry, { detail: entry.summary }).detail,
    })),
  }, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
