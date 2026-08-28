"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SchoolDirectoryRecord } from "@/lib/school-directory";
import { readStoredDistrict } from "@/lib/district-context";
import { markProgress } from "@/lib/progress";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/status";
import { PageContainer } from "@/components/ui/layout";
import { SourceBadge } from "@/components/source-badge";

type SchoolExplorerRecord = Pick<SchoolDirectoryRecord, "districtCode" | "districtLabel" | "academicYear" | "dataStatus" | "sourceName" | "sourceType" | "code" | "name" | "ownership" | "program" | "city" | "area" | "website" | "departmentsRaw" | "groups" | "hasQuota" | "hasHistoricalData">;

type SchoolDirectoryPayload = Readonly<{
  version: string;
  updatedAt: string;
  schools: readonly SchoolExplorerRecord[];
}>;

type FilterValue = "all" | "yes" | "no";
export type SchoolExplorerFilters = Readonly<{
  district: string;
  query: string;
  program: string;
  ownership: string;
  city: string;
  quota: FilterValue;
  history: FilterValue;
}>;

const emptyFilters: SchoolExplorerFilters = { district: "all", query: "", program: "all", ownership: "all", city: "all", quota: "all", history: "all" };

export function SchoolExplorer({
  districtOptions,
  initialFilters = emptyFilters,
}: {
  districtOptions: readonly { code: string; label: string }[];
  initialFilters?: SchoolExplorerFilters;
}) {
  const [schools, setSchools] = useState<readonly SchoolExplorerRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState<SchoolExplorerFilters>(initialFilters);
  const [savedCode, setSavedCode] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const districtInitialized = useRef(initialFilters.district !== "all");

  useEffect(() => {
    if (initialFilters.district !== "all" && filters.district !== initialFilters.district) {
      districtInitialized.current = true;
      const timer = window.setTimeout(() => setFilters((current) => ({ ...current, district: initialFilters.district })), 0);
      return () => window.clearTimeout(timer);
    }
    if (!districtInitialized.current) {
      districtInitialized.current = true;
      const storedDistrict = readStoredDistrict();
      if (storedDistrict) {
        const timer = window.setTimeout(() => setFilters((current) => ({ ...current, district: storedDistrict })), 0);
        return () => window.clearTimeout(timer);
      }
    }
    if (filters.district !== "all") markProgress("district", filters.district);
    markProgress("schoolSearch");
  }, [filters.district, initialFilters.district]);

  useEffect(() => {
    let active = true;

    fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`school_directory_${response.status}`);
        return response.json() as Promise<SchoolDirectoryPayload>;
      })
      .then((payload) => {
        if (!active || !Array.isArray(payload.schools)) throw new Error("school_directory_invalid");
        setSchools(payload.schools);
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
        setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const programs = useMemo(() => unique(schools.map((school) => school.program)), [schools]);
  const cities = useMemo(() => unique(schools.map((school) => school.city)), [schools]);
  const filteredSchools = useMemo(() => {
    const needle = normalize(filters.query);
    return schools.filter((school) => {
      const haystack = normalize([
        school.name, school.code, school.city, school.area, school.program,
        school.departmentsRaw, ...school.groups,
      ].join(" "));
      return (!needle || haystack.includes(needle))
        && (filters.district === "all" || school.districtCode === filters.district)
        && (filters.program === "all" || school.program === filters.program)
        && (filters.ownership === "all" || school.ownership === filters.ownership)
        && (filters.city === "all" || school.city === filters.city)
        && (filters.quota === "all" || String(school.hasQuota) === String(filters.quota === "yes"))
        && (filters.history === "all" || String(school.hasHistoricalData) === String(filters.history === "yes"));
    });
  }, [filters, schools]);

  function updateFilter<K extends keyof SchoolExplorerFilters>(key: K, value: SchoolExplorerFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(emptyFilters);
  }

  async function saveSchool(school: SchoolExplorerRecord) {
    setSavedCode("");
    setSaveMessage("");
    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ district: school.districtCode, schoolCode: school.code, schoolName: school.name, department: school.departmentsRaw, tier: "balanced" }),
    }).catch(() => null);
    if (response?.ok) {
      setSavedCode(`${school.districtCode}:${school.code}`);
      markProgress("planner");
    } else if (response?.status === 401) {
      setSaveMessage("收藏校科需要先使用 LINE 登入。");
    } else {
      setSaveMessage("暫時無法儲存，請稍後再試。");
    }
  }

  return (
    <>
      <section className="border-b jshs-hero-section">
        <PageContainer className="py-12 md:py-16">
          <p className="jshs-eyebrow">找校科中心</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">把校科，放進同一個全國查詢。</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">用同一套全國校科查詢篩選學校名稱、科系、群科、縣市、學制分類與招生條件。</p>
        </PageContainer>
      </section>

      <PageContainer as="section" className="py-8 md:py-12">
        <div className="grid gap-5 p-5 jshs-surface-card md:p-7">
          <label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">
            搜尋學校名稱、科系、群科、縣市、學校代碼
            <input value={filters.query} onChange={(event) => updateFilter("query", event.target.value)} placeholder="例如：資訊科、電機與電子群、臺中、060323" />
          </label>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <FilterSelect label="就學區" value={filters.district} onChange={(value) => updateFilter("district", value)} options={[{ code: "all", label: "全部就學區" }, ...districtOptions]} />
            <FilterSelect label="學制分類" value={filters.program} onChange={(value) => updateFilter("program", value)} options={[{ code: "all", label: "全部學制分類" }, ...programs.map((value) => ({ code: value, label: value }))]} />
            <FilterSelect label="公私立" value={filters.ownership} onChange={(value) => updateFilter("ownership", value)} options={[{ code: "all", label: "公私立皆可" }, { code: "公立", label: "公立" }, { code: "私立", label: "私立" }]} />
            <FilterSelect label="縣市" value={filters.city} onChange={(value) => updateFilter("city", value)} options={[{ code: "all", label: "全部縣市" }, ...cities.map((value) => ({ code: value, label: value }))]} />
            <FilterSelect label="招生名額" value={filters.quota} onChange={(value) => updateFilter("quota", value as FilterValue)} options={[{ code: "all", label: "名額皆可" }, { code: "yes", label: "有招生名額" }, { code: "no", label: "待公告" }]} />
            <FilterSelect label="歷年資料" value={filters.history} onChange={(value) => updateFilter("history", value as FilterValue)} options={[{ code: "all", label: "資料皆可" }, { code: "yes", label: "有歷年參考資料" }, { code: "no", label: "待整理" }]} />
          </div>
        </div>

        <div className="sticky top-0 z-10 mt-5 flex flex-wrap items-center gap-3 border-y border-[var(--jshs-border)] bg-[var(--jshs-page)] py-3" aria-label="已選條件">
          <strong className="text-sm text-slate-700">已選條件</strong>
          <ConditionChip label={filters.district === "all" ? "全部就學區" : districtOptions.find((item) => item.code === filters.district)?.label || filters.district} />
          {filters.query ? <ConditionChip label={`關鍵字：${filters.query}`} /> : null}
          {filters.program !== "all" ? <ConditionChip label={`學制分類：${filters.program}`} /> : null}
          {filters.ownership !== "all" ? <ConditionChip label={filters.ownership} /> : null}
          {filters.city !== "all" ? <ConditionChip label={filters.city} /> : null}
          {filters.quota !== "all" ? <ConditionChip label={filters.quota === "yes" ? "有招生名額" : "招生名額待公告"} /> : null}
          {filters.history !== "all" ? <ConditionChip label={filters.history === "yes" ? "有歷年參考" : "歷年資料待整理"} /> : null}
          <button type="button" onClick={clearFilters} className="ml-auto px-3 py-2 text-sm jshs-button-secondary">清除條件</button>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-bold jshs-muted-copy">目前顯示 {filteredSchools.length} 所學校／校科資料</p><p className="mt-1 text-xs leading-5 text-slate-500">每筆結果保留資料年度、來源與欄位狀態；正式招生權益仍以官方公告為準。瀏覽可匿名，收藏需要 LINE 登入。</p></div>
          <Link className="text-sm font-black text-[var(--jshs-primary)]" href="/planner">查看我的規劃 →</Link>
        </div>
        {saveMessage ? <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900" role="status">{saveMessage} <a className="ml-1 underline" href="/api/line/login/start">使用 LINE 登入</a></p> : null}

        {!loaded ? <div className="mt-6"><LoadingState label="正在載入學校資料…" /></div> : null}
        {loadError ? <div className="mt-6"><ErrorState /></div> : null}
        {loaded && !loadError && !filteredSchools.length ? <div className="mt-6"><EmptyState title="找不到符合條件的學校" description="試著清除一個條件，或換一個學校、科系與縣市關鍵字。" action={<button type="button" onClick={clearFilters} className="px-4 py-3 text-sm jshs-button-secondary">清除條件</button>} /></div> : null}
        {loaded && !loadError ? <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filteredSchools.slice(0, 120).map((school) => {
            const key = `${school.districtCode}:${school.code}`;
            return (
              <article key={key} className="flex flex-col p-6 jshs-surface-card">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black tracking-[.12em] text-[var(--jshs-primary)]">{school.districtLabel} · {school.code}</p><h2 className="mt-2 text-2xl font-black leading-snug">{school.name}</h2></div><SourceBadge sourceType="jshs_curated" /></div>
                <p className="mt-3 text-sm leading-6 jshs-muted-copy">{[school.city, school.area].filter(Boolean).join(" · ")} · {school.program || "學制分類待確認"} · {school.ownership || "公私立待確認"}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold"><Status label="資料年度" value={`${school.academicYear} 學年度`} /><Status label="資料狀態" value={school.dataStatus === "ready" ? "已校核" : "參考資料"} /><Status label="招生名額" value={school.hasQuota ? "已有資料" : "待公告"} /><Status label="歷年參考" value={school.hasHistoricalData ? "已有資料" : "待整理"} /><Status label="資料來源" value={school.sourceName} /></div>
                <p className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-7 text-slate-700">科系／群科：{school.groups.length ? school.groups.join("、") : school.departmentsRaw || "待以學校公告確認"}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5"><Link className="px-4 py-3 text-sm jshs-button-primary" href={`/schools/${school.districtCode}/${school.code}`}>查看學校詳情</Link><button type="button" onClick={() => saveSchool(school)} className="px-4 py-3 text-sm jshs-button-secondary">{savedCode === key ? "已加入規劃" : "加入規劃"}</button>{school.website ? <a className="px-4 py-3 text-sm jshs-button-secondary" href={school.website} target="_blank" rel="noreferrer">查看官方網站 ↗</a> : null}</div>
              </article>
            );
          })}
        </div> : null}
        {loaded && !loadError && filteredSchools.length > 120 ? <p className="mt-6 text-center text-sm font-bold text-slate-500">目前先顯示前 120 筆；請用條件繼續縮小範圍。</p> : null}
      </PageContainer>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly { code: string; label: string }[] }) {
  return <label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label>;
}

function ConditionChip({ label }: { label: string }) {
  return <span className="jshs-chip">{label}</span>;
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[var(--jshs-muted-surface)] p-3"><span className="block text-slate-400">{label}</span><strong className="mt-1 block line-clamp-1 text-slate-700">{value}</strong></div>;
}

function unique(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, "zh-TW"));
}

function normalize(value: string) {
  return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW");
}
