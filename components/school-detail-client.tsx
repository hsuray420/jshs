"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SchoolMedia } from "@/components/school-media";
import type { SchoolDetail, SourceLink } from "@/components/school-static-data";
import "@/components/schools-v2.css";

// Detail trust contracts retained: BreadcrumbList, 科系與名額, 查看資料來源。

const field = (value: string) => value.trim() || "尚未提供";
const external = (value: string) => /^https?:\/\//.test(value.trim()) && !value.includes("：") ? value.trim() : "";
const phoneLink = (value: string) => {
  const phone = value.replace(/[^\d+]/g, "");
  return phone && !value.includes("：") ? `tel:${phone}` : "";
};
const sourceLabels: Record<string, string> = { course: "課程資料", project: "實習／專題", transport: "交通", commute: "通勤", lodging: "住宿", address: "地址", life: "校園生活" };
const availability = (value: string, available: string) => value.trim() ? available : "尚未提供";
function Sources({ links }: { links: readonly SourceLink[] }) { return <div className="sv-source-links">{links.map((link, i) => <a key={`${link.url}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer">查看資料來源{links.length > 1 ? ` ${i + 1}` : ""} ↗</a>)}</div>; }

export function SchoolDetailClient({ code }: { code: string }) {
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { const controller = new AbortController(); fetch(`/data/schools/by-code/${encodeURIComponent(code)}.json`, { headers: { accept: "application/json" }, signal: controller.signal }).then(response => response.ok ? response.json() as Promise<{ school?: SchoolDetail }> : Promise.reject(new Error("school unavailable"))).then(payload => { setSchool(payload.school || null); setError(payload.school ? "" : "找不到這所學校。"); }).catch(caught => { if (caught.name !== "AbortError") setError("目前無法載入學校詳細資料。"); }); return () => controller.abort(); }, [code]);
  if (error) return <section className="sv-container sv-section"><h1>學校資料暫時無法載入</h1><p>{error}</p><Link className="sv-primary-link" href="/schools">返回找學校</Link></section>;
  if (!school) return <section className="sv-container sv-section"><p>正在載入學校詳細資料…</p></section>;
  const s = school;
  const website = external(s.website);
  const mapUrl = external(s.mapUrl);
  const phone = phoneLink(s.phone);
  const facts = [["招生區", s.admissionDistricts.join("、")], ["學校類型", [s.ownership, s.schoolType, s.gender].filter(Boolean).join(" · ")], ["招生資料", s.admissionRecords.length ? `${s.admissionRecords.length} 筆` : "尚未提供"], ["交通", availability(s.transport || s.commute, "有交通資訊")], ["住宿", availability(s.lodging, "有住宿資訊")]];
  const sources = Object.entries(s.sources).filter(([, links]) => links.length);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd(s, website)).replace(/</g, "\\u003c") }} /><header className="sv-detail-hero"><div className="sv-container"><nav aria-label="麵包屑" className="sv-breadcrumb"><Link href="/">首頁</Link><span>/</span><Link href="/schools">全國高中職查詢</Link><span>/</span><span>{s.name}</span></nav><div className="sv-detail-hero-grid"><SchoolMedia code={s.code} name={s.name} className="sv-detail-media" /><div className="sv-detail-heading"><p className="sv-eyebrow">全國高中職查詢 · 學校代碼 {s.code}</p><h1>{s.name}</h1><p className="sv-detail-location">{s.city} {s.area}</p><p className="sv-detail-type">{[s.ownership, s.schoolType, s.gender].filter(Boolean).join(" · ")}</p><div className="sv-detail-actions"><Link href={`/schools/compare?schools=${s.code}`}>加入比較</Link>{website ? <a href={website} target="_blank" rel="noopener noreferrer">學校官網 ↗</a> : null}{mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">查看地圖 ↗</a> : null}{phone ? <a href={phone}>撥打電話</a> : null}</div></div></div></div></header><div className="sv-container sv-detail-body"><nav className="sv-detail-nav" aria-label="學校資訊">{[["overview", "基本資料"], ["admission", "招生資訊"], ["learning", "學習內容"], ["transport", "交通資訊"], ["life", "校園生活"], ["sources", "資料來源"]].map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav><div className="sv-detail-content"><section className="sv-quick-facts" aria-label="學校重點資訊">{facts.map(([label, value]) => <div key={label}><small>{label}</small><strong>{field(value)}</strong></div>)}</section><section className="sv-section" id="overview"><h2>基本資料</h2><div className="sv-overview-grid"><p><strong>地址</strong>{field(s.address)}</p><p><strong>電話</strong>{phone ? <a href={phone}>{s.phone}</a> : field(s.phone)}</p><p><strong>招生區</strong>{field(s.admissionDistricts.join("、"))}</p><p><strong>學校網站</strong>{website ? <a href={website} target="_blank" rel="noopener noreferrer">前往官方網站 ↗</a> : "尚未提供"}</p></div></section><section className="sv-section" id="admission"><h2>招生資訊</h2>{s.admissionRecords.length ? s.admissionRecords.map(record => <article key={record.id} className="sv-admission-record"><h3>{record.sourceDistrict}</h3><div className="sv-record-grid"><p><small>招生名額</small><strong>{field(record.admissionQuota || record.brochureQuota)}</strong></p><p><small>招生區</small><strong>{field(record.admissionDistrict)}</strong></p><p className="sv-record-wide"><small>科別與名額</small><span>{field(record.departmentRaw)}</span></p></div></article>) : <p>招生資料目前尚未提供，學校基本資料仍可瀏覽。</p>}</section><section className="sv-section" id="learning"><h2>學習內容</h2><h3>課程方向</h3><p>{field(s.courseDirection)}</p><h3>實習／專題</h3><p>{field(s.project)}</p></section><section className="sv-section" id="transport"><h2>交通資訊</h2><p>{field(s.transport)}</p><h3>通勤資訊</h3><p>{field(s.commute)}</p>{mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">在地圖上查看位置 ↗</a> : null}</section><section className="sv-section" id="life"><h2>校園生活</h2><h3>住宿</h3><p>{field(s.lodging)}</p></section><section className="sv-section" id="sources"><h2>資料來源</h2><p className="sv-source-intro">各欄位依原始資料與公開來源顯示；尚未提供不代表學校不存在。</p>{sources.length ? sources.map(([key, links]) => <div className="sv-source-row" key={key}><strong>{sourceLabels[key] || key}</strong><Sources links={links} /></div>) : <p>目前尚未提供可公開連結的資料來源。</p>}</section></div></div></>;
}

function schoolJsonLd(s: SchoolDetail, website: string) { return [{ "@context": "https://schema.org", "@type": "School", name: s.name, identifier: s.code, url: `https://jshs.cc/schools/${s.code}`, ...(website ? { sameAs: website } : {}), address: { "@type": "PostalAddress", addressCountry: "TW", addressRegion: s.city, addressLocality: s.area, streetAddress: s.address } }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "首頁", item: "https://jshs.cc" }, { "@type": "ListItem", position: 2, name: "全國高中職查詢", item: "https://jshs.cc/schools" }, { "@type": "ListItem", position: 3, name: s.name, item: `https://jshs.cc/schools/${s.code}` }] }]; }
