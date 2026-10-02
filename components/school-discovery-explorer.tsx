"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readStoredDistrict, normalizeDistrict, writeStoredDistrict } from "@/lib/district-context";
import { getAvailableSchoolDataRegions } from "@/lib/region-registry";
import { SchoolRegionControl } from "@/components/school-region-control";
import { useSchoolSearchIndex } from "@/components/school-static-data";
import { FeatureIllustration } from "@/components/feature-illustrations";
import "@/components/school-discovery.css";

const regions = getAvailableSchoolDataRegions();
const normalize = (value: string) => value.normalize("NFKC").replaceAll("台", "臺").replace(/\s+/g, "").toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));

export function SchoolDiscoveryExplorer() {
  const { schools, loading, error } = useSchoolSearchIndex();
  const [region, setRegion] = useState("ct");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [ownership, setOwnership] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [department, setDepartment] = useState("");
  const [limit, setLimit] = useState(36);

  useEffect(() => {
    const restoreUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      setRegion(normalizeDistrict(params.get("region")) || readStoredDistrict() || "ct");
      setQuery(params.get("q") || "");
    };
    restoreUrlState();
    window.addEventListener("popstate", restoreUrlState);
    return () => window.removeEventListener("popstate", restoreUrlState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("region", region);
    if (query) params.set("q", query);
    else params.delete("q");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [region, query]);

  const regionName = regions.find((item) => item.id === region)?.name || "中投區";
  const scoped = useMemo(() => schools.filter((school) => school.admissionDistricts.some((district) => district.includes(regionName))), [schools, regionName]);
  const cities = useMemo(() => unique(scoped.map((school) => school.city)), [scoped]);
  const ownerships = useMemo(() => unique(scoped.map((school) => school.ownership)), [scoped]);
  const schoolTypes = useMemo(() => unique(scoped.flatMap((school) => school.schoolTypes)), [scoped]);
  const departments = useMemo(() => unique(scoped.flatMap((school) => school.departmentNames)), [scoped]);
  const results = useMemo(() => {
    const needle = normalize(query);
    return scoped.filter((school) => (!needle || school.normalizedSearchText.includes(needle))
      && (!city || school.city === city)
      && (!ownership || school.ownership === ownership)
      && (!schoolType || school.schoolTypes.includes(schoolType))
      && (!department || school.departmentNames.includes(department)));
  }, [scoped, query, city, ownership, schoolType, department]);
  const changeRegion = (next: string) => {
    writeStoredDistrict(next);
    setRegion(next);
    setCity("");
    setDepartment("");
    setLimit(36);
  };
  const clear = () => { setQuery(""); setCity(""); setOwnership(""); setSchoolType(""); setDepartment(""); };

  if (loading) return <section className="sd-state" aria-live="polite">正在載入學校資料…</section>;
  if (error) return <section className="sd-state" role="status"><h1>學校資料暫時無法載入</h1><p>{error}</p><button type="button" onClick={() => window.location.reload()}>重新載入</button></section>;

  return <div className="sd-root">
    <div className="sd-container"><SchoolRegionControl value={region} onChange={changeRegion} /></div>
    <header className="sd-hero"><div className="sd-container"><div className="sd-hero-copy"><p>探索學校</p><h1>從地區與校科，找到下一所想了解的學校</h1><p>所有結果來自官方區域資料；沒有資料的欄位會誠實留白，不以推測補齊。</p>
      <label className="sd-search"><span className="sr-only">搜尋學校、縣市、行政區或科別</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋學校、縣市、行政區或科別" /></label>
    </div><FeatureIllustration name="school-search" theme="schools" className="sd-hero-illustration" /></div></header>
    <section className="sd-container sd-body" aria-label="探索學校結果">
      <div className="sd-filters">
        <label>縣市<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">全部縣市</option>{cities.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>公私立<select value={ownership} onChange={(event) => setOwnership(event.target.value)}><option value="">全部</option>{ownerships.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>學制<select value={schoolType} onChange={(event) => setSchoolType(event.target.value)}><option value="">全部</option>{schoolTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>科別<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">全部科別</option>{departments.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button type="button" onClick={clear}>清除條件</button>
      </div>
      <div className="sd-result-heading"><div><h2>{regionName}的學校</h2><p role="status">共 <strong>{results.length}</strong> 所學校</p></div><Link href={`/schools/map?region=${region}`}>在地圖上查看</Link></div>
      {results.length ? <div className="sd-card-grid">{results.slice(0, limit).map((school) => <Link className="sd-card" key={school.code} href={`/schools/${encodeURIComponent(school.code)}`}><div className="sd-card-tags"><span>{school.ownership || "公私立未提供"}</span><span>{school.schoolType || "學制未提供"}</span></div><h3>{school.name}</h3><p>{school.city}{school.area ? ` · ${school.area}` : ""}</p><p>{school.departmentNames.slice(0, 3).join(" · ") || "科別資料未提供"}</p><span className="sd-card-action">查看學校 →</span></Link>)}</div> : <div className="sd-empty"><h2>沒有符合條件的學校</h2><p>可以縮短關鍵字或減少篩選條件。</p><button type="button" onClick={clear}>清除條件</button></div>}
      {limit < results.length ? <button className="sd-more" type="button" onClick={() => setLimit((current) => current + 36)}>顯示更多學校</button> : null}
    </section>
  </div>;
}
