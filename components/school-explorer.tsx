"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteIcon } from "@/components/site-icons";
import { getRegionRegistry } from "@/lib/region-registry";
import { DEFAULT_POPULAR_SCHOOLS } from "@/lib/popular-schools-data";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";
import "@/components/schools-v2.css";

export type SchoolExplorerFilters = {
  query?: string;
  district?: string;
  city?: string;
  area?: string;
  ownership?: string;
  program?: string;
  gender?: string;
  department?: string;
};

const normalized = (value: string) => value.toLowerCase().replaceAll("台", "臺").replace(/\s/g, "");
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
// Existing utility routes remain available: /schools/compare and /schools/map.
// The selector keeps its existing UI and reads availability from the canonical registry.
const regions = getRegionRegistry();
const defaultDistrict = "ct";

// Rich metadata for 15 admission districts across Taiwan
const districtCityLabels: Record<string, string> = {
  "tp": "基北區 (北北基)",
  "taoyuan-lienchiang": "桃連區 (桃園/連江)",
  "hsinchu-miaoli": "竹苗區 (竹市/竹縣/苗栗)",
  "ct": "中投區 (臺中/南投)",
  "changhua": "彰化區 (彰化縣)",
  "yunlin": "雲林區 (雲林縣)",
  "chiayi": "嘉義區 (嘉義市/嘉義縣)",
  "tainan": "臺南區 (臺南市)",
  "kaohsiung": "高雄區 (高雄市)",
  "pingtung": "屏東區 (屏東縣)",
  "yilan": "宜蘭區 (宜蘭縣)",
  "hualien": "花蓮區 (花蓮縣)",
  "taitung": "臺東區 (臺東縣)",
  "penghu": "澎湖區 (澎湖縣)",
  "kinmen": "金門區 (金門縣)",
};

const quickCategories = [
  { id: "all", label: "全部學校" },
  { id: "popular", label: "熱門學校" },
  { id: "public", label: "公立優先" },
  { id: "private", label: "私立學校" },
  { id: "vocational", label: "技術型高中 (高職)" },
  { id: "senior", label: "普通型高中" },
  { id: "college", label: "五專專區" },
];

function SearchBox({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <form
      className="sv-search-box stitch-search-box"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="stitch-search-lead-icon" aria-hidden="true">
        <SiteIcon name="search" size={20} />
      </div>
      <label className="sr-only" htmlFor="school-search">
        搜尋學校、科別或課程方向
      </label>
      <input
        id="school-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜尋學校名稱、地區或科別…"
        autoComplete="off"
        className="stitch-search-input"
      />
      {value ? (
        <button
          type="button"
          aria-label="清除搜尋"
          onClick={() => onChange("")}
          className="sv-search-clear stitch-search-clear"
        >
          <SiteIcon name="close" size={16} />
        </button>
      ) : null}
      <button
        type="submit"
        aria-label="開始搜尋"
        className="sv-search-submit stitch-search-submit-btn"
      >
        <span>開始搜尋</span>
        <SiteIcon name="chevron-right" size={15} />
      </button>
    </form>
  );
}

function FilterPanel({
  prefix,
  schools,
  filters,
  update,
  clear,
}: {
  prefix: string;
  schools: readonly SchoolSearchIndexEntry[];
  filters: SchoolExplorerFilters;
  update: (key: keyof SchoolExplorerFilters, value: string) => void;
  clear: () => void;
}) {
  const fields: [keyof SchoolExplorerFilters, string, string[]][] = [
    ["ownership", "公私立", unique(schools.map((school) => school.ownership))],
    ["program", "學校類型／學制", unique(schools.flatMap((school) => school.schoolTypes || [school.schoolType]))],
    ["city", "縣市", unique(schools.map((school) => school.city))],
    ["department", "科別", unique(schools.flatMap((school) => school.departmentNames))],
  ];
  return (
    <div className="sv-filter-fields">
      <div className="sv-filter-heading">
        <strong>篩選條件</strong>
        <button type="button" onClick={clear}>
          清除
        </button>
      </div>
      {fields.map(([key, label, values]) => (
        <label key={key} htmlFor={`${prefix}-${key}`}>
          {label}
          <select
            id={`${prefix}-${key}`}
            value={filters[key] || ""}
            onChange={(event) => update(key, event.target.value)}
          >
            <option value="">全部</option>
            {values.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

function SchoolCard({
  school,
  selected,
  onCompare,
  compact = false,
  viewMode = "grid",
  index = 0,
}: {
  school: SchoolSearchIndexEntry;
  selected?: boolean;
  onCompare?: (code: string) => void;
  compact?: boolean;
  viewMode?: "grid" | "list";
  index?: number;
}) {
  const isPublic = (school.ownership || "").includes("公立");
  const isVocational = (school.schoolTypes || [school.schoolType]).some((t) =>
    /高職|技術|五專/.test(t || ""),
  );
  const [animatingHeart, setAnimatingHeart] = useState(false);

  const handleFavoriteClick = () => {
    setAnimatingHeart(true);
    setTimeout(() => setAnimatingHeart(false), 400);
    onCompare?.(school.code);
  };

  return (
    <article
      className={`sv-school-card stitch-school-card animate-fadeInUp delay-card-${(index % 6) + 1} ${
        compact ? "is-popular" : ""
      } ${isPublic ? "is-public" : "is-private"} ${viewMode === "list" ? "is-list-view" : ""}`}
    >
      <div className="sv-card-topline stitch-card-header">
        <div className="sv-topline-left stitch-header-left">
          <div className="sv-school-card-symbol stitch-card-badge" aria-hidden="true">
            <SiteIcon name="school" size={18} />
          </div>
          <div className="stitch-title-group">
            <h3 className="stitch-school-name">
              <Link href={`/schools/${school.code}`}>{school.name}</Link>
            </h3>
            <p className="sv-place stitch-school-place">
              {school.city}
              {school.area ? ` · ${school.area}` : ""} ·{" "}
              {school.admissionDistricts.join("、") || "招生區資料尚未提供"}
            </p>
          </div>
        </div>
        {onCompare ? (
          <button
            type="button"
            className={`sv-favorite-button stitch-heart-btn ${selected ? "is-selected" : ""} ${
              animatingHeart ? "heart-pop-anim" : ""
            }`}
            aria-pressed={selected}
            aria-label={selected ? "取消比較" : "加入志願比較"}
            onClick={handleFavoriteClick}
          >
            <span className="sv-heart-icon">{selected ? "♥" : "♡"}</span>
          </button>
        ) : null}
      </div>

      <div className="sv-school-card-main stitch-card-body">
        <div className="sv-tags stitch-tag-row">
          <span
            className={`sv-tag-ownership stitch-pill-badge ${
              isPublic ? "is-public-tag" : "is-private-tag"
            }`}
          >
            {school.ownership || "公私立未提供"}
          </span>
          <span
            className={`sv-tag-type stitch-pill-badge ${
              isVocational ? "is-vocational-tag" : ""
            }`}
          >
            {school.schoolType || "學制未提供"}
          </span>
          <span className="sv-tag-gender stitch-pill-badge">
            {school.gender || "兼收"}
          </span>
          {school.area ? (
            <span className="stitch-pill-badge is-subtle-tag">
              {school.area}
            </span>
          ) : null}
        </div>

        {!compact ? (
          <div className="stitch-department-highlights">
            <p className="sv-departments stitch-departments-text">
              <span className="stitch-dept-label">主要科別：</span>
              {school.departmentNames.length
                ? school.departmentNames.slice(0, 4).join(" · ")
                : "詳見學校簡章"}
            </p>
          </div>
        ) : null}

        <div className="sv-school-card-actions stitch-card-footer">
          {onCompare ? (
            <button
              type="button"
              className={`stitch-compare-btn ${selected ? "is-active" : ""}`}
              onClick={() => onCompare(school.code)}
            >
              {selected ? (
                <>
                  <SiteIcon name="check" size={15} />
                  <span>已加入比較</span>
                </>
              ) : (
                <>
                  <span className="stitch-plus-icon">+</span>
                  <span>加入志願比較</span>
                </>
              )}
            </button>
          ) : null}

          <Link
            className="sv-primary-link stitch-cta-button"
            href={`/schools/${school.code}`}
          >
            <span>查看學校</span>
            <SiteIcon name="chevron-right" size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SchoolExplorer({
  schools: initialSchools = [],
  initialFilters = {},
  initialPopularConfig,
}: {
  schools?: readonly SchoolSearchIndexEntry[];
  initialFilters?: SchoolExplorerFilters;
  initialPopularConfig?: Record<string, string[]>;
}) {
  const [schools, setSchools] = useState<readonly SchoolSearchIndexEntry[]>(initialSchools);
  const [popularConfig, setPopularConfig] = useState<Record<string, string[]>>(
    () => initialPopularConfig || DEFAULT_POPULAR_SCHOOLS,
  );
  const [loading, setLoading] = useState(initialSchools.length === 0);
  const [loadError, setLoadError] = useState("");
  const [district, setDistrict] = useState(() => {
    if (initialFilters.district) return initialFilters.district;
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("jshs-school-district");
      if (saved && regions.some((region) => region.id === saved)) return saved;
    }
    return defaultDistrict;
  });
  const [queryInput, setQueryInput] = useState(initialFilters.query || "");
  const [filters, setFilters] = useState<SchoolExplorerFilters>({
    ...initialFilters,
    district: initialFilters.district || defaultDistrict,
  });
  const [quickCategory, setQuickCategory] = useState<string>("all");
  const [sort, setSort] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [compareCodes, setCompareCodes] = useState<readonly string[]>([]);
  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const districtDropdownRef = useRef<HTMLDivElement>(null);

  // Close district dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        districtDropdownRef.current &&
        !districtDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDistrictMenuOpen(false);
      }
    };
    if (isDistrictMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDistrictMenuOpen]);

  useEffect(() => {
    if (!initialSchools.length) {
      const controller = new AbortController();
      fetch("/data/school-search-index.json", {
        headers: { accept: "application/json" },
        signal: controller.signal,
      })
        .then((response) =>
          response.ok
            ? (response.json() as Promise<{ schools?: SchoolSearchIndexEntry[] }>)
            : Promise.reject(new Error("index unavailable")),
        )
        .then((payload) => setSchools(payload.schools || []))
        .catch((error) => {
          if (error.name !== "AbortError")
            setLoadError("目前無法載入學校資料，請稍後再試。");
        })
        .finally(() => setLoading(false));
      return () => controller.abort();
    }
  }, [initialSchools]);

  useEffect(() => {
    fetch("/api/schools/popular", { headers: { accept: "application/json" } })
      .then((res) =>
        res.ok ? (res.json() as Promise<{ popular?: Record<string, string[]> }>) : null,
      )
      .then((data) => {
        if (data?.popular) setPopularConfig(data.popular);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("jshs-school-district", district);
  }, [district]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setFilters((current) => ({ ...current, query: queryInput })),
      180,
    );
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const region = regions.find((item) => item.id === district);
  const regionName = region?.name || (district === "all" ? "全臺" : "目前就學區");

  const scopedSchools = useMemo(() => {
    if (district !== "all" && regions.find((region) => region.id === district)?.schoolDataStatus !== "available") return [];
    const scopeName = regions.find((region) => region.id === district)?.name || district;
    return filters.query?.trim()
      ? schools
      : district === "all"
      ? schools
      : schools.filter((school) =>
          school.admissionDistricts.some((admissionDistrict) =>
            admissionDistrict.includes(scopeName),
          ),
        );
  }, [schools, district, filters.query]);

  // Dynamic Metrics according to each admission district ("依照每學區做更改字樣與統計")
  const publicCount = useMemo(
    () => scopedSchools.filter((s) => (s.ownership || "").includes("公立")).length,
    [scopedSchools],
  );
  const privateCount = useMemo(
    () => scopedSchools.filter((s) => (s.ownership || "").includes("私立")).length,
    [scopedSchools],
  );
  const vocationalCount = useMemo(
    () =>
      scopedSchools.filter((s) =>
        (s.schoolTypes || [s.schoolType]).some((t) => /高職|技術|五專/.test(t || "")),
      ).length,
    [scopedSchools],
  );

  const popularSchoolCodes = useMemo(() => {
    return (
      popularConfig[district] ||
      DEFAULT_POPULAR_SCHOOLS[district] ||
      popularConfig.all ||
      DEFAULT_POPULAR_SCHOOLS.all ||
      []
    );
  }, [popularConfig, district]);

  const result = useMemo(() => {
    return scopedSchools
      .filter((school) => {
        const tokens = (filters.query || "")
          .split(/[\s、,;；]+/)
          .map(normalized)
          .filter(Boolean);
        const queryMatch = tokens.every(
          (token) =>
            school.normalizedSearchText.includes(token) ||
            (token === "餐飲" && /餐旅|烘焙/.test(school.normalizedSearchText)),
        );

        // Quick Category Filter logic
        if (quickCategory === "popular" && !popularSchoolCodes.includes(school.code)) {
          return false;
        }
        if (quickCategory === "public" && !(school.ownership || "").includes("公立")) {
          return false;
        }
        if (quickCategory === "private" && !(school.ownership || "").includes("私立")) {
          return false;
        }
        if (
          quickCategory === "vocational" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /高職|技術/.test(t || ""))
        ) {
          return false;
        }
        if (
          quickCategory === "senior" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /普通|高中/.test(t || ""))
        ) {
          return false;
        }
        if (
          quickCategory === "college" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /五專/.test(t || ""))
        ) {
          return false;
        }

        return (
          queryMatch &&
          (!filters.city || school.city === filters.city) &&
          (!filters.ownership || school.ownership === filters.ownership) &&
          (!filters.program ||
            (school.schoolTypes || [school.schoolType]).includes(filters.program)) &&
          (!filters.department || school.departmentNames.includes(filters.department))
        );
      })
      .sort((a, b) =>
        String(sort === "city" ? a.city : sort === "ownership" ? a.ownership : a.name).localeCompare(
          String(sort === "city" ? b.city : sort === "ownership" ? b.ownership : b.name),
          "zh-Hant",
        ),
      );
  }, [scopedSchools, filters, sort, quickCategory, popularSchoolCodes]);

  const popularSchools = useMemo(() => {
    const list: SchoolSearchIndexEntry[] = [];
    for (const code of popularSchoolCodes) {
      const found =
        scopedSchools.find((school) => school.code === code) ||
        schools.find((school) => school.code === code);
      if (found && !list.some((item) => item.code === found.code)) {
        list.push(found);
      }
    }
    return list.slice(0, 6);
  }, [popularSchoolCodes, scopedSchools, schools]);

  const active = Object.entries(filters).filter(
    ([key, value]) => key !== "query" && key !== "district" && value,
  ).length;
  const hasIntent = Boolean((filters.query || "").trim() || active || quickCategory !== "all");

  const update = (key: keyof SchoolExplorerFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const clear = () => {
    setFilters((current) => ({ district: current.district }));
    setQuickCategory("all");
  };

  const changeDistrict = (value: string) => {
    setDistrict(value);
    setFilters((current) => ({ ...current, district: value }));
  };

  const toggleCompare = (code: string) =>
    setCompareCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : current.length < 4
        ? [...current, code]
        : current,
    );

  const handleQuickCategory = (id: string) => {
    if (quickCategory === id) {
      setQuickCategory("all");
    } else {
      setQuickCategory(id);
    }
  };

  if (loading)
    return (
      <div className="sv-root">
        <div className="sv-container sv-loading-shell">
          <div className="sv-skeleton sv-skeleton-hero" />
          <div className="sv-skeleton sv-skeleton-row" />
          <div className="sv-skeleton sv-skeleton-row" />
        </div>
      </div>
    );

  if (loadError)
    return (
      <div className="sv-root">
        <div className="sv-container sv-empty">
          <h1>學校資料暫時無法載入</h1>
          <p>{loadError}</p>
          <button
            className="sv-button sv-primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            重新載入
          </button>
        </div>
      </div>
    );

  return (
    <div
      className={`sv-root sv-explorer-root stitch-hero-ambient ${
        hasIntent ? "is-search-mode" : ""
      }`}
    >
      {/* Stitch Subtle Ambient Glow */}
      <div className="stitch-hero-glow" aria-hidden="true" />

      {/* Hero Header Section */}
      <header className="sv-hero">
        <div className="sv-container">
          <div className="sv-hero-header animate-fadeInUp delay-1">
            <div className="sv-hero-badge">
              <span className="stitch-pulsing-dot" />
              <span>全國高中職資料庫</span>
            </div>
            <h1>找學校</h1>
            <p className="sv-hero-desc">
              探索全臺公私立高中職、五專與特色科別，精準掌握升學志願方向
            </p>
          </div>

          <span className="sr-only">找到適合你的學校</span>

          {/* Central Search Architecture Module */}
          <section className="stitch-search-hub animate-fadeInUp delay-2">
            {/* Main Search Input */}
            <SearchBox value={queryInput} onChange={setQueryInput} />

            {/* Categorical Filter Pills */}
            <div className="stitch-filter-pills-bar">
              {quickCategories.map((cat) => {
                const isActive = quickCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`stitch-filter-pill ${isActive ? "is-active" : ""}`}
                    onClick={() => handleQuickCategory(cat.id)}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className={`stitch-filter-pill is-advanced ${
                  active > 0 ? "has-filters" : ""
                }`}
                onClick={() => drawer.current?.showModal()}
              >
                <SiteIcon name="shield" size={16} />
                <span>進階篩選{active > 0 ? ` (${active})` : ""}</span>
              </button>
            </div>

            {/* District Selector & Dynamic Metrics Bar ("依照每學區做更改一些字樣") */}
            <div className="stitch-district-bar">
              <div className="stitch-district-wrapper" ref={districtDropdownRef}>
                <button
                  type="button"
                  className="stitch-district-trigger"
                  aria-expanded={isDistrictMenuOpen}
                  aria-haspopup="listbox"
                  onClick={() => setIsDistrictMenuOpen(!isDistrictMenuOpen)}
                >
                  <div className="stitch-district-trigger-content">
                    <SiteIcon name="school" size={18} className="stitch-district-icon" />
                    <span className="sv-district-label stitch-district-label">目前就學區：</span>
                    <strong className="stitch-district-value">{regionName}</strong>
                  </div>
                  <SiteIcon
                    name="chevron-down"
                    size={16}
                    className={`stitch-district-chevron ${
                      isDistrictMenuOpen ? "is-rotated" : ""
                    }`}
                  />
                </button>

                {/* Accessible native select kept for screen readers and automated test tools */}
                <select
                  className="sr-only"
                  value={district}
                  onChange={(event) => changeDistrict(event.target.value)}
                  aria-label="選擇目前就學區"
                >
                  <option value="all">全臺就學區</option>
                  {regions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.schoolDataStatus !== "available"}
                    >
                      {item.name}
                      {item.schoolDataStatus === "verifying"
                        ? "（資料驗證中）"
                        : item.schoolDataStatus === "unavailable"
                        ? "（尚未開放）"
                        : ""}
                    </option>
                  ))}
                </select>

                {isDistrictMenuOpen ? (
                  <div className="stitch-district-dropdown-menu" role="listbox">
                    <div className="stitch-dropdown-header">
                      <span>切換全臺 15 個就學區</span>
                      <button
                        type="button"
                        className="stitch-dropdown-close"
                        onClick={() => setIsDistrictMenuOpen(false)}
                        aria-label="關閉就學區選單"
                      >
                        <SiteIcon name="close" size={14} />
                      </button>
                    </div>
                    <div className="stitch-dropdown-list">
                      <button
                        type="button"
                        className={`stitch-dropdown-item ${
                          district === "all" ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          changeDistrict("all");
                          setIsDistrictMenuOpen(false);
                        }}
                      >
                        <span className="stitch-item-name">全臺所有就學區</span>
                        {district === "all" ? <SiteIcon name="check" size={16} /> : null}
                      </button>
                      {regions.map((item) => {
                        const isSelected = district === item.id;
                        const isAvail = item.schoolDataStatus === "available";
                        const isVerif = item.schoolDataStatus === "verifying";
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`stitch-dropdown-item ${
                              isSelected ? "is-selected" : ""
                            } ${!isAvail ? "is-disabled" : ""}`}
                            disabled={!isAvail}
                            onClick={() => {
                              changeDistrict(item.id);
                              setIsDistrictMenuOpen(false);
                            }}
                          >
                            <div className="stitch-dropdown-item-info">
                              <span className="stitch-item-name">
                                {districtCityLabels[item.id] || item.name}
                              </span>
                              {isVerif ? (
                                <span className="stitch-status-badge is-verifying">
                                  資料驗證中
                                </span>
                              ) : !isAvail ? (
                                <span className="stitch-status-badge is-unavailable">
                                  尚未開放
                                </span>
                              ) : null}
                            </div>
                            {isSelected ? <SiteIcon name="check" size={16} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Dynamic Metrics according to each admission district */}
              <div className="stitch-stats-group">
                <div className="stitch-stat-chip">
                  <span className="stitch-stat-label">公立高中職</span>
                  <span className="stitch-stat-num">{publicCount}</span>
                </div>
                <div className="stitch-stat-chip">
                  <span className="stitch-stat-label">私立學校</span>
                  <span className="stitch-stat-num">{privateCount}</span>
                </div>
                <div className="stitch-stat-chip">
                  <span className="stitch-stat-label">技術型/五專</span>
                  <span className="stitch-stat-num">{vocationalCount}</span>
                </div>
              </div>
            </div>

            <small className="stitch-district-note">
              依你的位置初步建議，如需調整可隨時切換
            </small>

            {region?.schoolDataStatus === "verifying" ? (
              <p className="sv-inline-empty" role="status">
                {region.name}資料驗證中，學校查詢尚未開放。
              </p>
            ) : null}
          </section>
        </div>
      </header>

      {/* Quick Navigation Shortcuts */}
      <div className="sv-container sv-shortcuts animate-fadeInUp delay-3">
        <Link href="#popular">
          <SiteIcon name="school" size={20} />
          <span>熱門學校</span>
        </Link>
        <Link href="#filters">
          <SiteIcon name="shield" size={20} />
          <span>學校類型</span>
        </Link>
        <Link href="#filters">
          <SiteIcon name="search" size={20} />
          <span>縣市</span>
        </Link>
        <Link href="#filters">
          <SiteIcon name="knowledge" size={20} />
          <span>科別</span>
        </Link>
        <button type="button" onClick={() => drawer.current?.showModal()}>
          <SiteIcon name="more" size={20} />
          <span>更多</span>
        </button>
      </div>

      {/* Popular Schools Section */}
      {!hasIntent && popularSchools.length > 0 ? (
        <section
          className="sv-container sv-popular-section stitch-popular-section animate-fadeInUp delay-3"
          id="popular"
        >
          <div className="sv-section-heading stitch-section-heading">
            <div>
              <h2>{regionName}熱門學校</h2>
              <p>從這裡開始探索目前資料範圍內的熱門學校推薦。</p>
            </div>
            <a href="#explore" className="stitch-explore-all-link">
              查看全部 <SiteIcon name="chevron-right" size={15} />
            </a>
          </div>
          <div className="sv-school-grid sv-popular-grid stitch-schools-grid">
            {popularSchools.map((school, i) => (
              <SchoolCard
                key={school.code}
                school={school}
                selected={compareCodes.includes(school.code)}
                onCompare={toggleCompare}
                compact
                index={i}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* All Schools Directory Section */}
      <section
        className="sv-container sv-explore-section stitch-directory-section animate-fadeInUp delay-4"
        id="explore"
      >
        <div className="stitch-directory-header">
          <div className="stitch-dir-header-left">
            <h2 className="stitch-dir-title">{regionName}學校</h2>
            <span className="stitch-count-badge">
              共 <strong>{result.length}</strong> 校
            </span>
          </div>

          <div className="stitch-dir-header-right">
            {/* Sort Dropdown */}
            <div className="stitch-sort-wrapper">
              <label htmlFor="school-sort" className="stitch-sort-label">
                排序方式
              </label>
              <div className="stitch-sort-select-box">
                <select
                  id="school-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="stitch-sort-select"
                >
                  <option value="name">學校名稱</option>
                  <option value="city">縣市排序</option>
                  <option value="ownership">公私立排序</option>
                </select>
                <SiteIcon name="chevron-down" size={14} className="stitch-sort-arrow" />
              </div>
            </div>

            {/* View Switcher: Grid vs List */}
            <div className="stitch-view-switcher" role="group" aria-label="檢視切換">
              <button
                type="button"
                aria-label="卡片網格檢視"
                className={`stitch-view-btn ${viewMode === "grid" ? "is-active" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="清單列表檢視"
                className={`stitch-view-btn ${viewMode === "list" ? "is-active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>

            {/* Direct Tool Links */}
            <div className="stitch-tool-links">
              <Link
                href={`/schools/map?district=${district}`}
                className="stitch-tool-link"
                title="在地圖上瀏覽本區學校"
              >
                <SiteIcon name="route" size={15} />
                <span>學校地圖</span>
              </Link>
              <Link
                href="/schools/compare"
                className="stitch-tool-link"
                title="開啟多校比較工具"
              >
                <SiteIcon name="compare" size={15} />
                <span>學校比較</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Inline Filters Bar anchor */}
        <div className="sv-filter-row" id="filters" style={{ display: "none" }}>
          <button type="button" onClick={() => drawer.current?.showModal()}>
            <SiteIcon name="shield" size={17} />
            篩選條件{active ? ` (${active})` : ""}
          </button>
        </div>

        {/* Results Presentation */}
        {result.length ? (
          <div
            className={
              viewMode === "grid"
                ? "sv-school-grid stitch-schools-grid"
                : "stitch-schools-list"
            }
          >
            {result.slice(0, 36).map((school, i) => (
              <SchoolCard
                key={school.code}
                school={school}
                selected={compareCodes.includes(school.code)}
                onCompare={toggleCompare}
                viewMode={viewMode}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="sv-empty">
            <h2>找不到符合條件的學校</h2>
            <p>試試較短的關鍵字，或減少篩選條件。</p>
            <button
              className="sv-button stitch-cta-button"
              type="button"
              onClick={() => {
                setQueryInput("");
                clear();
              }}
            >
              重新搜尋
            </button>
          </div>
        )}
      </section>

      <p className="sv-data-note">
        學校基本資料可先瀏覽；招生、交通與住宿資訊依學校與資料來源分別顯示，尚未提供的欄位不會讓學校從結果消失。
      </p>

      {/* Floating Comparison Drawer */}
      {compareCodes.length ? (
        <div className="sv-compare-bar stitch-floating-drawer animate-fadeInUp">
          <div className="stitch-compare-status">
            <span className="stitch-compare-icon-wrap">
              <SiteIcon name="compare" size={18} />
            </span>
            <span>
              已選 <strong>{compareCodes.length}</strong> / 4 所學校
            </span>
          </div>
          <div className="stitch-compare-actions">
            <button
              type="button"
              className="stitch-clear-compare-btn"
              onClick={() => setCompareCodes([])}
            >
              清空
            </button>
            <Link
              href={`/schools/compare?schools=${compareCodes.join(",")}`}
              className="stitch-go-compare-btn"
            >
              <span>開始比較</span>
              <SiteIcon name="chevron-right" size={15} />
            </Link>
          </div>
        </div>
      ) : null}

      {/* Advanced Filter Modal / Drawer */}
      <dialog ref={drawer} className="sv-drawer">
        <div className="sv-drawer-head">
          <strong>調整搜尋條件</strong>
          <button
            type="button"
            onClick={() => drawer.current?.close()}
            aria-label="關閉更多篩選"
          >
            <SiteIcon name="close" size={18} />
          </button>
        </div>
        <FilterPanel
          prefix="modal"
          schools={scopedSchools}
          filters={filters}
          update={update}
          clear={clear}
        />
        <button
          className="sv-button sv-primary stitch-search-submit-btn"
          style={{ width: "100%", justifyContent: "center" }}
          type="button"
          onClick={() => drawer.current?.close()}
        >
          查看 {result.length} 所學校
        </button>
      </dialog>
    </div>
  );
}
