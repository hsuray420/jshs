"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { useSchoolSearchIndex } from "@/components/school-static-data";
import { getSchoolCoordinate } from "@/lib/school-geocode";
import { normalizeDistrict, readStoredDistrict, writeStoredDistrict } from "@/lib/district-context";
import { getAvailableSchoolDataRegions } from "@/lib/region-registry";
import { SCHOOL_MAP_ATTRIBUTION, SCHOOL_MAP_DEFAULT_CENTER, SCHOOL_MAP_DEFAULT_ZOOM, SCHOOL_MAP_MAX_ZOOM, SCHOOL_MAP_TILE_URL } from "@/lib/school-map-config";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";
import "@/components/school-discovery.css";

type LocatedSchool = Readonly<{ school: SchoolSearchIndexEntry; latitude: number; longitude: number }>;
type Bounds = Readonly<{ north: number; south: number; east: number; west: number }>;
const regions = getAvailableSchoolDataRegions();
const normalize = (value: string) => value.normalize("NFKC").replaceAll("台", "臺").replace(/\s+/g, "").toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
const inBounds = (point: LocatedSchool, bounds: Bounds) => point.latitude <= bounds.north && point.latitude >= bounds.south && point.longitude <= bounds.east && point.longitude >= bounds.west;

export function SchoolMapExplorer({ initialDistrict }: { initialDistrict?: string }) {
  const { schools, loading, error } = useSchoolSearchIndex();
  const [region, setRegion] = useState("ct");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [ownership, setOwnership] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [department, setDepartment] = useState("");
  const [activeSchoolCode, setActiveSchoolCode] = useState("");
  const [mapError, setMapError] = useState(false);
  const [mapMoved, setMapMoved] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<Bounds | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [mapRevision, setMapRevision] = useState(0);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);

  useEffect(() => {
    const restoreUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      setRegion(normalizeDistrict(params.get("region") || initialDistrict) || readStoredDistrict() || "ct");
      setQuery(params.get("q") || "");
      setCity(params.get("city") || "");
      setOwnership(params.get("ownership") || "");
      setSchoolType(params.get("type") || "");
      setDepartment(params.get("department") || "");
      setActiveSchoolCode(params.get("school") || "");
    };
    restoreUrlState();
    window.addEventListener("popstate", restoreUrlState);
    return () => window.removeEventListener("popstate", restoreUrlState);
  }, [initialDistrict]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("region", region);
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (ownership) params.set("ownership", ownership);
    if (schoolType) params.set("type", schoolType);
    if (department) params.set("department", department);
    if (activeSchoolCode) params.set("school", activeSchoolCode);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [region, query, city, ownership, schoolType, department, activeSchoolCode]);

  const regionName = regions.find((item) => item.id === region)?.name || "中投區";
  const scoped = useMemo(() => schools.filter((school) => school.admissionDistricts.some((district) => district.includes(regionName))), [schools, regionName]);
  const located = useMemo(() => scoped.flatMap((school) => {
    const coordinate = getSchoolCoordinate(school.code, school.address);
    return coordinate ? [{ school, latitude: coordinate.latitude, longitude: coordinate.longitude }] : [];
  }), [scoped]);
  const cities = useMemo(() => unique(scoped.map((school) => school.city)), [scoped]);
  const ownerships = useMemo(() => unique(scoped.map((school) => school.ownership)), [scoped]);
  const schoolTypes = useMemo(() => unique(scoped.flatMap((school) => school.schoolTypes)), [scoped]);
  const departments = useMemo(() => unique(scoped.flatMap((school) => school.departmentNames)), [scoped]);
  const mapSchoolPoints = useMemo(() => {
    const needle = normalize(query);
    return located.filter(({ school }) => (!needle || school.normalizedSearchText.includes(needle))
      && (!city || school.city === city)
      && (!ownership || school.ownership === ownership)
      && (!schoolType || school.schoolTypes.includes(schoolType))
      && (!department || school.departmentNames.includes(department)))
      .filter((point) => !viewportBounds || inBounds(point, viewportBounds));
  }, [located, query, city, ownership, schoolType, department, viewportBounds]);

  const changeRegion = (next: string) => {
    writeStoredDistrict(next);
    setRegion(next);
    setCity(""); setDepartment(""); setViewportBounds(null); setActiveSchoolCode("");
  };
  const selectSchool = useCallback((code: string) => {
    setActiveSchoolCode(code);
    setSheetExpanded(true);
    const point = mapSchoolPoints.find((item) => item.school.code === code);
    if (point) mapInstance.current?.flyTo([point.latitude, point.longitude], Math.max(mapInstance.current.getZoom(), 14));
  }, [mapSchoolPoints]);
  const showWholeRegion = useCallback(() => {
    setQuery(""); setCity(""); setOwnership(""); setSchoolType(""); setDepartment("");
    setActiveSchoolCode(""); setViewportBounds(null); setSheetExpanded(false);
    if (located.length) mapInstance.current?.fitBounds(located.map((point) => [point.latitude, point.longitude]), { padding: [34, 34], maxZoom: 13 });
  }, [located]);

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !mapElement.current) return;
      const map = L.map(mapElement.current, { zoomControl: true, keyboard: true }).setView([...SCHOOL_MAP_DEFAULT_CENTER], SCHOOL_MAP_DEFAULT_ZOOM);
      L.tileLayer(SCHOOL_MAP_TILE_URL, { attribution: SCHOOL_MAP_ATTRIBUTION, maxZoom: SCHOOL_MAP_MAX_ZOOM }).addTo(map);
      markerLayer.current = L.layerGroup().addTo(map);
      map.on("moveend", () => setMapMoved(true));
      map.on("zoomend", () => setMapRevision((current) => current + 1));
      mapInstance.current = map;
      setMapRevision((current) => current + 1);
    }).catch(() => { if (!disposed) setMapError(true); });
    return () => { disposed = true; markerLayer.current = null; mapInstance.current?.remove(); mapInstance.current = null; };
  }, [loading]);

  useEffect(() => {
    const map = mapInstance.current;
    const layer = markerLayer.current;
    if (!map || !layer) return;
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed) return;
      layer.clearLayers();
      const clusters = new Map<string, LocatedSchool[]>();
      for (const point of mapSchoolPoints) {
        const pixel = map.latLngToContainerPoint([point.latitude, point.longitude]);
        const key = `${Math.floor(pixel.x / 64)}:${Math.floor(pixel.y / 64)}`;
        clusters.set(key, [...(clusters.get(key) || []), point]);
      }
      for (const group of clusters.values()) {
        if (group.length > 1 && map.getZoom() < 15) {
          const latitude = group.reduce((sum, item) => sum + item.latitude, 0) / group.length;
          const longitude = group.reduce((sum, item) => sum + item.longitude, 0) / group.length;
          const icon = L.divIcon({ className: "sm-cluster", html: `<span aria-label="${group.length} 所學校">${group.length}</span>`, iconSize: [42, 42] });
          L.marker([latitude, longitude], { icon, keyboard: true, title: `${group.length} 所學校` }).addTo(layer).on("click", () => map.fitBounds(L.latLngBounds(group.map((item) => [item.latitude, item.longitude])), { padding: [40, 40], maxZoom: 16 }));
        } else {
          for (const point of group) {
            const icon = L.divIcon({ className: `sm-marker${point.school.code === activeSchoolCode ? " is-active" : ""}`, html: "<span></span>", iconSize: [30, 38], iconAnchor: [15, 36] });
            L.marker([point.latitude, point.longitude], { icon, keyboard: true, title: point.school.name, alt: point.school.name }).addTo(layer).on("click", () => selectSchool(point.school.code));
          }
        }
      }
      if (mapSchoolPoints.length && !viewportBounds && mapRevision <= 2) map.fitBounds(L.latLngBounds(mapSchoolPoints.map((point) => [point.latitude, point.longitude])), { padding: [34, 34], maxZoom: 13 });
    }).catch(() => setMapError(true));
    return () => { disposed = true; };
  }, [mapSchoolPoints, activeSchoolCode, selectSchool, viewportBounds, mapRevision]);

  const searchViewport = () => {
    const bounds = mapInstance.current?.getBounds();
    if (!bounds) return;
    setViewportBounds({ north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() });
    setMapMoved(false);
  };
  const active = mapSchoolPoints.find((item) => item.school.code === activeSchoolCode)?.school;
  const coordinateCoverage = `${located.length}／${scoped.length}`;

  if (loading) return <section className="sd-state" aria-live="polite">正在載入學校地圖資料…</section>;
  if (error) return <section className="sd-state" role="status"><h1>學校地圖資料暫時無法載入</h1><p>{error}</p></section>;

  return <div className="sd-root sm-root">
    <header className="sm-toolbar sd-container"><div className="sm-toolbar-copy"><p className="sm-eyebrow">學校地圖</p><h1>先在地圖上找到學校</h1><p>{regionName}已核對座標 {coordinateCoverage} 所；未有可驗證座標的學校不會被錯誤標在地圖上。</p>{!located.length ? <p className="mt-3 rounded-xl border border-dashed p-3 text-sm" role="status">目前就學區沒有可定位的學校。請切換到有資料的區域，或先使用學校查詢。</p> : null}</div>
      <div className="sm-search-grid"><label>查看區域<select value={region} onChange={(event) => changeRegion(event.target.value)} aria-label="選擇要查看的就學區">{regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>選擇要在地圖定位的學校<select value={activeSchoolCode} onChange={(event) => event.target.value ? selectSchool(event.target.value) : showWholeRegion()}><option value="">顯示整個{regionName}</option>{located.map(({ school }) => <option key={school.code} value={school.code}>{school.name}</option>)}</select></label><label>搜尋<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="學校、縣市、行政區或科別" /></label><label>縣市<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">全部</option>{cities.map((value) => <option key={value}>{value}</option>)}</select></label><label>公私立<select value={ownership} onChange={(event) => setOwnership(event.target.value)}><option value="">全部</option>{ownerships.map((value) => <option key={value}>{value}</option>)}</select></label><label>學制<select value={schoolType} onChange={(event) => setSchoolType(event.target.value)}><option value="">全部</option>{schoolTypes.map((value) => <option key={value}>{value}</option>)}</select></label><label>科別<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">全部</option>{departments.map((value) => <option key={value}>{value}</option>)}</select></label></div>
    </header>
    <section className="sm-layout" aria-label="學校地圖探索器">
      <aside className={`sm-list${sheetExpanded ? " is-expanded" : ""}`}><div className="sm-list-head"><div><strong>{mapSchoolPoints.length} 所學校</strong><span>{regionName}</span></div><button type="button" className="sm-sheet-toggle" aria-expanded={sheetExpanded} onClick={() => setSheetExpanded((value) => !value)}>{sheetExpanded ? "收合清單" : "展開清單"}</button></div>
        <div className="sm-list-scroll">{mapSchoolPoints.map(({ school }) => <article className={school.code === activeSchoolCode ? "is-active" : ""} key={school.code}><button type="button" onClick={() => selectSchool(school.code)}><strong>{school.name}</strong><span>{school.ownership} · {school.schoolType}</span><span>{school.city}{school.area ? ` · ${school.area}` : ""}</span></button></article>)}</div>
      </aside>
      <div className="sm-map-wrap">{!mapError ? <div ref={mapElement} className="sm-map" aria-label={`${regionName}學校位置地圖`} /> : <div className="sm-map-fallback" role="status"><h2>地圖暫時無法載入</h2><p>仍可使用學校清單與詳情頁；重新整理後可再次嘗試。</p></div>}{mapMoved ? <button className="sm-search-area" type="button" onClick={searchViewport}>搜尋此區域</button> : null}{viewportBounds ? <button className="sm-reset-area" type="button" onClick={showWholeRegion}>顯示整個{regionName}</button> : null}
        {active ? <aside className="sm-preview" aria-live="polite"><button type="button" aria-label="關閉學校預覽" onClick={() => setActiveSchoolCode("")}>×</button><strong>{active.name}</strong><span>{active.ownership} · {active.schoolType} · {active.city}{active.area ? ` · ${active.area}` : ""}</span><span>{active.departmentNames.slice(0, 3).join(" · ") || "科別資料未提供"}</span><Link href={`/schools/${encodeURIComponent(active.code)}`}>查看學校詳情 →</Link></aside> : null}
      </div>
    </section>
  </div>;
}
