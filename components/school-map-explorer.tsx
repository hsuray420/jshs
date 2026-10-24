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
const inBounds = (point: { latitude: number; longitude: number }, bounds: Bounds) =>
  point.latitude <= bounds.north && point.latitude >= bounds.south && point.longitude <= bounds.east && point.longitude >= bounds.west;

const matchesSchool = (school: SchoolSearchIndexEntry, rawQuery: string) => {
  if (!rawQuery) return true;
  const needle = normalize(rawQuery);
  if (!needle) return true;
  return (
    normalize(school.name).includes(needle) ||
    (school.code && school.code.includes(needle)) ||
    (school.city && normalize(school.city).includes(needle)) ||
    (school.area && normalize(school.area).includes(needle)) ||
    school.schoolTypes.some((t) => normalize(t).includes(needle)) ||
    school.departmentNames.some((d) => normalize(d).includes(needle)) ||
    (school.normalizedSearchText && school.normalizedSearchText.includes(needle))
  );
};

export function SchoolMapExplorer({ initialDistrict }: { initialDistrict?: string }) {
  const { schools, loading, error } = useSchoolSearchIndex();
  const [region, setRegion] = useState("ct");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
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
  const [activeSchoolCode, setActiveSchoolCode] = useState("");
  const [mapError, setMapError] = useState(false);
  const [mapMoved, setMapMoved] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<Bounds | null>(null);
  const [mapRevision, setMapRevision] = useState(0);
  const [mobileSheetMode, setMobileSheetMode] = useState<"collapsed" | "half" | "full">("half");

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      return new Set(JSON.parse(window.localStorage.getItem("jshs-favorite-schools") || "[]"));
    } catch {
      return new Set<string>();
    }
  });

  const toggleFavorite = (code: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      try {
        window.localStorage.setItem("jshs-favorite-schools", JSON.stringify(Array.from(next)));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Debounce query by 160ms for smooth live updates without jank
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 160);
    return () => clearTimeout(timer);
  }, [query]);

  // Restore URL state
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

  // Sync state to URL with replaceState
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

  // All schools belonging to selected district
  const scoped = useMemo(
    () => (regionAvailable ? schools.filter((school) => school.admissionDistricts.some((d) => d.includes(regionName))) : []),
    [schools, regionName, regionAvailable]
  );

  // Verified coordinate lookup
  const coordinateMap = useMemo(() => {
    const map = new Map<string, { latitude: number; longitude: number; verifiedAt?: string }>();
    for (const school of scoped) {
      const coord = getSchoolCoordinate(school.code, school.address);
      if (coord) {
        map.set(school.code, coord);
      }
    }
    return map;
  }, [scoped]);

  const locatedCount = coordinateMap.size;
  const totalScopedCount = scoped.length;
  const coverageNote = `${regionName} · ${locatedCount}／${totalScopedCount} 所已核對座標`;

  // Filter options for selects
  const cities = useMemo(() => unique(scoped.map((school) => school.city)), [scoped]);
  const ownerships = useMemo(() => unique(scoped.map((school) => school.ownership)), [scoped]);
  const schoolTypes = useMemo(() => unique(scoped.flatMap((school) => school.schoolTypes)), [scoped]);
  const departments = useMemo(() => unique(scoped.flatMap((school) => school.departmentNames)), [scoped]);

  // All filtered schools matching search & filter criteria (both with and without coordinates)
  const filteredSchools = useMemo(() => {
    return scoped.filter((school) => {
      if (!matchesSchool(school, debouncedQuery)) return false;
      if (showFavorites && !favorites.has(school.code)) return false;
      if (activeChip === "public" && !(school.ownership || "").includes("公立")) return false;
      if (activeChip === "private" && !(school.ownership || "").includes("私立")) return false;
      if (activeChip === "vocational" && !school.schoolTypes.some((t) => /高職|技術/.test(t))) return false;
      if (activeChip === "comprehensive" && !school.schoolTypes.some((t) => /綜合/.test(t))) return false;
      if (activeChip === "college" && !school.schoolTypes.some((t) => /五專|專科/.test(t))) return false;
      if (activeChip === "special" && !school.departmentNames.some((d) => /實驗|雙語|資優|科學/.test(d))) return false;
      if (city && school.city !== city) return false;
      if (ownership && school.ownership !== ownership) return false;
      if (gender && !/(男女|兼收|不限)/.test(school.gender || "")) return false;
      if (metroOnly && !school.hasPublicTransport) return false;
      if (dormOnly && !/宿舍|住宿/.test(school.lodgingStatus || "")) return false;
      if (schoolType && !school.schoolTypes.includes(schoolType)) return false;
      if (department && !school.departmentNames.includes(department)) return false;

      // Viewport bounds constraint: when "搜尋此區域" is active
      if (viewportBounds) {
        const coord = coordinateMap.get(school.code);
        if (!coord) return false;
        if (!inBounds({ latitude: coord.latitude, longitude: coord.longitude }, viewportBounds)) return false;
      }
      return true;
    });
  }, [scoped, debouncedQuery, showFavorites, favorites, activeChip, city, ownership, gender, metroOnly, dormOnly, schoolType, department, viewportBounds, coordinateMap]);

  // Located points for Leaflet markers
  const mapSchoolPoints = useMemo<LocatedSchool[]>(() => {
    return filteredSchools.flatMap((school) => {
      const coord = coordinateMap.get(school.code);
      if (!coord) return [];
      return [{ school, latitude: coord.latitude, longitude: coord.longitude }];
    });
  }, [filteredSchools, coordinateMap]);

  // Autocomplete search suggestions (top 6 matches)
  const searchSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    return scoped.filter((s) => matchesSchool(s, query)).slice(0, 6);
  }, [scoped, query]);

  const changeRegion = (next: string) => {
    writeStoredDistrict(next);
    setRegion(next);
    setCity("");
    setDepartment("");
    setViewportBounds(null);
    setActiveSchoolCode("");
    setMapMoved(false);
  };

  const selectSchool = useCallback(
    (code: string, shouldFly = true) => {
      setActiveSchoolCode(code);
      const coord = coordinateMap.get(code);
      if (coord && shouldFly && mapInstance.current) {
        const currentZoom = mapInstance.current.getZoom();
        mapInstance.current.flyTo([coord.latitude, coord.longitude], Math.max(currentZoom, 14), {
          duration: 0.65,
          easeLinearity: 0.25,
        });
      }
      // Scroll corresponding school in list into view
      setTimeout(() => {
        const itemEl = document.getElementById(`school-card-${code}`);
        if (itemEl) {
          itemEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);
      // On mobile, collapse sheet to half so user can view marker + card
      setMobileSheetMode("half");
    },
    [coordinateMap]
  );

  const showWholeRegion = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setCity("");
    setOwnership("");
    setGender("");
    setMetroOnly(false);
    setDormOnly(false);
    setSchoolType("");
    setDepartment("");
    setActiveSchoolCode("");
    setViewportBounds(null);
    setMapMoved(false);
    setActiveChip("all");
    const allCoords = scoped.flatMap((s) => {
      const c = coordinateMap.get(s.code);
      return c ? [[c.latitude, c.longitude] as [number, number]] : [];
    });
    if (allCoords.length && mapInstance.current) {
      mapInstance.current.fitBounds(allCoords, { padding: [34, 34], maxZoom: 13 });
    }
  }, [scoped, coordinateMap]);

  const searchViewport = useCallback(() => {
    const bounds = mapInstance.current?.getBounds();
    if (!bounds) return;
    setViewportBounds({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    setMapMoved(false);
  }, []);

  const resetFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCity("");
    setOwnership("");
    setGender("");
    setMetroOnly(false);
    setDormOnly(false);
    setSchoolType("");
    setDepartment("");
    setViewportBounds(null);
    setActiveSchoolCode("");
    setActiveChip("all");
    setShowFavorites(false);
    setMapMoved(false);
  };

  const zoomMap = (delta: number) => {
    const map = mapInstance.current;
    if (map) map.setZoom(map.getZoom() + delta);
  };

  // Keyboard navigation for search input (Enter: pinpoint if 1 match; focus first if multiple)
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setSearchOpen(false);
      if (filteredSchools.length === 1) {
        selectSchool(filteredSchools[0].code, true);
      } else if (filteredSchools.length > 1) {
        const firstCode = filteredSchools[0].code;
        setActiveSchoolCode(firstCode);
        const itemEl = document.getElementById(`school-card-${firstCode}`);
        itemEl?.focus();
        itemEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } else if (event.key === "Escape") {
      setSearchOpen(false);
    }
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;
    let disposed = false;
    import("leaflet")
      .then((L) => {
        if (disposed || !mapElement.current) return;
        const map = L.map(mapElement.current, { zoomControl: false, keyboard: true }).setView(
          [...SCHOOL_MAP_DEFAULT_CENTER],
          SCHOOL_MAP_DEFAULT_ZOOM
        );
        L.tileLayer(SCHOOL_MAP_TILE_URL, { attribution: SCHOOL_MAP_ATTRIBUTION, maxZoom: SCHOOL_MAP_MAX_ZOOM }).addTo(map);
        markerLayer.current = L.layerGroup().addTo(map);
        map.on("moveend", () => setMapMoved(true));
        map.on("zoomend", () => setMapRevision((current) => current + 1));
        mapInstance.current = map;
        setMapRevision((current) => current + 1);
      })
      .catch(() => {
        if (!disposed) setMapError(true);
      });
    return () => {
      disposed = true;
      markerLayer.current = null;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [loading]);

  // Update markers and clusters on map
  useEffect(() => {
    const map = mapInstance.current;
    const layer = markerLayer.current;
    if (!map || !layer) return;
    let disposed = false;

    import("leaflet")
      .then((L) => {
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
              html: `<span aria-label="${escapeHtml(label)}">${escapeHtml(label)}</span><small>${group.length}</small>`,
              iconSize: [Math.max(92, label.length * 16), 42],
            });
            L.marker([latitude, longitude], { icon, keyboard: true, title: `${group.length} 所學校` })
              .addTo(layer)
              .on("click", () =>
                map.fitBounds(L.latLngBounds(group.map((item) => [item.latitude, item.longitude])), {
                  padding: [40, 40],
                  maxZoom: 16,
                })
              );
          } else {
            for (const point of group) {
              const label = map.getZoom() >= 14 ? point.school.name : point.school.area || point.school.city;
              const icon = L.divIcon({
                className: `sm-marker${point.school.code === activeSchoolCode ? " is-active" : ""}`,
                html: `<span><b>${escapeHtml(label)}</b></span>`,
                iconSize: [Math.max(34, label.length * 14), 54],
                iconAnchor: [15, 36],
              });
              L.marker([point.latitude, point.longitude], { icon, keyboard: true, title: point.school.name, alt: point.school.name })
                .addTo(layer)
                .on("click", () => selectSchool(point.school.code, false));
            }
          }
        }

        if (mapSchoolPoints.length && !viewportBounds && mapRevision <= 2) {
          map.fitBounds(
            L.latLngBounds(mapSchoolPoints.map((point) => [point.latitude, point.longitude])),
            { padding: [34, 34], maxZoom: 13 }
          );
        }
      })
      .catch(() => setMapError(true));

    return () => {
      disposed = true;
    };
  }, [mapSchoolPoints, activeSchoolCode, selectSchool, viewportBounds, mapRevision, regionName]);

  const activeSchool = useMemo(() => {
    return filteredSchools.find((item) => item.code === activeSchoolCode);
  }, [filteredSchools, activeSchoolCode]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (city) count++;
    if (ownership) count++;
    if (schoolType) count++;
    if (department) count++;
    if (gender) count++;
    if (metroOnly) count++;
    if (dormOnly) count++;
    return count;
  }, [city, ownership, schoolType, department, gender, metroOnly, dormOnly]);

  if (loading) return <section className="sd-state sm-loading-state" aria-live="polite"><div className="sm-skeleton-loader" /><p>正在載入學校地圖與座標資料庫…</p></section>;
  if (error) return <section className="sd-state sm-error-state" role="status"><h1>學校地圖資料暫時無法載入</h1><p>{error}</p><button type="button" onClick={() => window.location.reload()}>重新整理重試</button></section>;

  return (
    <div className="sd-root sm-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

      {/* 1. Compact Header */}
      <header className="sm-toolbar sd-container">
        <div className="sm-toolbar-copy sm-page-header">
          <div className="sm-hero-copy">
            <p className="sm-eyebrow">
              <span className="material-symbols-outlined">map</span>學校地圖工作台
            </p>
            <h1>在地圖上找到學校</h1>
            <p className="sm-trust-caption">
              {coverageNote}；未有可驗證座標的學校仍可查看詳情，不會被錯誤標在地圖上。
            </p>
            <span className="sr-only">
              選擇要在地圖定位的學校。{coverageNote}；未有可驗證座標的學校不會被錯誤標在地圖上。
            </span>
          </div>

          <div className="sm-header-actions">
            <button
              type="button"
              className={`sm-favorites-pill ${showFavorites ? "is-active" : ""}`}
              aria-pressed={showFavorites}
              onClick={() => setShowFavorites((value) => !value)}
            >
              <span className="material-symbols-outlined">{showFavorites ? "bookmark" : "bookmark_border"}</span>
              <span>{showFavorites ? "顯示全部學校" : "已收藏學校"}</span>
              <strong>{favorites.size} 所</strong>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Unified Map & List Workbench */}
      <main className="sm-workbench-container sd-container" aria-label="學校地圖探索工作台">
        <section className={`sm-layout sm-workbench ${mobileSheetMode === "full" ? "is-sheet-full" : ""}`}>
          
          {/* Left Column: Fixed Search & Scrollable School List */}
          <aside className={`sm-sidebar sm-list ${mobileSheetMode === "collapsed" ? "is-collapsed" : mobileSheetMode === "full" ? "is-full" : "is-half"}`} aria-label="學校搜尋與結果清單">
            {/* Mobile Bottom Sheet Handle */}
            <div className="sm-sheet-handle-bar" onClick={() => setMobileSheetMode((m) => (m === "full" ? "half" : m === "half" ? "collapsed" : "half"))}>
              <div className="sm-sheet-grabber" />
              <div className="sm-sheet-summary-row">
                <span className="sm-sheet-tag">
                  <span className="material-symbols-outlined">near_me</span>
                  {regionName} · {mapSchoolPoints.length} 所已定位
                </span>
                <button
                  type="button"
                  className="sm-sheet-toggle-btn"
                  aria-label={mobileSheetMode === "full" ? "縮小清單" : "展開完整清單"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileSheetMode((m) => (m === "full" ? "half" : "full"));
                  }}
                >
                  <span>{mobileSheetMode === "full" ? "收起清單" : `清單 (${filteredSchools.length})`}</span>
                  <span className="material-symbols-outlined">{mobileSheetMode === "full" ? "expand_more" : "expand_less"}</span>
                </button>
              </div>
            </div>

            {/* Sidebar Controls Header */}
            <div className="sm-sidebar-head">
              {/* Primary Search Input */}
              <div className="sm-search-shell">
                <label className="sm-map-search">
                  <span className="material-symbols-outlined">search</span>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    onFocus={() => setSearchOpen(true)}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSearchOpen(true);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    onBlur={() => window.setTimeout(() => setSearchOpen(false), 180)}
                    placeholder="搜尋校名、代碼、地區或科別（Enter 定位）"
                    aria-label="搜尋學校"
                    aria-expanded={searchOpen && searchSuggestions.length > 0}
                    aria-controls="sm-search-listbox"
                  />
                  {query ? (
                    <button
                      type="button"
                      className="sm-search-clear"
                      aria-label="清除搜尋文字"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setQuery("");
                        setSearchOpen(false);
                      }}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="sm-search-submit"
                    onClick={() => {
                      setQuery(query.trim());
                      setSearchOpen(false);
                      if (filteredSchools.length === 1) {
                        selectSchool(filteredSchools[0].code, true);
                      }
                    }}
                  >
                    搜尋
                  </button>
                </label>

                {/* Autocomplete Suggestions Dropdown */}
                {searchOpen && searchSuggestions.length > 0 ? (
                  <div id="sm-search-listbox" className="sm-search-suggestions" role="listbox" aria-label="學校搜尋建議">
                    {searchSuggestions.map((school) => {
                      const hasCoord = coordinateMap.has(school.code);
                      return (
                        <button
                          key={school.code}
                          type="button"
                          role="option"
                          aria-selected={school.code === activeSchoolCode}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setQuery(school.name);
                            setSearchOpen(false);
                            selectSchool(school.code, true);
                          }}
                        >
                          <span className="material-symbols-outlined">{hasCoord ? "school" : "location_off"}</span>
                          <span className="sm-suggestion-text">
                            <strong>{school.name}</strong>
                            <small>
                              {school.city}{school.area ? ` · ${school.area}` : ""} · {school.schoolTypes.slice(0, 1).join("")}
                              {!hasCoord ? "（尚未核對座標）" : ""}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* District & Coverage Info Row */}
              <div className="sm-meta-row">
                <label className="sm-region-pill" aria-label="選擇就學區">
                  <span className="material-symbols-outlined">near_me</span>
                  <span>就學區：</span>
                  <select
                    value={region}
                    onChange={(event) => changeRegion(event.target.value)}
                    aria-label="選擇要查看的就學區"
                  >
                    {!regionAvailable ? <option value={region} disabled>{regionName}（資料驗證中）</option> : null}
                    {regions.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined">expand_more</span>
                </label>
                <div className="sm-coverage-pill" title="經緯度以教育部統計處資料庫核對">
                  <span className="material-symbols-outlined">verified</span>
                  <span>{locatedCount}／{totalScopedCount} 已定位</span>
                </div>
              </div>

              {/* Quick Filter Pills */}
              <div className="sm-quick-filters" role="toolbar" aria-label="快捷學校類別篩選">
                {[
                  ["all", "grid_view", "全部"],
                  ["public", "account_balance", "公立"],
                  ["private", "corporate_fare", "私立"],
                  ["vocational", "precision_manufacturing", "高職"],
                  ["comprehensive", "auto_stories", "綜高"],
                  ["college", "school", "五專"],
                ].map(([key, icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={activeChip === key ? "is-active" : ""}
                    onClick={() => setActiveChip(activeChip === key ? "all" : key)}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`sm-more-filter ${isAdvancedOpen || activeFiltersCount > 0 ? "is-active" : ""}`}
                  onClick={() => setIsAdvancedOpen((v) => !v)}
                  aria-expanded={isAdvancedOpen}
                >
                  <span className="material-symbols-outlined">tune</span>
                  更多篩選
                  {activeFiltersCount > 0 ? <span className="sm-filter-badge">{activeFiltersCount}</span> : null}
                </button>
              </div>

              {/* Collapsible Advanced Filters */}
              {isAdvancedOpen ? (
                <div className="sm-advanced-panel" aria-label="細部篩選條件">
                  <div className="sm-advanced-grid">
                    <label>縣市
                      <select value={city} onChange={(e) => setCity(e.target.value)}>
                        <option value="">全部縣市</option>
                        {cities.map((val) => <option key={val} value={val}>{val}</option>)}
                      </select>
                    </label>
                    <label>公私立
                      <select value={ownership} onChange={(e) => setOwnership(e.target.value)}>
                        <option value="">全部公私立</option>
                        {ownerships.map((val) => <option key={val} value={val}>{val}</option>)}
                      </select>
                    </label>
                    <label>學制
                      <select value={schoolType} onChange={(e) => setSchoolType(e.target.value)}>
                        <option value="">全部學制</option>
                        {schoolTypes.map((val) => <option key={val} value={val}>{val}</option>)}
                      </select>
                    </label>
                    <label>科別
                      <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                        <option value="">全部科別</option>
                        {departments.map((val) => <option key={val} value={val}>{val}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="sm-advanced-actions">
                    <button type="button" className="sm-reset-btn" onClick={resetFilters}>
                      重設細部條件
                    </button>
                    <button type="button" className="sm-apply-btn" onClick={() => setIsAdvancedOpen(false)}>
                      套用
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Status & Results Summary Bar */}
              <div className="sm-list-head" aria-live="polite">
                <div className="sm-count-info">
                  <strong>
                    符合 {filteredSchools.length} 所
                    {mapSchoolPoints.length !== filteredSchools.length ? (
                      <small> · 地圖顯示 {mapSchoolPoints.length} 所</small>
                    ) : null}
                  </strong>
                  {viewportBounds ? (
                    <span className="sm-viewport-indicator">
                      （僅顯示當前視窗範圍）
                    </span>
                  ) : null}
                </div>

                {activeFiltersCount > 0 || query || viewportBounds ? (
                  <button type="button" className="sm-clear-filters-link" onClick={resetFilters}>
                    清除篩選
                  </button>
                ) : null}
              </div>
            </div>

            {/* Scrollable School List (Bi-directional link with Map) */}
            <div ref={listContainerRef} className="sm-list-scroll" tabIndex={0} aria-label="符合條件的學校清單">
              {filteredSchools.length === 0 ? (
                <div className="sm-empty-list" role="status">
                  <span className="material-symbols-outlined sm-empty-icon">search_off</span>
                  <p><strong>找不到相符學校</strong></p>
                  <span>試試縮小關鍵字，或清除細部篩選條件。</span>
                  <button type="button" className="sm-reset-area-btn" onClick={resetFilters}>
                    清除所有條件
                  </button>
                </div>
              ) : (
                filteredSchools.map((school) => {
                  const hasCoord = coordinateMap.has(school.code);
                  const isSelected = school.code === activeSchoolCode;
                  return (
                    <article
                      key={school.code}
                      id={`school-card-${school.code}`}
                      tabIndex={0}
                      className={`sm-school-item ${isSelected ? "is-active" : ""} ${!hasCoord ? "is-unlocated" : ""}`}
                      onClick={() => selectSchool(school.code, hasCoord)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectSchool(school.code, hasCoord);
                        }
                      }}
                    >
                      <div className="sm-item-body">
                        <div className="sm-item-title-row">
                          <strong className="sm-school-name">{school.name}</strong>
                          <span className="sm-code-badge">#{school.code}</span>
                        </div>

                        <div className="sm-item-meta">
                          <span>{school.city}{school.area ? ` · ${school.area}` : ""}</span>
                          <span> · {school.ownership}</span>
                          <span> · {school.schoolTypes.slice(0, 1).join("")}</span>
                        </div>

                        {school.departmentNames.length > 0 ? (
                          <div className="sm-card-tags">
                            {school.departmentNames.slice(0, 2).map((dept) => (
                              <em key={dept}>{dept}</em>
                            ))}
                            {school.departmentNames.length > 2 ? <span>+{school.departmentNames.length - 2}</span> : null}
                          </div>
                        ) : null}

                        {!hasCoord ? (
                          <div className="sm-no-coord-hint" title="學校資料可查看，地圖位置尚未核實">
                            <span className="material-symbols-outlined">location_off</span>
                            <span>尚無可驗證地圖座標</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="sm-item-actions">
                        <button
                          type="button"
                          className={`sm-fav-btn ${favorites.has(school.code) ? "is-active" : ""}`}
                          aria-label={favorites.has(school.code) ? `取消收藏 ${school.name}` : `收藏 ${school.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(school.code);
                          }}
                        >
                          <span className="material-symbols-outlined">
                            {favorites.has(school.code) ? "bookmark" : "bookmark_border"}
                          </span>
                        </button>
                        {hasCoord ? (
                          <button
                            type="button"
                            className="sm-pin-btn"
                            aria-label={`在地圖上定位 ${school.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectSchool(school.code, true);
                            }}
                          >
                            <span className="material-symbols-outlined">my_location</span>
                          </button>
                        ) : null}
                        <Link
                          href={`/schools/${encodeURIComponent(school.code)}`}
                          className="sm-view-detail"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`查看 ${school.name} 詳細資訊`}
                        >
                          詳情 →
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Column: Interactive Map */}
          <div className="sm-map-wrap">
            {!mapError ? (
              <div
                ref={mapElement}
                className="sm-map"
                aria-label={`${regionName}學校位置地圖`}
                role="application"
              />
            ) : (
              <div className="sm-map-fallback" role="status">
                <h2>地圖暫時無法載入</h2>
                <p>仍可使用左側學校清單與詳情頁；重新整理後可再次嘗試。</p>
                <button type="button" onClick={() => window.location.reload()}>重新嘗試載入</button>
              </div>
            )}

            {/* Map Controls */}
            <div className="sm-map-controls">
              <div className="sm-zoom-control">
                <button type="button" aria-label="放大地圖" onClick={() => zoomMap(1)}>+</button>
                <button type="button" aria-label="縮小地圖" onClick={() => zoomMap(-1)}>−</button>
              </div>
              <button
                type="button"
                className="sm-locate-control"
                aria-label="回到地圖中心"
                onClick={() => {
                  if (locatedCount && mapInstance.current) {
                    const allCoords = scoped.flatMap((s) => {
                      const c = coordinateMap.get(s.code);
                      return c ? [[c.latitude, c.longitude] as [number, number]] : [];
                    });
                    if (allCoords.length) {
                      mapInstance.current.fitBounds(allCoords, { padding: [34, 34], maxZoom: 13 });
                    }
                  }
                }}
              >
                <span className="material-symbols-outlined">my_location</span>
              </button>
            </div>

            {/* Viewport Bounds Action Buttons */}
            {mapMoved ? (
              <button className="sm-search-area" type="button" onClick={searchViewport}>
                <span className="material-symbols-outlined">zoom_in_map</span>
                搜尋此區域
              </button>
            ) : null}

            {viewportBounds ? (
              <button className="sm-reset-area" type="button" onClick={showWholeRegion}>
                <span className="material-symbols-outlined">travel_explore</span>
                顯示整個{regionName}
              </button>
            ) : null}

            {/* Map Attribution */}
            <div className="sm-map-attribution">
              <span>教育部統計處經緯驗證資料庫</span>
              <span>© OpenStreetMap contributors</span>
            </div>

            {/* Active Selected School Floating Card */}
            {activeSchool ? (
              <aside key={activeSchoolCode} className="sm-preview" aria-live="polite">
                <button
                  type="button"
                  aria-label="關閉學校預覽"
                  onClick={() => setActiveSchoolCode("")}
                >
                  ×
                </button>
                <div className="sm-preview-head">
                  <strong>{activeSchool.name}</strong>
                  <span className="sm-code-badge">#{activeSchool.code}</span>
                </div>
                <span>
                  {activeSchool.ownership} · {activeSchool.schoolTypes.join(" · ")} · {activeSchool.city}
                  {activeSchool.area ? ` · ${activeSchool.area}` : ""}
                </span>
                <span>
                  {activeSchool.departmentNames.slice(0, 3).join(" · ") || "科別資料未提供"}
                </span>
                <div className="sm-preview-actions">
                  <Link href={`/schools/${encodeURIComponent(activeSchool.code)}`} className="sm-primary-link">
                    查看學校詳情 →
                  </Link>
                  <button
                    type="button"
                    className={`sm-preview-fav-btn ${favorites.has(activeSchool.code) ? "is-active" : ""}`}
                    onClick={() => toggleFavorite(activeSchool.code)}
                  >
                    <span className="material-symbols-outlined">
                      {favorites.has(activeSchool.code) ? "bookmark" : "bookmark_border"}
                    </span>
                    <span>{favorites.has(activeSchool.code) ? "已收藏" : "收藏"}</span>
                  </button>
                  {coordinateMap.has(activeSchool.code) ? (
                    <button
                      type="button"
                      className="sm-preview-recenter-btn"
                      onClick={() => selectSchool(activeSchool.code, true)}
                    >
                      <span className="material-symbols-outlined">my_location</span>
                      <span>定位</span>
                    </button>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>

        </section>
      </main>
    </div>
  );
}
