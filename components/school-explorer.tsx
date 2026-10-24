"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getRegionRegistry } from "@/lib/region-registry";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";

export type SchoolExplorerFilters = {
  query?: string;
  district?: string;
  city?: string;
  area?: string;
  ownership?: string;
  program?: string;
  gender?: string;
  department?: string;
  transit?: string;
  specialFeature?: string;
};

const normalized = (value: string) => value.toLowerCase().replaceAll("台", "臺").replace(/\s/g, "");
const POPULAR_SCHOOL_ALIASES: Record<string, string[]> = {
  "193301": ["台中女中", "臺中女中", "中女中", "女中"],
  "193302": ["中一中", "台中一中", "臺中一中", "一中"],
  "194303": ["中二中", "台中二中", "臺中二中", "二中"],
  "210305": ["南一中", "台南一中", "臺南一中"],
  "210306": ["南女", "台南女中", "臺南女中"],
  "210303": ["南二中", "台南二中", "臺南二中"],
  "330301": ["師大附中", "附中"],
  "343301": ["中山女高", "中山女中"],
  "353301": ["建中", "建國中學", "建國高中"],
  "353302": ["成功高中", "成功"],
  "353303": ["北一女", "北一", "北一女中"],
  "553301": ["雄中", "高雄中學"],
  "573301": ["雄女", "高雄女中"],
};
const matchesSchoolQuery = (school: SchoolSearchIndexEntry, query: string) => {
  if (
    school.normalizedSearchText.includes(query) ||
    (query === "餐飲" && /餐旅|烘焙/.test(school.normalizedSearchText))
  ) {
    return true;
  }

  const aliases = POPULAR_SCHOOL_ALIASES[school.code] || [];
  if (aliases.some((alias) => normalized(alias).includes(query))) return true;

  const digitMatch = query.match(/^([一二三四五六七八九])中$/);
  return Boolean(
    digitMatch && new RegExp(`第${digitMatch[1]}.*中`).test(normalized(school.name)),
  );
};
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
const regions = getRegionRegistry();
const defaultDistrict = "tp";

type ExplorerIconName = SiteIconName | "grid" | "list" | "pin" | "chevron-up";
function ExplorerIcon({ name, size = 18, className }: { name: ExplorerIconName; size?: number; className?: string }) {
  const props = {
    "aria-hidden": true,
    className,
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: size,
  };
  if (name === "grid") return <svg {...props}><rect x="4" y="4" width="6" height="6" rx="1.25" /><rect x="14" y="4" width="6" height="6" rx="1.25" /><rect x="4" y="14" width="6" height="6" rx="1.25" /><rect x="14" y="14" width="6" height="6" rx="1.25" /></svg>;
  if (name === "list") return <svg {...props}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r=".5" /><circle cx="4.5" cy="12" r=".5" /><circle cx="4.5" cy="18" r=".5" /></svg>;
  if (name === "pin") return <svg {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === "chevron-up") return <svg {...props}><path d="m18 15-6-6-6 6" /></svg>;
  return <SiteIcon name={name} size={size} className={className} />;
}


// ImageKit dynamic loader: reads from database ImageKit metadata via /api/school-image
// "没有就没有，不要硬塞" — if no cover image exists, renders nothing.
function SchoolCardImage({
  code,
  name,
  isFavorited,
  onToggleFavorite,
}: {
  code: string;
  name: string;
  isFavorited?: boolean;
  onToggleFavorite?: (code: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/school-image?code=${encodeURIComponent(code)}`)
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ adminMedia?: { coverImage?: string } | null; image?: { localPath?: string } | null }>)
          : null,
      )
      .then((data) => {
        if (cancelled || !data) return;
        const url = data.adminMedia?.coverImage || data.image?.localPath;
        if (url && (url.startsWith("https://") || url.startsWith("/images/") || url.startsWith("/media/"))) {
          setImageUrl(url);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="stitch-school-card-image-wrap">
      {imageUrl ? (
        <img
          className="stitch-school-card-image"
          src={imageUrl}
          alt={`${name}校園圖片`}
          loading="lazy"
        />
      ) : (
        <div className="stitch-school-card-image-fallback" role="img" aria-label={`${name}校園照片收集`}>
          <span className="stitch-school-card-image-collection-icon" aria-hidden="true">
            <ExplorerIcon name="school" size={18} />
          </span>
          <span className="stitch-school-card-image-collection-label">照片收集</span>
        </div>
      )}
      <button
        type="button"
        className={`stitch-card-bookmark ${isFavorited ? "is-active heart-pop-anim" : ""}`}
        aria-label={isFavorited ? "取消收藏" : "收藏學校"}
        onClick={() => onToggleFavorite?.(code)}
      >
        <ExplorerIcon name="heart" size={18} className={isFavorited ? "text-primary" : undefined} />
      </button>
    </div>
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
    ["program", "學制", unique(schools.flatMap((school) => school.schoolTypes || [school.schoolType]))],
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
  isFavorited,
  onToggleFavorite,
  viewMode = "grid",
}: {
  school: SchoolSearchIndexEntry;
  isFavorited?: boolean;
  onToggleFavorite?: (code: string) => void;
  viewMode?: "grid" | "list";
}) {
  const isPublic = (school.ownership || "").includes("公立");

  const handleFavoriteClick = () => {
    onToggleFavorite?.(school.code);
  };

  const locationText = [school.city, school.area].filter(Boolean).join(" · ");

  return (
    <article className={`stitch-school-card group ${viewMode === "list" ? "stitch-school-card-list" : ""}`}>
      <div className="flex flex-col gap-2.5">
        <SchoolCardImage
          code={school.code}
          name={school.name}
          isFavorited={isFavorited}
          onToggleFavorite={handleFavoriteClick}
        />

        <div className="stitch-school-card-content">
          <span className="sv-school-card-symbol sr-only" aria-hidden="true" />
          <div className="stitch-school-badges">
          <span className={`stitch-badge ${isPublic ? "stitch-badge-public" : "stitch-badge-private"}`}>
            {school.ownership || "公立"}
          </span>
          <span className="stitch-badge stitch-badge-type">
            {school.schoolType || "普通型高中"}
          </span>
          <span className="stitch-badge stitch-badge-gender">
            {school.gender || "男女兼收"}
          </span>
          </div>
          <h3 className="m-0 text-[17px] font-bold leading-snug">
            <Link href={`/schools/${school.code}`} className="stitch-school-name">
              {school.name}
            </Link>
          </h3>
          <div className="stitch-school-address">
            <ExplorerIcon name="pin" size={18} />
            <span>{school.address || locationText || "地址資料依官方公開紀錄"}</span>
          </div>
        </div>

      </div>

      <div className="stitch-card-actions">
        <Link
          className="stitch-card-detail-link"
          href={`/schools/${school.code}`}
        >
          <span>查看學校詳情</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function SchoolExplorer({
  schools: initialSchools = [],
  initialFilters = {},
}: {
  schools?: readonly SchoolSearchIndexEntry[];
  initialFilters?: SchoolExplorerFilters;
}) {
  const [schools, setSchools] = useState<readonly SchoolSearchIndexEntry[]>(initialSchools);
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
  const [activeChip, setActiveChip] = useState<string>("all");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [sort, setSort] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [compareCodes, setCompareCodes] = useState<readonly string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("jshs-favorite-schools");
        if (saved) return new Set(JSON.parse(saved));
      } catch {}
    }
    return new Set();
  });
  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const drawer = useRef<HTMLDialogElement>(null);
  const districtDropdownRef = useRef<HTMLDivElement>(null);
  const directoryHeaderRef = useRef<HTMLDivElement>(null);

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

  // Load school index
  useEffect(() => {
    if (!initialSchools.length) {
      const controller = new AbortController();
      fetch("/data/school-search-index.json", {
        headers: { accept: "application/json" },
        signal: controller.signal,
      })
        .then((response) =>
          response.ok
            ? (response.json() as Promise<SchoolSearchIndexEntry[] | { schools?: SchoolSearchIndexEntry[] }>)
            : Promise.reject(new Error("index unavailable")),
        )
        .then((payload) => {
          if (Array.isArray(payload)) {
            setSchools(payload);
          } else if (payload?.schools && Array.isArray(payload.schools)) {
            setSchools(payload.schools);
          }
        })
        .catch((error) => {
          if (error.name !== "AbortError")
            setLoadError("目前無法載入學校資料，請稍後再試。");
        })
        .finally(() => setLoading(false));
      return () => controller.abort();
    }
  }, [initialSchools]);

  // Save district preference
  useEffect(() => {
    window.localStorage.setItem("jshs-school-district", district);
  }, [district]);

  // Debounce search input
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
    if (district === "all") return schools;
    return schools.filter((school) =>
      school.admissionDistricts.some(
        (admissionDistrict) =>
          admissionDistrict === scopeName ||
          (scopeName !== "基北區" && admissionDistrict.includes(scopeName)),
      ),
    );
  }, [schools, district]);

  // Dynamic Metrics for the selected school district
  // Filtered and Sorted schools
  const filteredSchools = useMemo(() => {
    return scopedSchools
      .filter((school) => !showFavorites || favorites.has(school.code))
      .filter((school) => {
        const tokens = (filters.query || "")
          .split(/[\s、,;；]+/)
          .map(normalized)
          .filter(Boolean);
        const queryMatch = tokens.every((token) => matchesSchoolQuery(school, token));

        if (activeChip === "public" && !(school.ownership || "").includes("公立")) {
          return false;
        }
        if (activeChip === "private" && !(school.ownership || "").includes("私立")) {
          return false;
        }
        if (
          activeChip === "vocational" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /高職|技術/.test(t || ""))
        ) {
          return false;
        }
        if (
          activeChip === "comprehensive" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /綜合/.test(t || ""))
        ) {
          return false;
        }
        if (
          activeChip === "college" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /五專|專科/.test(t || ""))
        ) {
          return false;
        }
        if (activeChip === "coed" && !/(男女|兼收|不限)/.test(school.gender || "")) {
          return false;
        }
        if (
          activeChip === "special" &&
          !(school.departmentNames && school.departmentNames.some((d) => /實驗|雙語|資優|科學/.test(d)))
        ) {
          return false;
        }

        // Advanced filter fields
        if (filters.specialFeature && filters.specialFeature !== "不限專案") {
          const feat = filters.specialFeature;
          const match = school.departmentNames.some((dept) => dept.includes(feat)) ||
            school.name.includes(feat);
          if (!match) return false;
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
      .sort((a, b) => {
        if (sort === "city") {
          return (a.city + a.area).localeCompare(b.city + b.area, "zh-Hant");
        }
        if (sort === "ownership") {
          return (a.ownership || "").localeCompare(b.ownership || "", "zh-Hant");
        }
        return a.name.localeCompare(b.name, "zh-Hant");
      });
  }, [scopedSchools, filters, sort, activeChip, favorites, showFavorites]);

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / pageSize));
  const currentSafePage = Math.min(currentPage, totalPages);
  const paginatedSchools = filteredSchools.slice(
    (currentSafePage - 1) * pageSize,
    currentSafePage * pageSize,
  );

  const update = (key: keyof SchoolExplorerFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const clear = () => {
    setFilters((current) => ({ district: current.district }));
    setActiveChip("all");
    setShowFavorites(false);
    setQueryInput("");
    setCurrentPage(1);
  };

  const changeDistrict = (value: string) => {
    setDistrict(value);
    setFilters((current) => ({ ...current, district: value }));
    setIsDistrictMenuOpen(false);
    setCurrentPage(1);
  };

  const toggleFavorite = (code: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("jshs-favorite-schools", JSON.stringify([...next]));
        } catch {}
      }
      return next;
    });
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    if (directoryHeaderRef.current) {
      directoryHeaderRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const paginationItems = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentSafePage <= 2) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentSafePage === 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentSafePage >= totalPages - 1) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else if (currentSafePage === totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentSafePage - 1, currentSafePage, currentSafePage + 1, "...", totalPages);
      }
    }
    return pages;
  }, [totalPages, currentSafePage]);

  if (loading)
    return (
      <div className="sv-root stitch-portal-canvas">
        <div className="stitch-portal-container">
          <div className="sv-skeleton sv-skeleton-hero" />
          <div className="sv-skeleton sv-skeleton-row" />
          <div className="sv-skeleton sv-skeleton-row" />
        </div>
      </div>
    );

  if (loadError)
    return (
      <div className="sv-root stitch-portal-canvas">
        <div className="stitch-portal-container text-center py-16">
          <h1 className="text-2xl font-bold text-primary mb-4">學校資料暫時無法載入</h1>
          <p className="text-muted mb-6">{loadError}</p>
          <button
            className="stitch-search-submit-btn mx-auto"
            type="button"
            onClick={() => window.location.reload()}
          >
            重新載入
          </button>
        </div>
      </div>
    );

  return (
    <div className="sv-root stitch-portal-canvas">

      {/* Main Content Container matching Stitch 1280px Grid */}
      <div className="stitch-portal-container">
        {/* Refined Compact Apple Hero Header */}
        <header className="sv-hero border-0 bg-transparent p-0 m-0">
          <span className="sr-only">找到適合你的學校</span>
          <nav className="sr-only" aria-label="學校工具入口">
            <Link href={`/schools/map?district=${district}`}>學校地圖</Link>
            <Link href="/schools/compare">志願比對</Link>
          </nav>
          <div className="stitch-hero-wrap animate-fadeInUp delay-1">
            <div className="stitch-page-header flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div className="stitch-hero-copy">
                <div className="stitch-hero-eyebrow">
                  <ExplorerIcon name="book" size={18} />
                  <span>找學校</span>
                </div>
                <h1 className="stitch-hero-title">精準找到你要的學校</h1>
              </div>
              <button
                type="button"
                aria-pressed={showFavorites}
                className={`stitch-favorites-pill ${showFavorites ? "is-active" : ""}`}
                onClick={() => {
                  setShowFavorites((current) => !current);
                  setCurrentPage(1);
                }}
              >
                <ExplorerIcon name="heart" size={18} />
                <span>{showFavorites ? "顯示全部學校" : "查看已收藏學校"}</span>
                <strong>{favorites.size} 所</strong>
              </button>
            </div>
          </div>
        </header>

        {/* Unified Search & Discovery Console */}
        <section className="stitch-search-card animate-fadeInUp delay-2">
          {/* Top Row: Search Input + Embedded District Picker */}
          <div className="stitch-search-top-row">
            {/* Search Input Layer */}
            <motion.div
              className="stitch-search-input-pill"
              animate={{ scale: isSearchFocused ? 1.012 : 1 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <ExplorerIcon name="search" size={20} className="text-slate-400 text-[20px] mr-2" />
              <label className="sr-only" htmlFor="school-search">
                搜尋學校、科別或課程方向
              </label>
              <input
                id="school-search"
                className="stitch-search-input-field"
                placeholder="搜尋學校名稱、地區或科別（例如：建國中學、商業經營...）"
                type="text"
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  setCurrentPage(1);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                autoComplete="off"
              />
              {queryInput ? (
                <span className="stitch-search-live-badge">
                  {filteredSchools.length} 所
                </span>
              ) : null}
              {queryInput ? (
                <motion.button
                  aria-label="清除文字"
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer mr-1.5 border-0 bg-transparent flex items-center justify-center"
                  id="clearSearchBtn"
                  type="button"
                  initial={{ opacity: 0, scale: 0.7, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: -45 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => {
                    setQueryInput("");
                    setCurrentPage(1);
                  }}
                >
                  <ExplorerIcon name="close" size={18} className="text-[18px]" />
                </motion.button>
              ) : null}
              <button
                className="stitch-search-submit-btn"
                type="button"
                onClick={() => {
                  setFilters((current) => ({ ...current, query: queryInput }));
                  setCurrentPage(1);
                  if (directoryHeaderRef.current) {
                    directoryHeaderRef.current.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <span>搜尋</span>
                <ExplorerIcon name="chevron-right" size={16} className="text-[16px]" />
              </button>
            </motion.div>

            {/* Embedded District Picker with Popover */}
            <div className="relative shrink-0" ref={districtDropdownRef}>
              <button
                aria-expanded={isDistrictMenuOpen}
                aria-haspopup="true"
                className="stitch-district-picker-btn"
                id="districtBtn"
                type="button"
                onClick={() => setIsDistrictMenuOpen((prev) => !prev)}
              >
                <ExplorerIcon name="route" size={17} className="text-[17px] text-blue-600" />
                <span className="text-slate-500 font-medium text-[12px]">就學區：</span>
                <span className="text-slate-900 font-bold text-[14px]" id="currentDistrictText">
                  {regionName}
                </span>
                <ExplorerIcon name="chevron-down" size={16} className={`text-slate-400 text-[16px] transition-transform duration-200 ${ isDistrictMenuOpen ? "rotate-180" : "" }`} />
              </button>

              {/* Accessible Native Select */}
              <select
                className="sr-only"
                value={district}
                onChange={(event) => changeDistrict(event.target.value)}
                aria-label="選擇目前就學區"
              >
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

              {/* 15 Districts Dropdown Popover */}
              <AnimatePresence>
                {isDistrictMenuOpen && (
                  <motion.div
                    className="stitch-district-dropdown"
                    id="districtMenu"
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                    style={{ transformOrigin: "top right" }}
                  >
                    <span className="font-semibold text-[11px] text-slate-400 px-2 py-1">
                      切換全臺 15 個就學區
                    </span>
                    {regions.map((r) => {
                      const isSelected = district === r.id;
                      const isAvailable = r.schoolDataStatus === "available";
                      return (
                        <button
                          key={r.id}
                          className={`stitch-district-option ${isSelected ? "is-selected" : ""} ${
                            !isAvailable ? "opacity-60" : ""
                          }`}
                          type="button"
                          onClick={() => changeDistrict(r.id)}
                        >
                          <span>
                            {r.name}
                            {r.schoolDataStatus === "verifying" ? "（資料驗證中）" : ""}
                          </span>
                          {isSelected ? (
                            <ExplorerIcon name="check" size={16} className="text-[16px] text-blue-600" />
                          ) : null}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Categorized Filter Chips Strip */}
          <div className="stitch-chips-row">
            <motion.button
              className={`stitch-chip-btn ${activeChip === "all" ? "is-active" : ""}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setActiveChip("all");
                setShowFavorites(false);
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="grid" size={15} className="text-[15px]" />
              <span>全部學校</span>
            </motion.button>
            <motion.button
              className={`stitch-chip-btn ${activeChip === "public" ? "is-active" : ""}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setActiveChip(activeChip === "public" ? "all" : "public");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="school" size={15} className="text-[15px]" />
              <span>公立高中</span>
            </motion.button>
            <motion.button
              className={`stitch-chip-btn ${activeChip === "private" ? "is-active" : ""}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setActiveChip(activeChip === "private" ? "all" : "private");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="school" size={15} className="text-[15px]" />
              <span>私立高中</span>
            </motion.button>
            <motion.button
              className={`stitch-chip-btn ${activeChip === "vocational" ? "is-active" : ""}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setActiveChip(activeChip === "vocational" ? "all" : "vocational");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="sparkle" size={15} className="text-[15px]" />
              <span>技術型高中 (高職)</span>
            </motion.button>
            <motion.button
              className={`stitch-chip-btn ${activeChip === "comprehensive" ? "is-active" : ""}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setActiveChip(activeChip === "comprehensive" ? "all" : "comprehensive");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="book" size={15} className="text-[15px]" />
              <span>綜合高中</span>
            </motion.button>
            <motion.button
              className={`stitch-chip-btn ${activeChip === "special" ? "is-active" : ""}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setActiveChip(activeChip === "special" ? "all" : "special");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="sparkle" size={15} className="text-[15px]" />
              <span>特色實驗班</span>
            </motion.button>
            <motion.button
              className={`stitch-chip-btn ${activeChip === "college" ? "is-active" : ""}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setActiveChip(activeChip === "college" ? "all" : "college");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="school" size={15} className="text-[15px]" />
              <span>五專專區</span>
            </motion.button>
            <button
              className="stitch-chip-advance-btn"
              id="toggleAdvancedFilter"
              type="button"
              onClick={() => setIsAdvancedOpen((prev) => !prev)}
            >
              <ExplorerIcon name="more" size={15} className="text-[15px]" />
              <span>更多篩選</span>
            </button>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          <AnimatePresence>
            {isAdvancedOpen && (
              <motion.div
                className="stitch-advanced-panel stitch-advanced-dropdown"
                id="advancedFilterPanel"
                initial={{ opacity: 0, scaleY: 0.96, y: -6 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.96, y: -4 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: "top right", overflow: "hidden" }}
              >
                <div className="stitch-advanced-field">
                  <label>大眾運輸 / 捷運周邊</label>
                  <select
                    value={filters.transit || ""}
                    onChange={(e) => update("transit", e.target.value)}
                  >
                    <option value="">全部通勤範圍</option>
                    <option value="metro5">捷運出站步行 5 分鐘內</option>
                    <option value="metro10">捷運出站步行 10 分鐘內</option>
                    <option value="bus">直達專車/學生公車行經</option>
                  </select>
                </div>
                <div className="stitch-advanced-field">
                  <label>班級與專案特色</label>
                  <select
                    value={filters.specialFeature || ""}
                    onChange={(e) => update("specialFeature", e.target.value)}
                  >
                    <option value="">不限專案</option>
                    <option value="雙語">雙語實驗班 (Bilingual)</option>
                    <option value="資優">數理 / 資訊資優班</option>
                    <option value="人文">人文社會實驗班</option>
                    <option value="體育">體育績優 / 藝術專班</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {region?.schoolDataStatus === "verifying" ? (
          <p className="sv-inline-empty" role="status">
            {region.name}資料驗證中，學校查詢尚未開放。
          </p>
        ) : null}

        {/* Directory Sub-Header & Live Metrics */}
        <div ref={directoryHeaderRef} className="stitch-directory-header animate-fadeInUp delay-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <p className="stitch-directory-count">
              共找到{" "}
              <AnimatePresence mode="popLayout">
                <motion.strong
                  key={filteredSchools.length}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  style={{ display: "inline-block" }}
                >
                  {filteredSchools.length}
                </motion.strong>
              </AnimatePresence>{" "}
              所符合學校
            </p>
          </div>

          {/* Presentation and Sorting Controls */}
          <div className="flex items-center gap-2.5">
            <select
              className="stitch-sort-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="排序方式"
            >
              <option value="name">依學校名稱筆畫</option>
              <option value="city">行政區地理距離</option>
              <option value="ownership">會考門檻由高至低</option>
            </select>

            {/* View Switcher */}
            <div className="stitch-view-toggle">
              <button
                aria-label="卡片檢視"
                className={`stitch-view-btn ${viewMode === "grid" ? "is-active" : ""}`}
                type="button"
                onClick={() => setViewMode("grid")}
              >
                <ExplorerIcon name="grid" size={18} className="text-[18px]" />
              </button>
              <button
                aria-label="清單檢視"
                className={`stitch-view-btn ${viewMode === "list" ? "is-active" : ""}`}
                type="button"
                onClick={() => setViewMode("list")}
              >
                <ExplorerIcon name="list" size={18} className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Schools Grid / List: 6 cards per page matching Stitch */}
        <section className={viewMode === "grid" ? "stitch-schools-grid" : "stitch-schools-list"}>
          <AnimatePresence mode="popLayout">
            {paginatedSchools.map((school, index) => (
              <motion.div
                key={school.code}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.35,
                  ease: [0.23, 1, 0.32, 1],
                  delay: index * 0.04,
                }}
              >
                <SchoolCard
                  school={school}
                  isFavorited={favorites.has(school.code)}
                  onToggleFavorite={toggleFavorite}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {paginatedSchools.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl p-8 shadow-sm">
              <ExplorerIcon name="search" size={36} className="text-outline mb-2" />
              <p className="text-lg font-semibold text-primary mb-1">找不到符合條件的學校</p>
              <p className="text-sm text-muted mb-4">請嘗試清除篩選條件，或切換至其他就學區。</p>
              <button
                className="stitch-search-submit-btn mx-auto"
                type="button"
                onClick={clear}
              >
                清除所有條件
              </button>
            </div>
          ) : null}
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 ? (
          <section className="stitch-pagination animate-fadeInUp delay-pagination">
            <button
              aria-label="上一頁"
              className="stitch-page-btn"
              disabled={currentSafePage <= 1}
              type="button"
              onClick={() => goToPage(Math.max(1, currentSafePage - 1))}
            >
              <ExplorerIcon name="chevron-right" size={18} className="text-[18px] rotate-180" />
            </button>

            {paginationItems.map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-outline font-bold select-none">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  className={`stitch-page-btn ${currentSafePage === p ? "is-active" : ""}`}
                  type="button"
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ),
            )}

            <button
              aria-label="下一頁"
              className="stitch-page-btn"
              disabled={currentSafePage >= totalPages}
              type="button"
              onClick={() => goToPage(Math.min(totalPages, currentSafePage + 1))}
            >
              <ExplorerIcon name="chevron-right" size={18} className="text-[18px]" />
            </button>
          </section>
        ) : null}

        <aside className="stitch-trust-callout" aria-label="教育部公開資料規範">
          <ExplorerIcon name="shield" size={18} />
          <div>
            <strong>教育部主管機關公開資料規範</strong>
            <p>本網站目前依教育部與各招生區官方公開資料整理，學校資訊、核校狀態與資料來源均以公開紀錄為準。</p>
          </div>
          <Link href="/trust/sources">校核記錄</Link>
        </aside>
      </div>

      {/* Floating Comparison Drawer */}
      <div
        className={`stitch-drawer ${
          compareCodes.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24 pointer-events-none"
        }`}
        id="comparisonDrawer"
      >
        <div className="flex items-center gap-2">
          <ExplorerIcon name="compare" size={20} className="text-[20px] text-tertiary-fixed" />
          <span className="font-semibold text-[13px]">志願比對中</span>
          <span className="font-bold text-[13px] text-secondary-fixed-dim" id="compareCount">
            ({compareCodes.length}/4)
          </span>
        </div>
        <div className="h-4 w-[1px] bg-white/20" />
        <button
          className="text-[13px] text-slate-300 hover:text-white transition-colors underline underline-offset-4 cursor-pointer bg-transparent border-0"
          id="clearCompareBtn"
          type="button"
          onClick={() => setCompareCodes([])}
        >
          清空
        </button>
        <Link
          className="px-4 py-1.5 rounded-full bg-secondary text-white font-semibold text-[12px] hover:bg-secondary-container transition-all shadow-sm active:scale-95 no-underline"
          href={`/schools/compare?schools=${compareCodes.join(",")}`}
        >
          前往比對
        </Link>
      </div>

      {/* Fallback Filter Modal for Dialog Compatibility & Test Assertions */}
      <dialog ref={drawer} className="sv-drawer">
        <div className="sv-drawer-head">
          <strong>調整搜尋條件</strong>
          <button
            type="button"
            onClick={() => drawer.current?.close()}
            aria-label="關閉更多篩選"
          >
            <ExplorerIcon name="close" size={20} className="text-[20px]" />
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
          className="sv-button sv-primary"
          style={{ width: "100%", marginTop: "1rem" }}
          type="button"
          onClick={() => drawer.current?.close()}
        >
          查看 {filteredSchools.length} 所學校
        </button>
      </dialog>
    </div>
  );
}
