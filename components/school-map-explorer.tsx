"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { useSchoolSearchIndex } from "@/components/school-static-data";
import { getSchoolCoordinate } from "@/lib/school-geocode";
import { normalizeDistrict, readStoredDistrict, writeStoredDistrict } from "@/lib/district-context";
import { getAvailableSchoolDataRegions, getRegionById } from "@/lib/region-registry";
import { SCHOOL_MAP_ATTRIBUTION, SCHOOL_MAP_DEFAULT_CENTER, SCHOOL_MAP_DEFAULT_ZOOM, SCHOOL_MAP_MAX_ZOOM, SCHOOL_MAP_TILE_URL } from "@/lib/school-map-config";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";
import "@/components/school-discovery.css";
import "@/components/school-animations.css";

type LocatedSchool = Readonly<{ school: SchoolSearchIndexEntry; latitude: number; longitude: number }>;
type Bounds = Readonly<{ north: number; south: number; east: number; west: number }>;
const regions = getAvailableSchoolDataRegions();
const normalize = (value: string) => value.normalize("NFKC").replaceAll("台", "臺").replace(/\s+/g, "").toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
const inBounds = (point: LocatedSchool, bounds: Bounds) => point.latitude <= bounds.north && point.latitude >= bounds.south && point.longitude <= bounds.east && point.longitude >= bounds.west;

export function SchoolMapExplorer({ initialDistrict }: { initialDistrict?: string }) {
  const { schools, loading, error } = useSchoolSearchIndex();
  const [region, setRegion] = useState("ct");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [ownership, setOwnership] = useState("");
  const [gender, setGender] = useState("");
  const [metroOnly, setMetroOnly] = useState(false);
  const [dormOnly, setDormOnly] = useState(false);
  const [schoolType, setSchoolType] = useState("");
  const [department, setDepartment] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [favorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      return new Set(JSON.parse(window.localStorage.getItem("jshs-favorite-schools") || "[]"));
    } catch {
      return new Set<string>();
    }
  });
  const [activeSchoolCode, setActiveSchoolCode] = useState("");
  const [mapError, setMapError] = useState(false);
  const [mapMoved, setMapMoved] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<Bounds | null>(null);
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

  const selectedRegion = getRegionById(region);
  const regionAvailable = selectedRegion?.schoolDataStatus === "available";
  const regionName = selectedRegion?.name || "中投區";
  const scoped = useMemo(() => regionAvailable ? schools.filter((school) => school.admissionDistricts.some((district) => district.includes(regionName))) : [], [schools, regionName, regionAvailable]);
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
      && (!showFavorites || favorites.has(school.code))
      && (activeChip !== "public" || (school.ownership || "").includes("公立"))
      && (activeChip !== "private" || (school.ownership || "").includes("私立"))
      && (activeChip !== "vocational" || school.schoolTypes.some((type) => /高職|技術/.test(type)))
      && (activeChip !== "comprehensive" || school.schoolTypes.some((type) => /綜合/.test(type)))
      && (activeChip !== "college" || school.schoolTypes.some((type) => /五專|專科/.test(type)))
      && (activeChip !== "special" || school.departmentNames.some((name) => /實驗|雙語|資優|科學/.test(name)))
      && (!city || school.city === city)
      && (!ownership || school.ownership === ownership)
      && (!gender || /(男女|兼收|不限)/.test(school.gender || ""))
      && (!metroOnly || school.hasPublicTransport)
      && (!dormOnly || /宿舍|住宿/.test(school.lodgingStatus || ""))
      && (!schoolType || school.schoolTypes.includes(schoolType))
      && (!department || school.departmentNames.includes(department)))
      .filter((point) => !viewportBounds || inBounds(point, viewportBounds));
  }, [located, query, city, ownership, gender, metroOnly, dormOnly, schoolType, department, viewportBounds, activeChip, favorites, showFavorites]);
  const changeRegion = (next: string) => {
    writeStoredDistrict(next);
    setRegion(next);
    setCity(""); setDepartment(""); setViewportBounds(null); setActiveSchoolCode("");
  };
  const selectSchool = useCallback((code: string) => {
    setActiveSchoolCode(code);
    const point = mapSchoolPoints.find((item) => item.school.code === code);
    if (point) {
      mapInstance.current?.flyTo([point.latitude, point.longitude], Math.max(mapInstance.current.getZoom(), 14), {
        duration: 0.75,
        easeLinearity: 0.25,
      });
    }
  }, [mapSchoolPoints]);
  const showWholeRegion = useCallback(() => {
    setQuery(""); setCity(""); setOwnership(""); setGender(""); setMetroOnly(false); setDormOnly(false); setSchoolType(""); setDepartment("");
    setActiveSchoolCode(""); setViewportBounds(null);
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
          const areaNames = unique(group.map((item) => item.school.area || item.school.city));
          const label = map.getZoom() < 12 ? regionName : areaNames.slice(0, 2).join("、");
          const icon = L.divIcon({
            className: "sm-cluster",
            html: `<span aria-label="${escapeHtml(label)}">${escapeHtml(label)}</span>`,
            iconSize: [Math.max(92, label.length * 16), 42],
          });
          L.marker([latitude, longitude], { icon, keyboard: true, title: `${group.length} 所學校` }).addTo(layer).on("click", () => map.fitBounds(L.latLngBounds(group.map((item) => [item.latitude, item.longitude])), { padding: [40, 40], maxZoom: 16 }));
        } else {
          for (const point of group) {
            const label = map.getZoom() >= 14 ? point.school.name : (point.school.area || point.school.city);
            const icon = L.divIcon({
              className: `sm-marker${point.school.code === activeSchoolCode ? " is-active" : ""}`,
              html: `<span><b>${escapeHtml(label)}</b></span>`,
              iconSize: [Math.max(34, label.length * 14), 54],
              iconAnchor: [15, 36],
            });
            L.marker([point.latitude, point.longitude], { icon, keyboard: true, title: point.school.name, alt: point.school.name }).addTo(layer).on("click", () => selectSchool(point.school.code));
          }
        }
      }
      if (mapSchoolPoints.length && !viewportBounds && mapRevision <= 2) map.fitBounds(L.latLngBounds(mapSchoolPoints.map((point) => [point.latitude, point.longitude])), { padding: [34, 34], maxZoom: 13 });
    }).catch(() => setMapError(true));
    return () => { disposed = true; };
  }, [mapSchoolPoints, activeSchoolCode, selectSchool, viewportBounds, mapRevision, regionName]);

  const searchViewport = () => {
    const bounds = mapInstance.current?.getBounds();
    if (!bounds) return;
    setViewportBounds({ north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() });
    setMapMoved(false);
  };
  const resetFilters = () => {
    setQuery(""); setCity(""); setOwnership(""); setGender(""); setMetroOnly(false); setDormOnly(false); setSchoolType(""); setDepartment("");
    setViewportBounds(null); setActiveSchoolCode("");
    setActiveChip("all"); setShowFavorites(false);
  };
  const zoomMap = (delta: number) => {
    const map = mapInstance.current;
    if (map) map.setZoom(map.getZoom() + delta);
  };
  const active = mapSchoolPoints.find((item) => item.school.code === activeSchoolCode)?.school;
  const coordinateCoverage = `${located.length}／${scoped.length}`;
  const searchSuggestions = scoped
    .filter((school) => !query || normalize(school.name).includes(normalize(query)))
    .slice(0, 6);

  if (loading) return <section className="sd-state" aria-live="polite">正在載入學校地圖資料…</section>;
  if (error) return <section className="sd-state" role="status"><h1>學校地圖資料暫時無法載入</h1><p>{error}</p></section>;

  return <div className="sd-root sm-root">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <header className="sm-toolbar sd-container">
      <div className="sm-toolbar-copy sm-page-header">
        <div className="sm-hero-copy">
          <p className="sm-eyebrow"><span className="material-symbols-outlined">map</span>學校地圖</p>
          <h1>在地圖上找到學校</h1>
          <span className="sr-only">{regionName}已核對座標 {coordinateCoverage} 所；未有可驗證座標的學校不會被錯誤標在地圖上。</span>
        </div>
        <button type="button" className={`sm-favorites-pill ${showFavorites ? "is-active" : ""}`} aria-pressed={showFavorites} onClick={() => setShowFavorites((value) => !value)}>
          <span className="material-symbols-outlined">{showFavorites ? "bookmark" : "bookmark_border"}</span>
          <span>{showFavorites ? "顯示全部學校" : "查看已收藏學校"}</span>
          <strong>{favorites.size} 所</strong>
        </button>
      </div>
      <section className="sm-filter-hub" aria-label="地圖搜尋與篩選">
        <div className="sm-filter-primary">
          <div className="sm-search-shell">
            <label className="sm-map-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="search"
                value={query}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                placeholder="搜尋學校名稱、地區或科別（例如：建國中學、商業經營...）"
              />
              {query ? (
                <button
                  type="button"
                  className="sm-search-clear"
                  aria-label="清除搜尋文字"
                  onMouseDown={(e) => { e.preventDefault(); setQuery(""); setSearchOpen(false); }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              ) : null}
              <button type="button" onClick={() => { setQuery(query.trim()); setSearchOpen(false); }}>
                搜尋 <span aria-hidden="true">→</span>
              </button>
            </label>
            {searchOpen ? <div className="sm-search-suggestions" role="listbox" aria-label="預設學校搜尋建議">
              {searchSuggestions.map((school) => <button key={school.code} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(school.name); setSearchOpen(false); selectSchool(school.code); }}><span className="material-symbols-outlined">school</span><span><strong>{school.name}</strong><small>{school.city}{school.area ? ` · ${school.area}` : ""}</small></span></button>)}
              {!searchSuggestions.length ? <span className="sm-search-empty">輸入關鍵字搜尋學校</span> : null}
            </div> : null}
          </div>
          <label className="sm-region-pill"><span className="material-symbols-outlined">near_me</span><span>就學區：</span><select value={region} onChange={(event) => changeRegion(event.target.value)} aria-label="選擇要查看的就學區">{!regionAvailable ? <option value={region} disabled>{regionName}（資料驗證中）</option> : null}{regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="material-symbols-outlined">expand_more</span></label>
        </div>
        <span className="sr-only">選擇要在地圖定位的學校</span>
        <div className="sm-quick-filters">
          {[
            ["all", "grid_view", "全部學校"],
            ["public", "account_balance", "公立高中"],
            ["private", "corporate_fare", "私立高中"],
            ["vocational", "precision_manufacturing", "技術型高中 (高職)"],
            ["comprehensive", "auto_stories", "綜合高中"],
            ["special", "science", "特色實驗班"],
            ["college", "school", "五專專區"],
          ].map(([key, icon, label]) => (
            <button key={key} type="button" className={activeChip === key ? "is-active" : ""} onClick={() => setActiveChip(activeChip === key ? "all" : key)}>
              <span className="material-symbols-outlined">{icon}</span>{label}
            </button>
          ))}
          <button type="button" className="sm-more-filter" onClick={() => setIsAdvancedOpen((value) => !value)}><span className="material-symbols-outlined">tune</span>更多篩選</button>
        </div>
        {isAdvancedOpen ? <div className="sm-advanced-panel">
          <label>縣市<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">全部</option>{cities.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>公私立<select value={ownership} onChange={(event) => setOwnership(event.target.value)}><option value="">全部</option>{ownerships.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>學制<select value={schoolType} onChange={(event) => setSchoolType(event.target.value)}><option value="">全部</option>{schoolTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>群科類別<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">全部</option>{departments.map((value) => <option key={value}>{value}</option>)}</select></label>
          <button type="button" onClick={resetFilters}>重設細部條件</button>
        </div> : null}
      </section>
    </header>
    <section className="sm-layout" aria-label="學校地圖探索器">
      <div className="sm-map-wrap">{!mapError ? <div ref={mapElement} className="sm-map" aria-label={`${regionName}學校位置地圖`} /> : <div className="sm-map-fallback" role="status"><h2>地圖暫時無法載入</h2><p>仍可使用學校清單與詳情頁；重新整理後可再次嘗試。</p></div>}<div className="sm-map-controls"><div className="sm-zoom-control"><button type="button" aria-label="放大地圖" onClick={() => zoomMap(1)}>+</button><button type="button" aria-label="縮小地圖" onClick={() => zoomMap(-1)}>−</button></div><button type="button" className="sm-locate-control" aria-label="回到地圖中心" onClick={() => mapInstance.current?.setView([...SCHOOL_MAP_DEFAULT_CENTER], SCHOOL_MAP_DEFAULT_ZOOM)}><span className="material-symbols-outlined">my_location</span></button></div>{mapMoved ? <button className="sm-search-area" type="button" onClick={searchViewport}>搜尋此區域</button> : null}{viewportBounds ? <button className="sm-reset-area" type="button" onClick={showWholeRegion}>顯示整個{regionName}</button> : null}<div className="sm-map-attribution"><span>2 km</span><span>教育部統計處經緯驗證資料庫</span></div>
        {active ? <aside key={activeSchoolCode} className="sm-preview" aria-live="polite"><button type="button" aria-label="關閉學校預覽" onClick={() => setActiveSchoolCode("")}>×</button><strong>{active.name}</strong><span>{active.ownership} · {active.schoolType} · {active.city}{active.area ? ` · ${active.area}` : ""}</span><span>{active.departmentNames.slice(0, 3).join(" · ") || "科別資料未提供"}</span><Link href={`/schools/${encodeURIComponent(active.code)}`}>查看學校詳情 →</Link></aside> : null}
      </div>
    </section>
  </div>;
}
