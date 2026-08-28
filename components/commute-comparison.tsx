"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CommuteRecord = Readonly<{ districtCode: string; districtLabel: string; code: string; name: string; city: string; area: string; address: string }>;
type Coordinate = Readonly<{ lat: number; lon: number }>;
type CommuteInput = Readonly<{ actualMinutes: string; days: number }>;
type TravelMode = "scooter" | "car" | "walk";

const travelModes: Readonly<Record<TravelMode, Readonly<{ label: string; speed: number; roadFactor: number }>>> = {
  scooter: { label: "機車估算", speed: 28, roadFactor: 1.25 },
  car: { label: "汽車估算", speed: 30, roadFactor: 1.3 },
  walk: { label: "步行估算", speed: 5, roadFactor: 1.1 },
};

export function CommuteComparison({ districtOptions, initialDistrict = "" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const [schools, setSchools] = useState<readonly CommuteRecord[]>([]);
  const [coordinates, setCoordinates] = useState<Readonly<Record<string, Coordinate>>>({});
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [inputs, setInputs] = useState<Readonly<Record<string, CommuteInput>>>({});
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeCoordinate, setHomeCoordinate] = useState<Coordinate | null>(null);
  const [homeStatus, setHomeStatus] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>("scooter");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationLoading, setLocationLoading] = useState(Boolean(initialDistrict));
  const [loadError, setLoadError] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("school_directory"); return response.json() as Promise<{ schools?: CommuteRecord[] }>; })
      .then((payload) => { if (active) setSchools(Array.isArray(payload.schools) ? payload.schools : []); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

  useEffect(() => {
    if (!district) return;
    let active = true;
    fetch(`/api/school-geocode?district=${encodeURIComponent(district)}`, { headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("school_locations"); return response.json() as Promise<{ coordinates?: Readonly<Record<string, Coordinate>> }>; })
      .then((payload) => { if (active) setCoordinates(payload.coordinates || {}); })
      .catch(() => { if (active) setLocationError("學校座標暫時無法載入；仍可輸入實際分鐘數比較，或稍後重試。"); })
      .finally(() => { if (active) setLocationLoading(false); });
    return () => { active = false; };
  }, [district]);

  const choices = useMemo(() => {
    const needle = normalize(query);
    return schools.filter((school) => Boolean(district) && school.districtCode === district && (!needle || normalize(`${school.name} ${school.code} ${school.city} ${school.area}`).includes(needle))).slice(0, 60);
  }, [district, query, schools]);
  const selectedSchools = useMemo(() => selected.map((key) => schools.find((school) => schoolKey(school) === key)).filter((school): school is CommuteRecord => Boolean(school)), [schools, selected]);
  const ranked = useMemo(() => selectedSchools.map((school) => {
    const key = schoolKey(school);
    const input = inputs[key] || { actualMinutes: "", days: 5 };
    const coordinate = coordinates[key];
    const estimatedMinutes = coordinate && homeCoordinate ? estimateMinutes(homeCoordinate, coordinate, travelMode) : null;
    const actualMinutes = input.actualMinutes === "" ? null : Math.max(0, Number(input.actualMinutes) || 0);
    const comparisonMinutes = actualMinutes ?? estimatedMinutes;
    return { school, input, coordinate, distance: coordinate && homeCoordinate ? haversineKm(homeCoordinate, coordinate) : null, estimatedMinutes, comparisonMinutes, weekly: comparisonMinutes === null ? null : comparisonMinutes * 2 * Math.min(7, Math.max(0, input.days || 0)) };
  }).sort((left, right) => (right.weekly ?? Number.NEGATIVE_INFINITY) - (left.weekly ?? Number.NEGATIVE_INFINITY)), [coordinates, homeCoordinate, inputs, selectedSchools, travelMode]);

  function toggle(key: string) {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length >= 4 ? current : [...current, key]);
  }

  function changeDistrict(value: string) {
    setDistrict(value);
    setSelected([]);
    setCoordinates({});
    setLocationError("");
    setLocationLoading(Boolean(value));
  }

  function retrySchools() {
    setLoadError(false);
    setLoading(true);
    setReloadToken((value) => value + 1);
  }

  function updateInput(key: string, field: keyof CommuteInput, value: string) {
    setInputs((current) => ({ ...current, [key]: { ...(current[key] || { actualMinutes: "", days: 5 }), [field]: field === "days" ? Math.min(7, Math.max(0, Number(value) || 0)) : value.replace(/[^0-9]/g, "").slice(0, 3) } }));
  }

  async function locateHome() {
    const address = homeAddress.trim();
    if (!address) { setHomeStatus("請先輸入住家地址或附近地標。"); return; }
    setLocating(true);
    setHomeStatus("正在定位出發地…");
    const response = await fetch(`/api/school-geocode?q=${encodeURIComponent(address)}`, { headers: { accept: "application/json" } }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { coordinate?: { lat?: number; lon?: number } | null } | null;
    const lat = Number(payload?.coordinate?.lat);
    const lon = Number(payload?.coordinate?.lon);
    if (!response?.ok || !Number.isFinite(lat) || !Number.isFinite(lon)) { setHomeStatus("找不到這個出發地，請補上縣市、區與路名。"); setLocating(false); return; }
    setHomeCoordinate({ lat, lon });
    setHomeStatus("出發地已定位；選取學校後會顯示距離與估算時間。");
    setLocating(false);
  }

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">通勤比較</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">從出發地開始，比較學校通勤負擔。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">選擇就學區、設定出發地，再加入最多四所學校。系統以座標距離與平均速度估算；你也可以填入實際單程時間作為比較基準。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="p-5 jshs-surface-card"><p className="jshs-eyebrow">設定比較條件</p><label className="mt-3 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => changeDistrict(event.target.value)}><option value="">請先選擇就學區</option>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label><label className="mt-4 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">出發地／住家地址<input value={homeAddress} onChange={(event) => setHomeAddress(event.target.value)} placeholder="例如：臺中市西屯區市政路" /></label><button type="button" onClick={() => void locateHome()} disabled={locating} className="mt-4 min-h-11 px-4 py-3 text-sm jshs-button-primary">{locating ? "定位中…" : "定位出發地"}</button>{homeStatus ? <p className="mt-3 text-sm leading-6 text-[var(--jshs-primary)]" role="status">{homeStatus}</p> : null}<label className="mt-5 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">交通方式<select value={travelMode} onChange={(event) => setTravelMode(event.target.value as TravelMode)}>{Object.entries(travelModes).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><p className="mt-4 text-xs leading-5 text-slate-500">{locationLoading ? "正在載入此區學校座標…" : locationError || "座標由 OpenStreetMap 資料整理；估算不代表官方交通時間。"}</p></section>
      <section className="p-5 jshs-surface-card"><p className="jshs-eyebrow">加入學校</p><label className="mt-3 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校、縣市或代碼<input value={query} onChange={(event) => setQuery(event.target.value)} disabled={!district} placeholder="請先選擇就學區" /></label><p className="mt-4 text-xs leading-5 text-slate-500">{loading ? "學校資料載入中…" : loadError ? "學校資料載入失敗" : `已選 ${selected.length}／4 所`}</p>{loadError ? <div className="mt-4 rounded-2xl border border-dashed border-[var(--jshs-border)] p-5 text-sm leading-6"><p>學校資料暫時無法載入，沒有產生比較結果。</p><button type="button" onClick={retrySchools} className="mt-3 min-h-11 px-4 py-3 jshs-button-primary">重新載入資料</button></div> : <div className="mt-4 grid max-h-80 gap-2 overflow-auto">{loading ? <div className="h-16 animate-pulse rounded-xl bg-[var(--jshs-muted-surface)]" /> : choices.map((school) => { const key = schoolKey(school); return <label key={key} className="flex items-start gap-3 rounded-xl border border-[var(--jshs-border)] p-3 text-sm"><input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} /><span><strong className="block">{school.name}</strong><small className="text-slate-500">{school.city} {school.area} · {school.code}</small></span></label>; })}{!loading && !choices.length ? <p className="rounded-xl bg-[var(--jshs-muted-surface)] p-4 text-sm text-slate-500">請先選擇就學區或調整搜尋條件。</p> : null}</div>}</section>
    </div><section className="mt-6 p-5 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">JSHS 計算／估算</p><h2 className="mt-2 text-2xl font-black">每週通勤比較</h2></div><span className="jshs-chip">單程 × 2 × 每週天數</span></div>{ranked.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{ranked.map(({ school, input, distance, estimatedMinutes, comparisonMinutes, weekly }) => { const key = schoolKey(school); return <article key={key} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{school.name}</h3><p className="text-xs text-slate-500">{school.city} {school.area}</p></div><strong className="text-[var(--jshs-primary)]">{weekly === null ? "尚未估算" : `每週 ${weekly} 分鐘`}</strong></div><dl className="mt-3 grid gap-2 text-sm text-slate-700"><div className="flex justify-between gap-3"><dt>直線距離</dt><dd>{distance === null ? "尚未定位" : `${distance.toFixed(1)} 公里`}</dd></div><div className="flex justify-between gap-3"><dt>估算單程時間</dt><dd>{estimatedMinutes === null ? "尚未定位" : `約 ${estimatedMinutes} 分鐘`}</dd></div><div className="flex justify-between gap-3"><dt>比較基準</dt><dd>{comparisonMinutes === null ? "請定位或輸入" : input.actualMinutes === "" ? "系統估算" : `實際輸入 ${input.actualMinutes} 分鐘`}</dd></div></dl><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">實際單程分鐘（選填）<input inputMode="numeric" value={input.actualMinutes} onChange={(event) => updateInput(key, "actualMinutes", event.target.value)} /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">每週天數<input type="number" min="0" max="7" value={input.days} onChange={(event) => updateInput(key, "days", event.target.value)} /></label></div><Link className="mt-3 inline-block text-xs font-black text-[var(--jshs-primary)]" href={`/schools/${school.districtCode}/${school.code}`}>查看學校資料 →</Link></article>; })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[var(--jshs-border)] p-8 text-center text-sm leading-6 jshs-muted-copy">先選擇就學區，再加入學校；定位出發地後即可取得距離與時間估算。</div>}<p className="mt-5 text-xs leading-6 text-slate-500">結果是 JSHS 計算／估算，不是官方交通時間；實際路線、轉乘、塞車、天候與校車資訊請用導航及學校公告再次確認。</p></section></section>
  </>;
}

function schoolKey(school: CommuteRecord) { return `${school.districtCode}:${school.code}`; }
function estimateMinutes(left: Coordinate, right: Coordinate, mode: TravelMode) { const settings = travelModes[mode]; return Math.max(1, Math.round(haversineKm(left, right) * settings.roadFactor / settings.speed * 60)); }
function haversineKm(left: Coordinate, right: Coordinate) { const radius = 6371; const latitude = (right.lat - left.lat) * Math.PI / 180; const longitude = (right.lon - left.lon) * Math.PI / 180; const value = Math.sin(latitude / 2) ** 2 + Math.cos(left.lat * Math.PI / 180) * Math.cos(right.lat * Math.PI / 180) * Math.sin(longitude / 2) ** 2; return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)); }
function normalize(value: string) { return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW"); }
