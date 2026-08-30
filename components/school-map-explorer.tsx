"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";

type MapRecord = Readonly<{ districtCode: string; districtLabel: string; code: string; name: string; city: string; area: string; address: string }>;
type Payload = Readonly<{ schools: readonly MapRecord[] }>;
type Coordinate = Readonly<{ lat: number; lon: number }>;
type CoordinateCache = Readonly<Record<string, Coordinate>>;
type LeafletModule = typeof import("leaflet");
type TravelMode = "scooter" | "car" | "walk";
type DistrictCacheRecord = Readonly<{ coordinates: CoordinateCache; matched: number; total: number; savedAt: number }>;
type RouteResult = Readonly<{ distanceKm: number; minutes: number }>;

const COORDINATE_CACHE_KEY = "jshs:school-coordinates:v1";
const DISTRICT_CACHE_KEY = "jshs:school-district-coordinates:v1";
const travelModes: Readonly<Record<TravelMode, Readonly<{ label: string; speed: number; roadFactor: number }>>> = {
  scooter: { label: "機車估算", speed: 28, roadFactor: 1.25 },
  car: { label: "汽車估算", speed: 30, roadFactor: 1.3 },
  walk: { label: "步行估算", speed: 5, roadFactor: 1.1 },
};

export function SchoolMapExplorer({ districtOptions, initialDistrict = "" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const coordinateCache = useRef<CoordinateCache>(readCoordinateCache());
  const [schools, setSchools] = useState<readonly MapRecord[]>([]);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "");
  const [city, setCity] = useState("all");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeCoordinate, setHomeCoordinate] = useState<Coordinate | null>(null);
  const [homeStatus, setHomeStatus] = useState("");
  const [routeResults, setRouteResults] = useState<Readonly<Record<string, RouteResult>>>({});
  const [selectedSchools, setSelectedSchools] = useState<readonly string[]>([]);
  const [travelMode, setTravelMode] = useState<TravelMode>("scooter");
  const [coordinates, setCoordinates] = useState<CoordinateCache>(() => readCoordinateCache());
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [districtLocating, setDistrictLocating] = useState(false);
  const [districtStatus, setDistrictStatus] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const leaflet = useRef<LeafletModule | null>(null);
  const markers = useRef<Leaflet.LayerGroup | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("school_directory"); return response.json() as Promise<Payload>; })
      .then((payload) => { if (active) setSchools(Array.isArray(payload.schools) ? payload.schools : []); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!mapElement.current || map.current) return () => { active = false; };
    import("leaflet").then((module) => {
      if (!active || !mapElement.current) return;
      const L = module;
      leaflet.current = module;
      const mapInstance = L.map(mapElement.current, { scrollWheelZoom: true, zoomControl: true }).setView([23.7, 120.9], 7);
      map.current = mapInstance;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(mapInstance);
      markers.current = L.layerGroup().addTo(mapInstance);
      setMapReady(true);
      window.requestAnimationFrame(() => {
        if (active) mapInstance.invalidateSize({ pan: false });
      });
    });
    return () => {
      active = false;
      map.current?.remove();
      map.current = null;
      markers.current = null;
      setMapReady(false);
    };
  }, []);

  const cities = useMemo(() => [...new Set(schools.filter((school) => district && school.districtCode === district).map((school) => school.city).filter(Boolean))].sort((left, right) => left.localeCompare(right, "zh-TW")), [district, schools]);
  const filtered = useMemo(() => {
    const needle = normalize(query);
    return schools.filter((school) => {
      const haystack = normalize(`${school.name} ${school.code} ${school.city} ${school.area} ${school.address}`);
      return Boolean(district) && (!needle || haystack.includes(needle)) && school.districtCode === district && (city === "all" || school.city === city);
    });
  }, [city, district, query, schools]);
  const locatedSchools = useMemo(() => filtered.filter((school) => coordinates[schoolKey(school)]), [coordinates, filtered]);
  const selectedSchoolRecords = useMemo(() => selectedSchools.map((key) => schools.find((school) => schoolKey(school) === key)).filter((school): school is MapRecord => Boolean(school)), [schools, selectedSchools]);
  const commuteRows = useMemo(() => selectedSchoolRecords.map((school) => {
    const coordinate = coordinates[schoolKey(school)];
    if (!coordinate || !homeCoordinate) return null;
    const distance = haversineKm(homeCoordinate, coordinate);
    const settings = travelModes[travelMode];
    const route = routeResults[schoolKey(school)];
    return { school, distance: route?.distanceKm ?? distance, minutes: route?.minutes ?? Math.max(1, Math.round(distance * settings.roadFactor / settings.speed * 60)) };
  }).filter((row): row is { school: MapRecord; distance: number; minutes: number } => Boolean(row)).sort((left, right) => left.minutes - right.minutes), [coordinates, homeCoordinate, routeResults, selectedSchoolRecords, travelMode]);

  useEffect(() => {
    if (!homeCoordinate || !selectedSchoolRecords.length) return;
    let active = true;
    const mode = travelMode === "walk" ? "walking" : travelMode === "scooter" ? "cycling" : "driving";
    void Promise.all(selectedSchoolRecords.map(async (school) => {
      const coordinate = coordinates[schoolKey(school)];
      if (!coordinate) return null;
      const params = new URLSearchParams({ fromLat: String(homeCoordinate.lat), fromLon: String(homeCoordinate.lon), toLat: String(coordinate.lat), toLon: String(coordinate.lon), mode });
      const response = await fetch(`/api/commute?${params}`).catch(() => null);
      const payload = await response?.json().catch(() => null) as { ok?: boolean; distanceKm?: number; minutes?: number } | null;
      return payload?.ok && Number.isFinite(payload.distanceKm) && Number.isFinite(payload.minutes) ? [schoolKey(school), { distanceKm: payload.distanceKm!, minutes: payload.minutes! }] as const : null;
    })).then((results) => {
      if (active) setRouteResults(Object.fromEntries(results.filter((value): value is readonly [string, RouteResult] => Boolean(value))));
    });
    return () => { active = false; };
  }, [coordinates, homeCoordinate, selectedSchoolRecords, travelMode]);

  useEffect(() => {
    if (!mapReady || !map.current || !leaflet.current || !markers.current) return;
    const L = leaflet.current;
    markers.current.clearLayers();
    const points: Leaflet.LatLng[] = [];
    if (homeCoordinate) {
      const homeMarker = L.marker([homeCoordinate.lat, homeCoordinate.lon], { icon: L.divIcon({ className: "jshs-home-marker", html: "⌂", iconSize: [34, 34], iconAnchor: [17, 17] }) }).bindPopup("住家位置");
      homeMarker.addTo(markers.current);
      points.push(homeMarker.getLatLng());
    }
    locatedSchools.forEach((school) => {
      const coordinate = coordinates[schoolKey(school)];
      const marker = L.marker([coordinate.lat, coordinate.lon], { icon: L.divIcon({ className: "jshs-school-marker", html: `<span class="jshs-school-marker-pin" aria-hidden="true"></span><span class="jshs-school-marker-label">${escapeHtml(shortSchoolName(school.name))}</span>`, iconSize: [180, 42], iconAnchor: [12, 30], popupAnchor: [0, -30] }) }).bindPopup(`<strong>${escapeHtml(school.name)}</strong><br>${escapeHtml(school.address || "地址未提供")}<br><a href="/schools/${encodeURIComponent(school.districtCode)}/${encodeURIComponent(school.code)}">查看學校詳情</a>`);
      marker.addTo(markers.current as Leaflet.LayerGroup);
      points.push(marker.getLatLng());
    });
    if (points.length === 1) map.current.setView(points[0], 16);
    if (points.length > 1) map.current.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
  }, [coordinates, homeCoordinate, locatedSchools, mapReady]);

  const loadDistrictCoordinates = useCallback(async (targetDistrict: string) => {
    const cached = readDistrictCache()[targetDistrict];
    if (cached && Date.now() - cached.savedAt < 6 * 60 * 60 * 1000) {
      const next = { ...coordinateCache.current, ...cached.coordinates };
      coordinateCache.current = next;
      setCoordinates(next);
      setDistrictStatus(`已載入 ${cached.matched}／${cached.total} 所學校位置（本機快取）。`);
      return;
    }
    setDistrictLocating(true);
    setDistrictStatus("正在載入這個就學區的學校位置…");
    let response: Response | null = null;
    let payload: { coordinates?: CoordinateCache; matched?: number; total?: number } | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      response = await fetch(`/api/school-geocode?district=${encodeURIComponent(targetDistrict)}`, { headers: { accept: "application/json" } }).catch(() => null);
      payload = await response?.json().catch(() => null) as { coordinates?: CoordinateCache; matched?: number; total?: number } | null;
      if (response?.ok && payload?.coordinates) break;
      if (attempt === 0) await wait(900);
    }
    if (!response?.ok || !payload?.coordinates) { setDistrictStatus("學校位置暫時無法載入，請稍後再試。"); setDistrictLocating(false); return; }
    const next = { ...coordinateCache.current, ...payload.coordinates };
    coordinateCache.current = next;
    setCoordinates(next);
    writeCoordinateCache(next);
    writeDistrictCache(targetDistrict, { coordinates: payload.coordinates, matched: payload.matched || 0, total: payload.total || 0, savedAt: Date.now() });
    setDistrictStatus(`已載入 ${payload.matched || 0}／${payload.total || 0} 所學校位置。`);
    setDistrictLocating(false);
  }, []);

  useEffect(() => {
    if (!district) return;
    const timer = window.setTimeout(() => { void loadDistrictCoordinates(district); }, 0);
    return () => window.clearTimeout(timer);
  }, [district, loadDistrictCoordinates]);

  async function locateSchools(targets: readonly MapRecord[]) {
    if (locating || !targets.length) return;
    setLocating(true);
    let next = { ...coordinates };
    for (const school of targets) {
      const key = schoolKey(school);
      if (!school.address || next[key]) continue;
      const coordinate = await geocodeAddress(`${school.name}, ${school.address}`);
      if (coordinate) next = { ...next, [key]: coordinate };
      if (targets.length > 1) await wait(1100);
    }
    coordinateCache.current = next;
    setCoordinates(next);
    writeCoordinateCache(next);
    setLocating(false);
  }

  async function locateHome() {
    const address = homeAddress.trim();
    if (!address) { setHomeStatus("請先輸入住家地址或附近地標。"); return; }
    setHomeStatus("正在定位住家…");
    const coordinate = await geocodeAddress(address);
    if (!coordinate) { setHomeStatus("找不到這個位置，請補上縣市、區與路名。"); return; }
    setHomeCoordinate(coordinate);
    setHomeStatus("住家位置已定位；接著勾選一所以上學校比較通勤。");
  }

  function useCurrentPosition() {
    if (!navigator.geolocation) { setHomeStatus("這台裝置不支援定位，請改輸入住家地址或附近地標。"); return; }
    setHomeStatus("正在要求目前位置權限…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHomeCoordinate({ lat: position.coords.latitude, lon: position.coords.longitude });
        setHomeStatus("已取得目前位置；精確位置只保留在此頁面，不會自動保存。");
      },
      (error) => {
        const messages: Record<number, string> = { 1: "你已拒絕定位權限，請輸入住家地址或在瀏覽器設定中重新允許。", 2: "目前無法取得位置，請確認 GPS、網路或改輸入住家地址。", 3: "定位逾時，請重新定位或改輸入住家地址。" };
        setHomeStatus(messages[error.code] || "定位服務暫時無法使用，請改輸入住家地址。");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  function focusSchool(school: MapRecord) {
    const coordinate = coordinates[schoolKey(school)];
    if (coordinate && map.current) { map.current.setView([coordinate.lat, coordinate.lon], 17); return; }
    void locateSchools([school]);
  }

  function toggleSchool(school: MapRecord) {
    const key = schoolKey(school);
    setSelectedSchools((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">學校地圖 · OpenStreetMap</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">從住家出發，比較一所以上學校。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">選擇就學區、輸入住家位置，再勾選學校；地圖會顯示住家與學校，並用距離與平均速度估算通勤時間。不需要 Google 金鑰或付款方式。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12">
      <div className="grid gap-4 p-5 jshs-surface-card md:grid-cols-[1fr_220px_180px] md:p-7"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校、地址或代碼<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：中投區、臺中、060323" /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => { setDistrict(event.target.value); setCity("all"); setSelectedSchools([]); }}><option value="">請先選擇就學區</option>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">縣市<select value={city} onChange={(event) => setCity(event.target.value)} disabled={!district}><option value="all">全部縣市</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]"><div className="p-5 jshs-surface-card"><p className="jshs-eyebrow">住家位置</p><label className="mt-2 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">輸入住家地址或附近地標<input value={homeAddress} onChange={(event) => setHomeAddress(event.target.value)} placeholder="例如：臺中市西屯區市政路" /></label><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="px-4 py-2 text-sm jshs-button-primary" onClick={useCurrentPosition}>使用目前位置</button><button type="button" className="px-4 py-2 text-sm jshs-button-secondary" onClick={() => void locateHome()}>用地址定位</button></div>{homeStatus ? <p className="mt-3 text-sm leading-6 text-[var(--jshs-primary)]" role="status">{homeStatus}</p> : null}</div><div className="p-5 jshs-surface-card"><p className="jshs-eyebrow">學校位置</p><div className="flex flex-wrap items-center gap-3"><span className="jshs-chip">{loading ? "載入中…" : district ? `符合 ${filtered.length} 所` : "請先選擇就學區"}</span><span className="jshs-chip">{loading ? "位置載入中…" : `已定位 ${locatedSchools.length} 所`}</span><button type="button" className="px-4 py-2 text-sm jshs-button-primary" onClick={() => void loadDistrictCoordinates(district)} disabled={districtLocating || loading || !district}>{districtLocating ? "載入中…" : "重新載入此區位置"}</button></div>{(districtStatus || !district) ? <p className="mt-3 text-sm leading-6 text-[var(--jshs-primary)]" role="status">{districtStatus || "請先選擇就學區，地圖會載入該區學校位置。"}</p> : null}<p className="mt-3 text-xs leading-5 text-slate-500">選區後會一次載入學校位置，不再逐校等待；結果會暫存於本瀏覽器。</p></div></div>
      <div className="mt-6 overflow-hidden rounded-3xl jshs-surface-card"><div ref={mapElement} className="h-[440px] w-full bg-[var(--jshs-muted-surface)] md:h-[560px]" aria-label="OpenStreetMap 學校互動地圖" /><p className="border-t border-[var(--jshs-border)] px-5 py-3 text-xs leading-5 text-slate-500">© OpenStreetMap contributors。地址定位由 OpenStreetMap Nominatim 提供；請勿將地圖座標視為官方校址證明。</p></div>
      <div className="mt-7 grid gap-4 p-5 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">通勤比較</p><h2 className="mt-2 text-2xl font-black">勾選一所以上學校</h2></div><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">交通方式<select value={travelMode} onChange={(event) => setTravelMode(event.target.value as TravelMode)}>{Object.entries(travelModes).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label></div><p className="text-sm leading-6 jshs-muted-copy">已選 {selectedSchoolRecords.length} 所；請先定位住家與選取學校，系統會以距離、道路係數與平均速度估算通勤時間。</p>{commuteRows.length ? <div className="grid gap-3 md:grid-cols-2">{commuteRows.map((row) => <article key={schoolKey(row.school)} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{row.school.name}</h3><p className="text-xs text-slate-500">{row.school.city} {row.school.area}</p></div><strong className="text-[var(--jshs-primary)]">約 {row.minutes} 分鐘</strong></div><p className="mt-3 text-sm text-slate-700">住家到學校直線約 {row.distance.toFixed(1)} 公里</p></article>)}</div> : <p className="rounded-2xl border border-dashed border-[var(--jshs-border)] p-5 text-sm leading-6 jshs-muted-copy">尚未產生比較結果。請在下方勾選學校，並定位住家與學校。</p>}<p className="text-xs leading-6 text-slate-500">通勤時間是估算值，不是即時導航；未包含紅綠燈、塞車、轉乘與天候。正式出發前請用實際導航再次確認。</p></div>
      {!loading && !loadError ? <div className="mt-7 grid gap-4 md:grid-cols-2">{filtered.slice(0, 100).map((school) => <article key={schoolKey(school)} className="p-5 jshs-surface-card"><label className="flex items-start gap-3"><input type="checkbox" checked={selectedSchools.includes(schoolKey(school))} onChange={() => toggleSchool(school)} /><span><p className="text-xs font-black tracking-[.12em] text-[var(--jshs-primary)]">{school.districtLabel} · {school.code}</p><h2 className="mt-2 text-xl font-black">{school.name}</h2></span></label><p className="mt-3 text-sm leading-6 jshs-muted-copy">{[school.city, school.area].filter(Boolean).join(" · ") || "縣市／區未標示"}</p><p className="mt-2 text-sm leading-6 text-slate-700">{school.address || "CSV 尚未提供地址"}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="text-sm font-black text-[var(--jshs-primary)]" onClick={() => focusSchool(school)}>在地圖聚焦 ↗</button><Link className="text-sm font-black text-[var(--jshs-primary)]" href={`/schools/${school.districtCode}/${school.code}`}>查看學校詳情 →</Link></div></article>)}</div> : null}
      {loading ? <div className="mt-6 p-8 text-center jshs-surface-card">正在載入學校位置資料…</div> : null}{loadError ? <div className="mt-6 p-8 text-center jshs-surface-card">學校位置資料暫時無法載入，請稍後再試。</div> : null}
    </section>
  </>;
}

async function geocodeAddress(address: string): Promise<Coordinate | null> {
  const url = `/api/school-geocode?q=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { accept: "application/json" } }).catch(() => null);
  if (!response?.ok) return null;
  const payload = await response.json().catch(() => null) as { coordinate?: { lat?: number; lon?: number } | null } | null;
  const lat = Number(payload?.coordinate?.lat);
  const lon = Number(payload?.coordinate?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function schoolKey(school: MapRecord) {
  return `${school.districtCode}:${school.code}`;
}

function shortSchoolName(name: string) {
  const withoutOrganization = name.includes("財團法人") ? name.split("財團法人").pop() || name : name;
  const compact = withoutOrganization
    .replace(/^(國立|省立)/, "")
    .replace(/^[\u4e00-\u9fff]{1,4}(?:縣|市)(?:私[立立]|立)?/, "")
    .replace(/(?:高級家事商業職業學校|高級海事水產職業學校|高級工業職業學校|高級農業職業學校|高級商業職業學校|高級中等學校|高級職業學校|高級中學|進修部)$/, "")
    .trim();
  const characters = Array.from(compact || name);
  return characters.length > 7 ? `${characters.slice(0, 6).join("")}…` : characters.join("");
}

function haversineKm(left: Coordinate, right: Coordinate) {
  const radius = 6371;
  const latitude = (right.lat - left.lat) * Math.PI / 180;
  const longitude = (right.lon - left.lon) * Math.PI / 180;
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(left.lat * Math.PI / 180) * Math.cos(right.lat * Math.PI / 180) * Math.sin(longitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function readCoordinateCache(): CoordinateCache {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.sessionStorage.getItem(COORDINATE_CACHE_KEY) || "{}"); } catch { return {}; }
}

function writeCoordinateCache(cache: CoordinateCache) {
  try { window.sessionStorage.setItem(COORDINATE_CACHE_KEY, JSON.stringify(cache)); } catch { /* storage is optional */ }
}

function readDistrictCache(): Readonly<Record<string, DistrictCacheRecord>> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.sessionStorage.getItem(DISTRICT_CACHE_KEY) || "{}"); } catch { return {}; }
}

function writeDistrictCache(district: string, value: DistrictCacheRecord) {
  try { window.sessionStorage.setItem(DISTRICT_CACHE_KEY, JSON.stringify({ ...readDistrictCache(), [district]: value })); } catch { /* storage is optional */ }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function normalize(value: string) {
  return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW");
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
