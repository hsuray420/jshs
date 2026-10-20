"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
const regions = getRegionRegistry();
const defaultDistrict = "ct";

// High-fidelity campus photography matching Stitch screen design
const campusPhotos = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCRrEnrzlgHNsFv6aragJM5oTEib7Uz1lq741lcsOIcaqz2ia2NGlE4GHLtrz52ZdAqwvp9r8gATREeNNzJa83zlT-YZKiPKzAzaJyatktw4hOIZHRUTQBRB2VF1nCXY6m2fizz3Xx0MrLCFsFQmuGWyZnBEDaRwL_KPUcHPCGda1S6mvnyDkq6F1xnXC7SbpmE5QmdAIWVTIGU8md56_NKksgNJPzoV12UOfPZJHIQKoKSuxbFqlaghQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5xwMpRPdwmh-oFH3DFBQDLSi3dU2yt7EztUhtDoVSJPYapF7RPwDa8Ee7b5mLHaw_9G8-6N5slgi7VoVgKRaERRetASuOh5YytadlRULDFyBU-dRNz5EklmgiJMZN_ePmiRhCKF0-esKktJMBw9tGDwa4Wu9dUKgKgkSCC5bzYWaOPds-JdnO_GS1RDD8bLnTWKkTiB6ZhyXVXz2dJ8l7W2PkM7FpgTHLrdSszn03LayTayAGdCfVcw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBrOyDxrtLVcehUBcyajoTPv-ZevaUpbF8ZcCZ3ZzQUWmnPPZRzPVwWKBjF5URmhb43_Of1EQ_bNL-5u4_WQeW8Tey8v_Lt4SKccx0igZ35VTCIDVb1-GBaRp7yvDS1zgCcj-3gd0jD1jYNt2dBSPaHY5Z5Gg-xTmrVAwzIfCMM3DOC__g7-YcLA3jevxHb11_jIS9GzYAoyJzJBWqfHWd5zrFA2iFKXCJBLzLL-Fgnr_lPXuV8HY0fqw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBC-__vmCd9yEK4WE8C0Mcdc-Fdu4ViiDDgvsx5LD_019kt1vXrlPxKLQF6pxVeKdEvrO_M8K7FQF6o6LZGas9ymua8JXDFx2Y0D1uG5cCOMep0vfNA0gPGoMPl_hgW1klMFame1o9UPCw_4yXqn_fBp_90bVImwMWKpL6yFthUf3hMAO7EVcoODvXmyhrj3TlXpW6GMGS5EDWXQVE5LhhSkW7Csnu99QOlD2EsZY_CpR3mNIzu-WyomA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAxqQh8HVsYNv5NEAHAWAqgvs1qEx7lusD9BP6pboLMYjTYEpfkgQZ37Y6Fnvguuj_R6CR0bSJRWkdq5YKEO1ml2Q8laXiPdG5W_RkC1RsHhFUkJOy8KF7arWY509vVnL6Zl_fngfToPpnladDaLqRPdXDA4KF-bKk5lsUvXqYH-gqhvJaP4SsoKFSgASp9JeonM3s4V9MK8XFu3u4KyQx9mr-LAnmUJ2bvv2ubewN_GaIaFGGS87qPTw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAQZbd5fB1xhligqib55HFXBFkNZ7Kczfg4PXpQwzSIggFmpiC0SHNN--3_qeuwxtiSpIE2-KsJ5OzvkFR6Z0_fmRqrhCrgv9ZjUwbnpwovOmcqHTnBrDunUMEUuHhS7hzgedLxoIhI91MzTFsAuftXBnXY5EvBKk1y2nSHBuxuyhwyrfkFj9qG5Ohlka5I1CWW1XU2jp4aflxVtPc9_V_DvP8isoAdc2imR5MD5aBXorm-30Ajywu8bQ",
];

const schoolPhotosByCode: Record<string, string> = {
  "353301": campusPhotos[0], // 建中
  "353303": campusPhotos[1], // 北一女
  "330301": campusPhotos[2], // 師大附中
  "353302": campusPhotos[3], // 成功高中
  "343301": campusPhotos[4], // 中山女高
  "333401": campusPhotos[5], // 大安高工
};

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
  index = 0,
}: {
  school: SchoolSearchIndexEntry;
  selected?: boolean;
  onCompare?: (code: string) => void;
  compact?: boolean;
  index?: number;
}) {
  const isPublic = (school.ownership || "").includes("公立");
  const campusPhoto =
    schoolPhotosByCode[school.code] ||
    campusPhotos[Math.abs(school.code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % campusPhotos.length];

  return (
    <article className={`group bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden animate-fadeInUp delay-card-${(index % 6) + 1} border border-transparent hover:border-surface-container`}>
      <div className="flex flex-col gap-space-md">
        {/* Header: Visual + Status Badges */}
        <div className="flex items-start justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="sv-school-card-symbol sr-only" />
                <h3 className="m-0 font-headline-md text-headline-md text-primary transition-colors group-hover:text-secondary">
                  <Link href={`/schools/${school.code}`}>{school.name}</Link>
                </h3>
              </div>
            </div>
          </div>
          <button
            aria-label="加入收藏"
            className={`favorite-toggle w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high ${selected ? "text-red-600 heart-pop-anim" : "text-on-surface-variant"} flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer`}
            type="button"
            onClick={() => onCompare?.(school.code)}
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${selected ? "text-red-600" : ""}`}>
              {selected ? "favorite" : "favorite_border"}
            </span>
          </button>
        </div>

        {/* School Photo */}
        <div className="relative w-full h-36 rounded-DEFAULT overflow-hidden bg-surface-container">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            src={campusPhoto}
            alt={school.name}
            loading="lazy"
          />
        </div>

        {/* Academic Classification Badges */}
        <div className="flex flex-wrap gap-space-xs">
          <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm hover:brightness-95 transition-all">
            {school.ownership || "公立"}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:brightness-95 transition-all">
            {school.schoolType || "普通型高中"}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:brightness-95 transition-all">
            {school.gender || "男女兼收"}
          </span>
          {school.departmentNames && school.departmentNames.length > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm hover:brightness-95 transition-all">
              {school.departmentNames[0]}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm hover:brightness-95 transition-all">
              科學班認證
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-space-md flex items-center gap-space-xs">
        <button
          className="compare-btn group/cmp flex-1 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-title-md text-label-md flex items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer"
          type="button"
          onClick={() => onCompare?.(school.code)}
        >
          {selected ? (
            <>
              <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
              <span>已加入比較</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover/cmp:rotate-90">add</span>
              <span>加入志願比較</span>
            </>
          )}
        </button>
        <Link
          className="group/act h-10 px-space-md rounded-full bg-primary text-on-primary font-title-md text-label-md flex items-center justify-center gap-1 hover:bg-primary-container transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          href={`/schools/${school.code}`}
        >
          <span>查看簡章</span>
          <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover/act:translate-x-1">arrow_forward</span>
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
  const [activeCategory, setActiveCategory] = useState<string>("popular");
  const [sort, setSort] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [compareCodes, setCompareCodes] = useState<readonly string[]>(["353301"]); // Initialized with Jianguo High as in Stitch mockup
  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const drawer = useRef<HTMLDialogElement>(null);
  const districtDropdownRef = useRef<HTMLDivElement>(null);

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

  // Dynamic Metrics for the selected school district
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

        if (activeCategory === "popular" && !popularSchoolCodes.includes(school.code)) {
          return false;
        }
        if (activeCategory === "public" && !(school.ownership || "").includes("公立")) {
          return false;
        }
        if (activeCategory === "private" && !(school.ownership || "").includes("私立")) {
          return false;
        }
        if (
          activeCategory === "vocational" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /高職|技術/.test(t || ""))
        ) {
          return false;
        }
        if (
          activeCategory === "college" &&
          !(school.schoolTypes || [school.schoolType]).some((t) => /五專/.test(t || ""))
        ) {
          return false;
        }
        if (activeCategory === "coed" && school.gender !== "男女兼收" && school.gender) {
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
  }, [scopedSchools, filters, sort, activeCategory, popularSchoolCodes]);

  const active = Object.entries(filters).filter(
    ([key, value]) => key !== "query" && key !== "district" && value,
  ).length;

  const update = (key: keyof SchoolExplorerFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const clear = () => {
    setFilters((current) => ({ district: current.district }));
    setActiveCategory("all");
    setQueryInput("");
  };

  const changeDistrict = (value: string) => {
    setDistrict(value);
    setFilters((current) => ({ ...current, district: value }));
    setIsDistrictMenuOpen(false);
  };

  const toggleCompare = (code: string) =>
    setCompareCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : current.length < 4
        ? [...current, code]
        : current,
    );

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
    <div className="sv-root sv-explorer-root w-full bg-background min-h-screen text-on-surface antialiased">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[480px] bg-gradient-to-b from-secondary-fixed/30 via-surface-container-high/20 to-transparent blur-3xl pointer-events-none -z-10" />

          {/* Main Content Container matching Stitch max-w-7xl */}
          <div className="max-w-7xl mx-auto px-margin md:px-margin-md lg:px-margin-lg pt-space-md pb-space-xl flex flex-col gap-space-lg">
            {/* Hero Header Section */}
            <header className="sv-hero border-0 bg-transparent p-0 m-0">
              <span className="sr-only">找到適合你的學校</span>
              <section className="flex flex-col gap-space-sm max-w-4xl animate-fadeInUp delay-1">
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold transition-colors m-0">
                  找學校
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed m-0">
                  探索全臺公私立高中職、五專與特色科別，精準掌握升學志願方向
                </p>
              </section>
            </header>

            {/* Central Search Architecture Module */}
            <section className="relative bg-surface-container-lowest rounded-lg p-space-md shadow-xl flex flex-col gap-space-md animate-fadeInUp delay-2 transition-shadow duration-300 hover:shadow-2xl">
              {/* Input Layer: Integrated district selector + Search input + Action button */}
              <div className="group/search flex flex-col lg:flex-row items-stretch lg:items-center gap-space-sm bg-surface-container-low p-space-xs rounded-lg lg:rounded-full border border-transparent focus-within:border-secondary focus-within:ring-4 focus-within:ring-secondary/15 focus-within:bg-surface-container-lowest transition-all duration-300 shadow-sm">
                <div className="flex-1 flex items-center px-space-md py-space-xs">
                  <span className="material-symbols-outlined text-outline group-focus-within/search:text-secondary text-[22px] mr-space-xs transition-colors duration-200">
                    search
                  </span>
                  <label className="sr-only" htmlFor="school-search">
                    搜尋學校、科別或課程方向
                  </label>
                  <input
                    id="school-search"
                    className="w-full bg-transparent border-0 outline-none font-body-md text-body-md text-on-surface placeholder:text-outline py-space-xs transition-colors"
                    placeholder="搜尋學校名稱、地區或科別..."
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    autoComplete="off"
                  />
                  {queryInput ? (
                    <button
                      aria-label="清除文字"
                      className="text-outline hover:text-on-surface p-1 transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                      id="clearSearchBtn"
                      type="button"
                      onClick={() => setQueryInput("")}
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                    </button>
                  ) : null}
                </div>
                <button
                  className="h-12 px-space-lg rounded-full bg-secondary text-on-secondary font-title-md text-title-md flex items-center justify-center gap-space-xs hover:bg-primary shadow-md hover:shadow-lg hover:shadow-secondary/25 transition-all duration-300 active:scale-95 group/btn cursor-pointer"
                  type="button"
                >
                  <span className="tracking-wide">開始搜尋</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover/btn:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>

              {/* Filter Chips Strip */}
              <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full ${
                    activeCategory === "popular"
                      ? "bg-primary text-on-primary shadow-sm hover:shadow-md"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface hover:shadow-sm"
                  } font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer`}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === "popular" ? "all" : "popular")}
                >
                  <span className="material-symbols-outlined text-[16px] transition-transform group-hover:scale-110">
                    local_fire_department
                  </span>
                  <span>熱門學校</span>
                </button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full ${
                    activeCategory === "public"
                      ? "bg-primary text-on-primary shadow-sm hover:shadow-md"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface hover:shadow-sm"
                  } font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer`}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === "public" ? "all" : "public")}
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  <span>公立優先</span>
                </button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full ${
                    activeCategory === "private"
                      ? "bg-primary text-on-primary shadow-sm hover:shadow-md"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface hover:shadow-sm"
                  } font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer`}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === "private" ? "all" : "private")}
                >
                  <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                  <span>私立高中</span>
                </button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full ${
                    activeCategory === "vocational"
                      ? "bg-primary text-on-primary shadow-sm hover:shadow-md"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface hover:shadow-sm"
                  } font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer`}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === "vocational" ? "all" : "vocational")}
                >
                  <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                  <span>技術型高中 (高職)</span>
                </button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full ${
                    activeCategory === "college"
                      ? "bg-primary text-on-primary shadow-sm hover:shadow-md"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface hover:shadow-sm"
                  } font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer`}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === "college" ? "all" : "college")}
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>五專專區</span>
                </button>
                <button
                  className={`filter-pill px-space-md py-space-xs rounded-full ${
                    activeCategory === "coed"
                      ? "bg-primary text-on-primary shadow-sm hover:shadow-md"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface hover:shadow-sm"
                  } font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer`}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === "coed" ? "all" : "coed")}
                >
                  <span className="material-symbols-outlined text-[16px]">wc</span>
                  <span>男女兼收</span>
                </button>
                <button
                  className="filter-pill px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                  type="button"
                  onClick={() => drawer.current?.showModal()}
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  <span>依行政區</span>
                </button>
                <button
                  className="filter-pill px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-space-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                  type="button"
                  onClick={() => drawer.current?.showModal()}
                >
                  <span className="material-symbols-outlined text-[16px]">science</span>
                  <span>特色實驗班</span>
                </button>
                <button
                  className="filter-pill ml-auto px-space-md py-space-xs rounded-full bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-primary font-title-md text-label-md flex items-center gap-space-xs transition-all duration-200 active:scale-95 cursor-pointer"
                  id="toggleAdvancedFilter"
                  type="button"
                  onClick={() => drawer.current?.showModal()}
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>進階篩選</span>
                  <span className="material-symbols-outlined text-[16px] transition-transform duration-200" id="filterChevron">
                    expand_more
                  </span>
                </button>
              </div>
            </section>

            {/* Section 2: District Control + Stats Bar */}
            <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md bg-surface-container-low/60 p-space-sm rounded-lg border border-surface-container animate-fadeInUp delay-3">
              <div className="flex items-center gap-space-sm" ref={districtDropdownRef}>
                <div className="relative">
                  <button
                    aria-expanded={isDistrictMenuOpen}
                    aria-haspopup="true"
                    className="group flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-title-md text-body-md border border-surface-container transition-all duration-200 shadow-sm cursor-pointer"
                    id="districtBtn"
                    type="button"
                    onClick={() => setIsDistrictMenuOpen(!isDistrictMenuOpen)}
                  >
                    <div className="flex items-center gap-1 text-primary">
                      <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:scale-110">
                        near_me
                      </span>
                      <span className="text-on-surface font-title-md text-label-md">目前就學區：</span>
                      <span className="text-primary font-headline-md text-title-md" id="currentDistrictText">
                        {regionName}
                      </span>
                    </div>
                    <span
                      className={`material-symbols-outlined text-outline group-hover:text-primary text-[18px] transition-transform duration-300 ${
                        isDistrictMenuOpen ? "rotate-180" : ""
                      }`}
                      id="districtChevron"
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Accessible native select */}
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

                  {isDistrictMenuOpen ? (
                    <div
                      className="absolute top-full left-0 mt-space-xs w-64 bg-surface-container-lowest rounded-DEFAULT shadow-xl p-space-sm z-30 flex flex-col gap-space-xs transition-all duration-200"
                      id="districtMenu"
                    >
                      <span className="font-label-sm text-label-sm text-outline px-space-xs py-1">
                        切換全臺 15 個就學區
                      </span>
                      <button
                        className={`district-option flex items-center justify-between px-space-sm py-space-xs rounded-DEFAULT ${
                          district === "tp"
                            ? "bg-surface-container-high text-primary font-title-md"
                            : "hover:bg-surface-container text-on-surface font-body-md"
                        } text-body-md text-left transition-colors duration-150 cursor-pointer`}
                        type="button"
                        onClick={() => changeDistrict("tp")}
                      >
                        <span>基北區 (北北基)</span>
                        {district === "tp" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                      </button>
                      <button
                        className={`district-option flex items-center justify-between px-space-sm py-space-xs rounded-DEFAULT ${
                          district === "taoyuan-lienchiang"
                            ? "bg-surface-container-high text-primary font-title-md"
                            : "hover:bg-surface-container text-on-surface font-body-md"
                        } text-body-md text-left transition-colors duration-150 cursor-pointer`}
                        type="button"
                        onClick={() => changeDistrict("taoyuan-lienchiang")}
                      >
                        <span>桃連區 (桃園/連江)</span>
                        {district === "taoyuan-lienchiang" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                      </button>
                      <button
                        className={`district-option flex items-center justify-between px-space-sm py-space-xs rounded-DEFAULT ${
                          district === "ct"
                            ? "bg-surface-container-high text-primary font-title-md"
                            : "hover:bg-surface-container text-on-surface font-body-md"
                        } text-body-md text-left transition-colors duration-150 cursor-pointer`}
                        type="button"
                        onClick={() => changeDistrict("ct")}
                      >
                        <span>中投區 (臺中/南投)</span>
                        {district === "ct" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                      </button>
                      <button
                        className={`district-option flex items-center justify-between px-space-sm py-space-xs rounded-DEFAULT ${
                          district === "tainan"
                            ? "bg-surface-container-high text-primary font-title-md"
                            : "hover:bg-surface-container text-on-surface font-body-md"
                        } text-body-md text-left transition-colors duration-150 cursor-pointer`}
                        type="button"
                        onClick={() => changeDistrict("tainan")}
                      >
                        <span>臺南區</span>
                        {district === "tainan" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                      </button>
                      <button
                        className={`district-option flex items-center justify-between px-space-sm py-space-xs rounded-DEFAULT ${
                          district === "kaohsiung"
                            ? "bg-surface-container-high text-primary font-title-md"
                            : "hover:bg-surface-container text-on-surface font-body-md"
                        } text-body-md text-left transition-colors duration-150 cursor-pointer`}
                        type="button"
                        onClick={() => changeDistrict("kaohsiung")}
                      >
                        <span>高雄區</span>
                        {district === "kaohsiung" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                      </button>
                      {regions
                        .filter((r) => !["tp", "taoyuan-lienchiang", "ct", "tainan", "kaohsiung"].includes(r.id))
                        .map((r) => (
                          <button
                            key={r.id}
                            className={`district-option flex items-center justify-between px-space-sm py-space-xs rounded-DEFAULT ${
                              district === r.id
                                ? "bg-surface-container-high text-primary font-title-md"
                                : "hover:bg-surface-container text-on-surface font-body-md"
                            } text-body-md text-left transition-colors duration-150 cursor-pointer ${
                              r.schoolDataStatus !== "available" ? "opacity-60" : ""
                            }`}
                            type="button"
                            onClick={() => changeDistrict(r.id)}
                          >
                            <span>
                              {r.name}
                              {r.schoolDataStatus === "verifying" ? " (驗證中)" : ""}
                            </span>
                            {district === r.id ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                          </button>
                        ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Dynamic Metrics Badges */}
              <div className="flex items-center gap-space-md text-center">
                <div className="bg-surface-container-lowest rounded-full px-space-md py-space-xs shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-space-xs border-0">
                  <span className="font-label-sm text-label-sm text-outline">公立高中職</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {publicCount}
                  </span>
                </div>
                <div className="bg-surface-container-lowest rounded-full px-space-md py-space-xs shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-space-xs border-0">
                  <span className="font-label-sm text-label-sm text-outline">私立學校</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {privateCount}
                  </span>
                </div>
                <div className="bg-surface-container-lowest rounded-full px-space-md py-space-xs shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-space-xs border-0">
                  <span className="font-label-sm text-label-sm text-outline">五專專科</span>
                  <span className="font-headline-md text-headline-md text-secondary font-bold">
                    {vocationalCount}
                  </span>
                </div>
              </div>
            </section>

            {region?.schoolDataStatus === "verifying" ? (
              <p className="sv-inline-empty" role="status">
                {region.name}資料驗證中，學校查詢尚未開放。
              </p>
            ) : null}

            {/* Section 3: School Directory Main Header & Controls */}
            <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm pt-space-xs animate-fadeInUp delay-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight m-0">
                    {regionName}學校
                  </h2>
                  <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm transition-transform hover:scale-105">
                    共 {result.length} 校
                  </span>
                </div>
              </div>

              {/* Sorting and Presentation Controls */}
              <div className="flex items-center gap-space-sm self-end sm:self-auto">
                <div className="relative group/sort">
                  <select
                    className="h-10 pl-space-md pr-space-xl rounded-full bg-surface-container-lowest text-on-surface font-title-md text-label-md appearance-none outline-none shadow-sm cursor-pointer hover:bg-surface-container hover:shadow transition-all duration-200"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="name">熱門度排序</option>
                    <option value="ownership">公私立排序</option>
                    <option value="city">行政區地理距離</option>
                    <option value="name">學校名稱筆劃</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-outline group-hover/sort:text-primary text-[18px] transition-colors duration-200">
                    unfold_more
                  </span>
                </div>

                {/* View Switcher */}
                <div className="flex items-center p-1 rounded-full bg-surface-container-lowest shadow-sm">
                  <button
                    aria-label="卡片檢視"
                    className={`w-8 h-8 rounded-full ${
                      viewMode === "grid"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "hover:bg-surface-container text-on-surface-variant"
                    } flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer`}
                    type="button"
                    onClick={() => setViewMode("grid")}
                  >
                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  </button>
                  <button
                    aria-label="清單檢視"
                    className={`w-8 h-8 rounded-full ${
                      viewMode === "list"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "hover:bg-surface-container text-on-surface-variant"
                    } flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer`}
                    type="button"
                    onClick={() => setViewMode("list")}
                  >
                    <span className="material-symbols-outlined text-[18px]">view_list</span>
                  </button>
                </div>

                {/* Direct Shortcut links for Map and Compare */}
                <div className="hidden sm:flex items-center gap-2 ml-1">
                  <Link
                    href={`/schools/map?district=${district}`}
                    className="h-10 px-3.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-primary font-title-md text-label-sm flex items-center gap-1 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    <span>學校地圖</span>
                  </Link>
                  <Link
                    href="/schools/compare"
                    className="h-10 px-3.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-primary font-title-md text-label-sm flex items-center gap-1 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">compare</span>
                    <span>學校比較</span>
                  </Link>
                </div>
              </div>
            </section>

            {/* Section 4: Schools Grid (6 Distinct, Balanced Cards with Rich Typography & Imagery) */}
            <section
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md"
                  : "flex flex-col gap-space-md"
              }
            >
              {result.slice(0, 6).map((school, i) => (
                <SchoolCard
                  key={school.code}
                  school={school}
                  selected={compareCodes.includes(school.code)}
                  onCompare={toggleCompare}
                  index={i}
                />
              ))}
            </section>

            {/* Section 5: Pagination identical to Stitch mockup */}
            <section className="flex items-center justify-center pt-space-md pb-space-lg animate-fadeInUp delay-pagination">
              <div className="flex items-center gap-space-xs bg-surface-container-lowest p-space-xs rounded-full shadow-sm">
                <button
                  aria-label="上一頁"
                  className="w-9 h-9 rounded-full hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <button
                  className={`w-9 h-9 rounded-full ${
                    currentPage === 1
                      ? "bg-primary text-on-primary shadow-sm"
                      : "hover:bg-surface-container text-on-surface"
                  } font-title-md text-label-md flex items-center justify-center transition-all duration-150 cursor-pointer`}
                  type="button"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </button>
                <button
                  className={`w-9 h-9 rounded-full ${
                    currentPage === 2
                      ? "bg-primary text-on-primary shadow-sm"
                      : "hover:bg-surface-container text-on-surface"
                  } font-title-md text-label-md flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer`}
                  type="button"
                  onClick={() => setCurrentPage(2)}
                >
                  2
                </button>
                <button
                  className={`w-9 h-9 rounded-full ${
                    currentPage === 3
                      ? "bg-primary text-on-primary shadow-sm"
                      : "hover:bg-surface-container text-on-surface"
                  } font-title-md text-label-md flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer`}
                  type="button"
                  onClick={() => setCurrentPage(3)}
                >
                  3
                </button>
                <span className="px-space-xs text-outline font-title-md text-body-md">...</span>
                <button
                  className="w-9 h-9 rounded-full hover:bg-surface-container text-on-surface font-title-md text-label-md flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                  type="button"
                >
                  22
                </button>
                <button
                  aria-label="下一頁"
                  className="w-9 h-9 rounded-full hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                  type="button"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Comparison Drawer matching Stitch */}
      <div
        className={`sv-compare-bar fixed bottom-space-md left-1/2 -translate-x-1/2 z-40 bg-on-surface/95 backdrop-blur-md text-surface-container-lowest px-space-lg py-space-sm rounded-full shadow-2xl flex items-center gap-space-md transition-all duration-300 border border-surface-container-high/20 ${
          compareCodes.length > 0 ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
        }`}
        id="comparisonDrawer"
      >
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">compare_arrows</span>
          <span className="font-title-md text-label-md">志願比對中</span>
          <span className="font-headline-md text-label-md text-secondary-fixed-dim" id="compareCount">
            ({compareCodes.length}/4)
          </span>
        </div>
        <div className="h-4 w-[1px] bg-outline-variant" />
        <button
          className="text-label-md text-surface-dim hover:text-surface-container-lowest transition-colors underline underline-offset-4 cursor-pointer"
          id="clearCompareBtn"
          type="button"
          onClick={() => setCompareCodes([])}
        >
          清空
        </button>
        <Link
          className="px-space-md py-1.5 rounded-full bg-secondary text-on-secondary font-title-md text-label-sm hover:bg-secondary-container transition-all shadow-sm active:scale-95"
          href={`/schools/compare?schools=${compareCodes.join(",")}`}
        >
          前往比對
        </Link>
      </div>

      {/* Advanced Filter Dialog */}
      <dialog ref={drawer} className="sv-drawer">
        <div className="sv-drawer-head">
          <strong>調整搜尋條件</strong>
          <button
            type="button"
            onClick={() => drawer.current?.close()}
            aria-label="關閉更多篩選"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
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
          查看 {result.length} 所學校
        </button>
      </dialog>
    </div>
  );
}
