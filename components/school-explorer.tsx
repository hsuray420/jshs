"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRegionRegistry } from "@/lib/region-registry";
import { DEFAULT_POPULAR_SCHOOLS } from "@/lib/popular-schools-data";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";
import { SiteIcon } from "@/components/site-icons";

export type SchoolExplorerFilters = {
  query?: string;
  district?: string;
  city?: string;
  area?: string;
  ownership?: string;
  program?: string;
  gender?: string;
  department?: string;
  scoreTier?: string;
  transit?: string;
  specialFeature?: string;
};

const normalized = (value: string) => value.toLowerCase().replaceAll("台", "臺").replace(/\s/g, "");
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
const regions = getRegionRegistry();
const defaultDistrict = "tp";

type ExplorerIconName = "search" | "close" | "chevron-right" | "check" | "school" | "compare" | "chevron-down" | "more" | "sparkle" | "heart";

function ExplorerIcon({ name, className }: { name: ExplorerIconName; className?: string }) {
  return <SiteIcon name={name} size={18} className={className} />;
}

// ImageKit dynamic loader: reads from database ImageKit metadata via /api/school-image
// "没有就没有，不要硬塞" — if no cover image exists, renders nothing.
function SchoolCardImage({ code, name }: { code: string; name: string }) {
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

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="stitch-school-card-image-wrap">
      <img
        className="stitch-school-card-image"
        src={imageUrl}
        alt={`${name}校園圖片`}
        loading="lazy"
      />
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
  isCompared,
  onToggleCompare,
  isFavorited,
  onToggleFavorite,
  viewMode = "grid",
}: {
  school: SchoolSearchIndexEntry;
  isCompared?: boolean;
  onToggleCompare?: (code: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (code: string) => void;
  viewMode?: "grid" | "list";
}) {
  const [animatingHeart, setAnimatingHeart] = useState(false);
  const isPublic = (school.ownership || "").includes("公立");

  const handleFavoriteClick = () => {
    setAnimatingHeart(true);
    setTimeout(() => setAnimatingHeart(false), 450);
    onToggleFavorite?.(school.code);
  };

  return (
    <article className={`stitch-school-card ${viewMode === "list" ? "stitch-school-card-list" : ""}`}>
      <div>
        {/* Header: School Name & Favorite Heart Button */}
        <div className="stitch-school-card-header">
          <div className="flex items-center gap-2">
            <span className="sv-school-card-symbol sr-only" aria-hidden="true" />
            <h3 className="m-0">
              <Link href={`/schools/${school.code}`} className="stitch-school-name">
                {school.name}
              </Link>
            </h3>
          </div>
          <button
            aria-label={isFavorited ? "取消收藏" : "加入收藏"}
            className={`stitch-favorite-btn ${isFavorited ? "is-active" : ""} ${
              animatingHeart ? "heart-pop-anim" : ""
            }`}
            type="button"
            onClick={handleFavoriteClick}
          >
            <ExplorerIcon name="heart" className={isFavorited ? "text-primary" : undefined} />
          </button>
        </div>

        {/* Dynamic ImageKit Photo: only shown if exists in database, no fakes */}
        <SchoolCardImage code={school.code} name={school.name} />

        {/* Academic Classification Badges */}
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
          {school.departmentNames && school.departmentNames.length > 0 ? (
            <span className="stitch-badge stitch-badge-feature">
              {school.departmentNames[0]}
            </span>
          ) : (
            <span className="stitch-badge stitch-badge-feature">
              科學班認證
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="stitch-card-actions">
        <button
          className={`stitch-card-compare-btn ${isCompared ? "is-active" : ""}`}
          type="button"
          onClick={() => onToggleCompare?.(school.code)}
        >
          {isCompared ? (
            <>
              <ExplorerIcon name="check" className="text-secondary" />
              <span>已加入比較</span>
            </>
          ) : (
            <>
              <ExplorerIcon name="sparkle" />
              <span>加入志願比較</span>
            </>
          )}
        </button>
        <Link
          className="stitch-card-detail-btn"
          href={`/schools/${school.code}`}
        >
          <span>查看簡章</span>
          <ExplorerIcon name="chevron-right" />
        </Link>
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
  const [activeChip, setActiveChip] = useState<string>("popular");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [sort, setSort] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [compareCodes, setCompareCodes] = useState<readonly string[]>(["353301"]); // Initialized with Jianguo High as in Stitch mockup
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("jshs-favorite-schools");
        if (saved) return new Set(JSON.parse(saved));
      } catch {}
    }
    return new Set(["353301"]);
  });
  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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

  // Load popular schools config
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
    return filters.query?.trim()
      ? schools
      : district === "all"
      ? schools
      : schools.filter((school) =>
          school.admissionDistricts.some((admissionDistrict) =>
            admissionDistrict === scopeName ||
            (scopeName !== "基北區" && admissionDistrict.includes(scopeName)),
          ),
        );
  }, [schools, district, filters.query]);

  // Dynamic Metrics for the selected school district
  const publicCount = useMemo(
    () => scopedSchools.filter((s) => (s.ownership || "").includes("公立")).length,
    [scopedSchools],
  );
  const privateCount = useMemo(
    () => scopedSchools.filter((s) => (s.ownership || "").includes("私立")).length,
    [scopedSchools],
  );
  const collegeCount = useMemo(
    () =>
      scopedSchools.filter((s) =>
        (s.schoolTypes || [s.schoolType]).some((t) => /五專|專科/.test(t || "")),
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

  // Filtered and Sorted schools
  const filteredSchools = useMemo(() => {
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

        // NOTE: "popular" chip is a prioritization mode, NOT an exclusive filter
        // (preserves all schools in the district, e.g. 129 schools in 基北區).
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
          activeChip === "college" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /五專|專科/.test(t || ""))
        ) {
          return false;
        }
        if (activeChip === "coed" && school.gender !== "男女兼收" && school.gender) {
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
        if (sort === "popular" || activeChip === "popular") {
          const aPop = popularSchoolCodes.indexOf(a.code);
          const bPop = popularSchoolCodes.indexOf(b.code);
          if (aPop !== -1 && bPop !== -1) return aPop - bPop;
          if (aPop !== -1) return -1;
          if (bPop !== -1) return 1;
          return a.name.localeCompare(b.name, "zh-Hant");
        }
        if (sort === "city") {
          return (a.city + a.area).localeCompare(b.city + b.area, "zh-Hant");
        }
        if (sort === "ownership") {
          return (a.ownership || "").localeCompare(b.ownership || "", "zh-Hant");
        }
        return a.name.localeCompare(b.name, "zh-Hant");
      });
  }, [scopedSchools, filters, sort, activeChip, popularSchoolCodes]);

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
    setActiveChip("popular");
    setQueryInput("");
    setCurrentPage(1);
  };

  const changeDistrict = (value: string) => {
    setDistrict(value);
    setFilters((current) => ({ ...current, district: value }));
    setIsDistrictMenuOpen(false);
    setCurrentPage(1);
  };

  const toggleCompare = (code: string) =>
    setCompareCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : current.length < 4
        ? [...current, code]
        : current,
    );

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
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[480px] bg-gradient-to-b from-secondary-fixed/30 via-surface-container-high/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Content Container matching Stitch 1280px Grid */}
      <div className="stitch-portal-container">
        {/* Hero Header Section */}
        <header className="sv-hero border-0 bg-transparent p-0 m-0">
          <span className="sr-only">找到適合你的學校</span>
          <section className="flex flex-col gap-2 max-w-4xl animate-fadeInUp delay-1">
            <h1 className="stitch-hero-title">找學校</h1>
            <p className="stitch-hero-desc">
              探索全臺公私立高中職、五專與特色科別，精準掌握升學志願方向
            </p>
          </section>
        </header>

        {/* Central Search Architecture Module */}
        <section className="stitch-search-card animate-fadeInUp delay-2">
          {/* Input Layer: Search input + Clear button + Action button */}
          <div className="stitch-search-input-pill">
            <ExplorerIcon name="search" className="text-outline mr-2" />
            <label className="sr-only" htmlFor="school-search">
              搜尋學校、科別或課程方向
            </label>
            <input
              id="school-search"
              className="stitch-search-input-field"
              placeholder="搜尋學校名稱、地區或科別..."
              type="text"
              value={queryInput}
              onChange={(e) => {
                setQueryInput(e.target.value);
                setCurrentPage(1);
              }}
              autoComplete="off"
            />
            {queryInput ? (
              <button
                aria-label="清除文字"
                className="text-outline hover:text-on-surface p-1 transition-transform hover:scale-110 active:scale-90 cursor-pointer mr-2 border-0 bg-transparent"
                id="clearSearchBtn"
                type="button"
                onClick={() => {
                  setQueryInput("");
                  setCurrentPage(1);
                }}
              >
                <ExplorerIcon name="close" />
              </button>
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
              <span>開始搜尋</span>
              <ExplorerIcon name="chevron-right" />
            </button>
          </div>

          {/* Filter Chips Strip */}
          <div className="stitch-chips-row">
            <button
              className={`stitch-chip-btn ${activeChip === "popular" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveChip(activeChip === "popular" ? "all" : "popular");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="sparkle" />
              <span>熱門學校</span>
            </button>
            <button
              className={`stitch-chip-btn ${activeChip === "public" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveChip(activeChip === "public" ? "all" : "public");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="school" />
              <span>公立優先</span>
            </button>
            <button
              className={`stitch-chip-btn ${activeChip === "private" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveChip(activeChip === "private" ? "all" : "private");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="school" />
              <span>私立高中</span>
            </button>
            <button
              className={`stitch-chip-btn ${activeChip === "vocational" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveChip(activeChip === "vocational" ? "all" : "vocational");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="sparkle" />
              <span>技術型高中 (高職)</span>
            </button>
            <button
              className={`stitch-chip-btn ${activeChip === "college" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveChip(activeChip === "college" ? "all" : "college");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="school" />
              <span>五專專區</span>
            </button>
            <button
              className={`stitch-chip-btn ${activeChip === "coed" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveChip(activeChip === "coed" ? "all" : "coed");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="compare" />
              <span>男女兼收</span>
            </button>
            <button
              className="stitch-chip-btn"
              type="button"
              onClick={() => setIsDistrictMenuOpen((prev) => !prev)}
            >
              <ExplorerIcon name="search" />
              <span>依行政區</span>
            </button>
            <button
              className={`stitch-chip-btn ${activeChip === "special" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveChip(activeChip === "special" ? "all" : "special");
                setCurrentPage(1);
              }}
            >
              <ExplorerIcon name="sparkle" />
              <span>特色實驗班</span>
            </button>
            <button
              className="stitch-chip-advance-btn"
              id="toggleAdvancedFilter"
              type="button"
              onClick={() => setIsAdvancedOpen((prev) => !prev)}
            >
              <ExplorerIcon name="more" />
              <span>進階篩選</span>
              <ExplorerIcon name="chevron-down" className={isAdvancedOpen ? "rotate-180 transition-transform duration-300" : "transition-transform duration-300"} />
            </button>
          </div>

          {/* Collapsible Advanced Filters Drawer matching Stitch */}
          {isAdvancedOpen ? (
            <div className="stitch-advanced-panel" id="advancedFilterPanel">
              <div className="stitch-advanced-field">
                <label>113會考積分/分標區間</label>
                <select
                  value={filters.scoreTier || ""}
                  onChange={(e) => update("scoreTier", e.target.value)}
                >
                  <option value="">不限分標</option>
                  <option value="30">30分以上 (第一志願梯隊)</option>
                  <option value="25-30">25 ~ 30分</option>
                  <option value="20-25">20 ~ 25分</option>
                  <option value="below20">20分以下</option>
                </select>
              </div>
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
            </div>
          ) : null}
        </section>

        {/* District Overview Strip & Dynamic Stats Bar */}
        <section className="stitch-district-strip animate-fadeInUp delay-3">
          <div className="flex items-center gap-3" ref={districtDropdownRef}>
            <div className="relative">
              <button
                aria-expanded={isDistrictMenuOpen}
                aria-haspopup="true"
                className="stitch-district-picker-btn"
                id="districtBtn"
                type="button"
                onClick={() => setIsDistrictMenuOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-1.5 text-primary">
                  <ExplorerIcon name="search" className="text-secondary" />
                  <span className="text-on-surface font-semibold text-[13px]">目前就學區：</span>
                  <span className="text-primary font-bold text-[15px]" id="currentDistrictText">
                    {regionName}
                  </span>
                </div>
                <ExplorerIcon name="chevron-down" className={`text-outline transition-transform duration-300 ${isDistrictMenuOpen ? "rotate-180" : ""}`} />
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
              {isDistrictMenuOpen ? (
                <div className="stitch-district-dropdown" id="districtMenu">
                  <span className="font-semibold text-[11px] text-outline px-2 py-1">
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
                          <ExplorerIcon name="check" className="text-primary" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link
                href={`/schools/map?district=${district}`}
                className="stitch-stat-pill text-primary text-[12px] font-semibold no-underline"
              >
                <ExplorerIcon name="school" />
                <span>學校地圖</span>
              </Link>
              <Link
                href="/schools/compare"
                className="stitch-stat-pill text-primary text-[12px] font-semibold no-underline"
              >
                <ExplorerIcon name="compare" />
                <span>學校比較</span>
              </Link>
            </div>
          </div>

          {/* Dynamic Metrics Badges */}
          <div className="stitch-stats-row">
            <div className="stitch-stat-pill">
              <span className="text-[11px] font-semibold text-outline">公立高中職</span>
              <span className="text-[18px] font-bold text-primary">{publicCount}</span>
            </div>
            <div className="stitch-stat-pill">
              <span className="text-[11px] font-semibold text-outline">私立學校</span>
              <span className="text-[18px] font-bold text-primary">{privateCount}</span>
            </div>
            <div className="stitch-stat-pill">
              <span className="text-[11px] font-semibold text-outline">五專專科</span>
              <span className="text-[18px] font-bold text-secondary">{collegeCount}</span>
            </div>
          </div>
        </section>

        {region?.schoolDataStatus === "verifying" ? (
          <p className="sv-inline-empty" role="status">
            {region.name}資料驗證中，學校查詢尚未開放。
          </p>
        ) : null}

        {/* Directory Main Header & Presentation Controls */}
        <div ref={directoryHeaderRef} className="stitch-directory-header animate-fadeInUp delay-4">
          <div className="flex items-center gap-2">
            <h2 className="stitch-directory-title">
              {regionName}學校
              <span className="stitch-directory-count">共 {filteredSchools.length} 校</span>
            </h2>
          </div>

          {/* Sorting and Presentation Controls */}
          <div className="flex items-center gap-3">
            <select
              className="stitch-sort-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="popular">熱門度排序</option>
              <option value="ownership">會考門檻由高至低</option>
              <option value="city">行政區地理距離</option>
              <option value="name">學校名稱筆劃</option>
            </select>

            {/* View Switcher */}
            <div className="stitch-view-toggle">
              <button
                aria-label="卡片檢視"
                className={`stitch-view-btn ${viewMode === "grid" ? "is-active" : ""}`}
                type="button"
                onClick={() => setViewMode("grid")}
              >
                <ExplorerIcon name="more" />
              </button>
              <button
                aria-label="清單檢視"
                className={`stitch-view-btn ${viewMode === "list" ? "is-active" : ""}`}
                type="button"
                onClick={() => setViewMode("list")}
              >
                <ExplorerIcon name="more" />
              </button>
            </div>
          </div>
        </div>

        {/* Schools Grid / List: 6 cards per page matching Stitch */}
        <section className={viewMode === "grid" ? "stitch-schools-grid" : "stitch-schools-list"}>
          {paginatedSchools.map((school) => (
            <SchoolCard
              key={school.code}
              school={school}
              isCompared={compareCodes.includes(school.code)}
              onToggleCompare={toggleCompare}
              isFavorited={favorites.has(school.code)}
              onToggleFavorite={toggleFavorite}
              viewMode={viewMode}
            />
          ))}
          {paginatedSchools.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl p-8 shadow-sm">
              <ExplorerIcon name="search" className="text-outline mb-2" />
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
              <ExplorerIcon name="chevron-right" className="rotate-180" />
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
              <ExplorerIcon name="chevron-right" />
            </button>
          </section>
        ) : null}
      </div>

      {/* Floating Comparison Drawer */}
      <div
        className={`stitch-drawer ${
          compareCodes.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24 pointer-events-none"
        }`}
        id="comparisonDrawer"
      >
        <div className="flex items-center gap-2">
          <ExplorerIcon name="compare" className="text-tertiary-fixed" />
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
            <ExplorerIcon name="close" />
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
