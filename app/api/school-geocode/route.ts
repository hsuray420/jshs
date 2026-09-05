import { getSchools } from "@/lib/school-repository";
import { getSchoolCoordinate } from "@/lib/school-geocode";

/** School coordinates are pre-verified against the authoritative entity address. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const district = params.get('district')?.trim() || '';
  const code = params.get('code')?.trim() || '';
  if (params.has('q')) return Response.json({ ok: false, error: 'live_geocoding_unavailable', message: '請使用 Google 地圖路線試算。' }, { status: 422 });
  const schools = getSchools().filter(s => (!district || s.admissionDistricts.includes(district)) && (!code || s.code === code));
  if ((district || code) && !schools.length) return Response.json({ ok: false, error: 'school_or_district_not_found' }, { status: 404 });
  const coordinates = Object.fromEntries(schools.flatMap(s => {
    const coordinate = getSchoolCoordinate(s.code, s.address);
    return coordinate ? [[s.code, coordinate]] : [];
  }));
  return Response.json({ ok: true, coordinates, matched: Object.keys(coordinates).length, total: schools.length }, { headers: { 'cache-control': 'public, max-age=3600' } });
}
