"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminSchoolListItem = { code: string; name: string; ownership: string; schoolType: string; city: string; area: string; districts: string[]; regions: string[]; address: string; website: string; transport: string; commute: string; lodging: string; hasImage: boolean };

export function AdminSchoolsBrowser({ schools }: { schools: AdminSchoolListItem[] }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [health, setHealth] = useState("");
  const cities = useMemo(() => [...new Set(schools.map((school) => school.city).filter(Boolean))].sort(), [schools]);
  const districts = useMemo(() => [...new Set(schools.flatMap((school) => school.districts).filter(Boolean))].sort(), [schools]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase().replaceAll("台", "臺");
    return schools.filter((school) => {
      const text = [school.code, school.name, school.city, school.area, ...school.districts].join(" ").toLocaleLowerCase().replaceAll("台", "臺");
      if (needle && !text.includes(needle)) return false;
      if (district && !school.districts.includes(district)) return false;
      if (city && school.city !== city) return false;
      const missingAddress = !school.address || school.address === "目前沒有資料";
      const missingSource = !school.website || school.website === "目前沒有資料";
      if (health === "complete" && (missingAddress || missingSource)) return false;
      if (health === "attention" && !missingAddress && !missingSource && school.hasImage) return false;
      return true;
    });
  }, [city, district, health, query, schools]);
  return <section className="admin-school-browser"><div className="admin-panel admin-school-search"><div className="admin-search-row"><label className="admin-search-field"><span>搜尋學校</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="學校代碼、校名、縣市或區域" /></label><label><span>就學區</span><select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="">全部就學區</option>{districts.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>縣市</span><select value={city} onChange={(event) => setCity(event.target.value)}><option value="">全部縣市</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>資料狀態</span><select value={health} onChange={(event) => setHealth(event.target.value)}><option value="">全部狀態</option><option value="complete">基本資料完整</option><option value="attention">需要注意</option></select></label></div><p className="admin-muted admin-search-result-count">顯示 {results.length} / {schools.length} 所 · 僅讀取正式 School repository</p></div><div className="admin-school-list">{results.map((school) => { const missing = [!school.address && "缺地址", !school.website && "缺來源", !school.hasImage && "缺圖片"].filter(Boolean) as string[]; const region = school.regions.length === 1 ? `?region=${encodeURIComponent(school.regions[0])}` : ""; return <article className="admin-school-card" key={school.code}><div className="admin-school-card-main"><div className="admin-school-card-title"><span className="admin-school-code">{school.code}</span><h2>{school.name}</h2></div><div className="admin-school-meta"><span>{school.districts.join("、") || "未標示區域"}</span><span>{school.city}{school.area ? ` · ${school.area}` : ""}</span><span>{school.ownership}</span><span>{school.schoolType}</span></div></div><div className="admin-school-health">{missing.length ? <span className="admin-badge warn">{missing.join(" · ")}</span> : <span className="admin-badge ok">基本資料完整</span>}<Link className="admin-button-secondary" href={`/admin/schools/${encodeURIComponent(school.code)}${region}`}>查看／編輯</Link></div></article>})}{!results.length ? <div className="admin-panel admin-empty-state"><strong>找不到符合條件的學校</strong><p>請調整代碼、名稱、就學區或縣市篩選。</p></div> : null}</div></section>;
}
