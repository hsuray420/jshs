const OSRM = "https://router.project-osrm.org/route/v1";
const WINDOW_MS = 60_000;
const LIMIT = 30;
const counters = new Map<string, { count: number; resetAt: number }>();

/** Uses a public routing provider without retaining the visitor's location. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const values = ["fromLat", "fromLon", "toLat", "toLon"].map((key) => Number(url.searchParams.get(key)));
  if (values.some((value) => !Number.isFinite(value) || Math.abs(value) > 180)) return Response.json({ ok: false, error: "invalid_coordinate" }, { status: 400 });
  const key = (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous").split(",")[0].trim();
  const now = Date.now();
  const counter = counters.get(key);
  if (counter && counter.resetAt > now && counter.count >= LIMIT) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  counters.set(key, { count: counter?.resetAt && counter.resetAt > now ? counter.count + 1 : 1, resetAt: counter?.resetAt && counter.resetAt > now ? counter.resetAt : now + WINDOW_MS });
  const [fromLat, fromLon, toLat, toLon] = values;
  const mode = ["driving", "walking", "cycling"].includes(url.searchParams.get("mode") || "") ? url.searchParams.get("mode") : "driving";
  const upstream = await fetch(`${OSRM}/${mode}/${fromLon},${fromLat};${toLon},${toLat}?overview=false`, { headers: { accept: "application/json" } }).catch(() => null);
  if (!upstream?.ok) return Response.json({ ok: false, error: "routing_unavailable" }, { status: 503 });
  const payload = await upstream.json().catch(() => null) as { routes?: Array<{ distance?: number; duration?: number }> } | null;
  const route = payload?.routes?.[0];
  const distance = route?.distance;
  const duration = route?.duration;
  if (typeof distance !== "number" || typeof duration !== "number" || !Number.isFinite(distance) || !Number.isFinite(duration)) return Response.json({ ok: false, error: "route_not_found" }, { status: 404 });
  return Response.json({ ok: true, distanceKm: Number((distance / 1000).toFixed(1)), minutes: Math.max(1, Math.round(duration / 60)) }, { headers: { "cache-control": "private, max-age=300" } });
}
