"use client";
import { useMemo, useState } from "react";
import type { School } from "@/lib/school-repository";

export function SchoolSelection({ schools, selected, onToggle, initialDistrict = "", maximum = 4 }: { schools: readonly School[]; selected: readonly string[]; onToggle: (code: string) => void; initialDistrict?: string; maximum?: number }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict);
  const districts = useMemo(() => [...new Set(schools.flatMap(s => s.admissionDistricts))].sort(), [schools]);
  const matches = useMemo(() => schools.filter(s => (!district || s.admissionDistricts.includes(district)) && `${s.name} ${s.code} ${s.city} ${s.area} ${s.departmentRaw} ${s.courseDirection}`.replaceAll('臺', '台').toLowerCase().includes(query.replaceAll('臺', '台').trim().toLowerCase())), [schools, district, query]);
  return <section className="min-w-0 rounded-2xl border p-4 md:p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="grid min-w-0 gap-2">搜尋學校、代碼、科別<input className="min-h-11 w-full min-w-0" value={query} onChange={e => setQuery(e.target.value)} /></label><label className="grid min-w-0 gap-2">招生區<select className="min-h-11 w-full min-w-0" value={district} onChange={e => setDistrict(e.target.value)}><option value="">全部招生區</option>{districts.map(d => <option key={d}>{d}</option>)}</select></label></div><p className="my-4 text-sm" role="status">符合 {matches.length} 所 · 已選 {selected.length}／{maximum} 所；顯示前 60 所，可搜尋縮小範圍。</p><div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">{matches.slice(0, 60).map(s => <label key={s.code} className="flex min-h-11 min-w-0 items-start gap-3 rounded-xl border p-3"><input type="checkbox" checked={selected.includes(s.code)} disabled={!selected.includes(s.code) && selected.length >= maximum} onChange={() => onToggle(s.code)} /><span className="min-w-0 break-words"><strong className="block">{s.name}</strong><span className="text-sm">{s.code} · {s.schoolType} · {s.city} {s.area}</span></span></label>)}</div></section>;
}
