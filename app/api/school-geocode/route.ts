const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const APPLICATION_USER_AGENT = "jshs.cc school map/1.0 (https://jshs.cc)";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 240) || "";
  if (query.length < 3) return Response.json({ ok: false, error: "query_too_short" }, { status: 400 });

  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "tw");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "accept-language": "zh-TW",
      referer: "https://jshs.cc/schools?view=map",
      "user-agent": APPLICATION_USER_AGENT,
    },
  }).catch(() => null);
  if (!response?.ok) return Response.json({ ok: false, error: "geocoder_unavailable" }, { status: 503 });
  const results = await response.json().catch(() => null) as Array<{ lat?: string; lon?: string; display_name?: string }> | null;
  const lat = Number(results?.[0]?.lat);
  const lon = Number(results?.[0]?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Response.json({ ok: true, coordinate: null }, { headers: { "cache-control": "public, max-age=300" } });
  return Response.json({ ok: true, coordinate: { lat, lon, label: results?.[0]?.display_name || query } }, { headers: { "cache-control": "public, max-age=86400" } });
}
