import { listImportantDates } from "../../../db/notification-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const dates = await listImportantDates();
  return Response.json({
    ok: true,
    dates: dates.map(({ id, title, description, event_date, send_at }) => ({
      id,
      title,
      description,
      eventDate: event_date,
      sendAt: send_at,
    })),
  }, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
