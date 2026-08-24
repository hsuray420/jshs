import { schoolDirectory } from "../../../lib/school-directory";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const OVERPASS_ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
] as const;
const APPLICATION_USER_AGENT = "jshs.cc school map/1.0 (https://jshs.cc)";
const DISTRICT_CACHE_TTL = 6 * 60 * 60 * 1000;

const districtBBoxes: Readonly<Record<string, readonly [number, number, number, number]>> = {
  tp: [24.75, 120.75, 25.35, 122.05],
  ct: [23.85, 120.15, 24.6, 121.4],
  ilan: [24.4, 121.55, 25.1, 122.05],
  "taoyuan-lienchiang": [24.65, 120.95, 25.2, 121.5],
  "hsinchu-miaoli": [24.25, 120.55, 24.95, 121.35],
  changhua: [23.75, 120.15, 24.25, 120.8],
  yunlin: [23.45, 119.95, 23.9, 120.65],
  chiayi: [23.15, 120.1, 23.7, 120.75],
  tainan: [22.75, 120.0, 23.5, 120.6],
  kaohsiung: [22.35, 120.0, 23.6, 121.0],
  pingtung: [21.85, 120.4, 22.8, 120.95],
  hualien: [23.5, 120.9, 24.5, 121.8],
  taitung: [21.8, 120.7, 23.5, 121.5],
  penghu: [23.1, 119.2, 23.8, 119.8],
  kinmen: [24.35, 118.1, 24.55, 118.5],
};

export const dynamic = "force-dynamic";

type DistrictCoordinates = Readonly<{ coordinates: Readonly<Record<string, { lat: number; lon: number }>>; matched: number; total: number }>;
const districtCache = new Map<string, Readonly<{ expiresAt: number; value: DistrictCoordinates }>>();
const districtRequests = new Map<string, Promise<DistrictCoordinates | null>>();

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const district = params.get("district")?.trim() || "";
  if (district) return loadDistrictCoordinates(district);
  const query = params.get("q")?.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 240) || "";
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

async function loadDistrictCoordinates(district: string) {
  const bbox = districtBBoxes[district];
  if (!bbox) return Response.json({ ok: false, error: "district_not_found" }, { status: 400 });
  const cached = districtCache.get(district);
  if (cached && cached.expiresAt > Date.now()) return districtResponse(cached.value, "memory");
  const [south, west, north, east] = bbox;
  const query = `[out:json][timeout:25];nwr["amenity"="school"](${south},${west},${north},${east});out center tags;`;
  const request = districtRequests.get(district) || loadDistrictCoordinatesFromOverpass(district, query);
  districtRequests.set(district, request);
  let value: DistrictCoordinates | null;
  try { value = await request; } finally { districtRequests.delete(district); }
  if (!value) return Response.json({ ok: false, error: "school_locations_unavailable" }, { status: 503 });
  districtCache.set(district, { expiresAt: Date.now() + DISTRICT_CACHE_TTL, value });
  return districtResponse(value, "origin");
}

async function loadDistrictCoordinatesFromOverpass(district: string, query: string): Promise<DistrictCoordinates | null> {
  let response: Response | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "text/plain", "user-agent": APPLICATION_USER_AGENT },
      body: query,
    }).catch(() => null);
    if (response?.ok) break;
  }
  if (!response?.ok) return null;
  const payload = await response.json().catch(() => null) as { elements?: readonly OverpassElement[] } | null;
  const schools = schoolDirectory.filter((school) => school.districtCode === district);
  const byName = new Map<string, typeof schools[number]>();
  for (const school of schools) for (const alias of schoolAliases(school.name)) if (!byName.has(alias)) byName.set(alias, school);
  const coordinates: Record<string, { lat: number; lon: number }> = {};
  for (const element of payload?.elements || []) {
    const name = normalizeSchoolName(element.tags?.["name:zh"] || element.tags?.name || "");
    const address = normalizeAddress(`${element.tags?.["addr:street"] || ""}${element.tags?.["addr:housenumber"] || ""}`);
    const school = byName.get(name)
      || schools.find((candidate) => [...schoolAliases(candidate.name)].some((alias) => fuzzySchoolMatch(name, alias)))
      || (address.length >= 4 ? schools.find((candidate) => normalizeAddress(candidate.address).includes(address)) : undefined);
    const lat = Number(element.lat ?? element.center?.lat);
    const lon = Number(element.lon ?? element.center?.lon);
    if (school && Number.isFinite(lat) && Number.isFinite(lon)) coordinates[`${district}:${school.code}`] = { lat, lon };
  }
  return { coordinates, matched: Object.keys(coordinates).length, total: schools.length };
}

function districtResponse(value: DistrictCoordinates, source: "memory" | "origin") {
  return Response.json({ ok: true, ...value }, { headers: { "cache-control": "public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400", "x-jshs-coordinate-source": source } });
}

type OverpassElement = Readonly<{ lat?: number; lon?: number; center?: { lat?: number; lon?: number }; tags?: Readonly<Record<string, string>> }>;

function normalizeSchoolName(value: string) {
  const digitMap: Readonly<Record<string, string>> = { 一: "一", 二: "二", 三: "三", 四: "四", 五: "五", 六: "六", 七: "七", 八: "八", 九: "九", 十: "十" };
  return value.replace(/臺/g, "台").replace(/立/g, "立").replace(/[（(].*?[）)]/g, "").replace(/市立|縣立|國立|私立|財團法人|學校法人/g, "").replace(/高級工業職業學校|高級工業高級中等學校/g, "高工").replace(/高級商業職業學校/g, "高商").replace(/高級商工職業學校/g, "高商工").replace(/高級農業職業學校/g, "農校").replace(/高級農工職業學校/g, "農工").replace(/高級家事商業職業學校/g, "家商").replace(/高級中等學校|高級中學/g, "高中").replace(/高職/g, "高中").replace(/高中/g, "").replace(/[\s．·・　]/g, "").replace(/第(一|二|三|四|五|六|七|八|九|十)/g, (_, digit: string) => digitMap[digit] || digit).toLocaleLowerCase("zh-TW");
}

function schoolAliases(value: string) {
  const base = normalizeSchoolName(value);
  const aliases = new Set([base, base.replace(/工業/g, "高工"), base.replace(/商業/g, "高商"), base.replace(/家事商業/g, "家商"), base.replace(/農業工業/g, "農工")]);
  if (base && !base.endsWith("中")) aliases.add(`${base}中`);
  return aliases;
}

function fuzzySchoolMatch(left: string, right: string) {
  return left.length >= 4 && right.length >= 4 && (left.includes(right) || right.includes(left));
}

function normalizeAddress(value: string) {
  return value.replace(/臺/g, "台").replace(/號/g, "").replace(/之/g, "-").replace(/[\s,，、．·・　]/g, "").toLocaleLowerCase("zh-TW");
}
