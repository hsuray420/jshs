"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SchoolDetail, SourceLink } from "@/components/school-static-data";
import "@/components/schools-v2.css";

const field = (value: string) => value.trim() || "目前沒有資料";
const external = (value: string) => /^https?:\/\//.test(value.trim()) && !value.includes("：") ? value.trim() : "";

function Sources({ links }: { links: readonly SourceLink[] }) {
  return <div className="sv-source-links">{links.map((link, i) => <a key={`${link.url}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer" title={link.label}>查看資料來源{links.length > 1 ? ` ${i + 1}` : ""} ↗</a>)}</div>;
}

export function SchoolDetailClient({ code }: { code: string }) {
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/data/schools/by-code/${encodeURIComponent(code)}.json`, { headers: { accept: "application/json" }, signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ school?: SchoolDetail }> : Promise.reject(new Error(`school ${code} ${response.status}`)))
      .then((payload) => {
        setSchool(payload.school || null);
        setError(payload.school ? "" : "找不到這所學校。");
      })
      .catch((caught) => { if (caught.name !== "AbortError") setError("目前無法載入學校詳細資料。"); });
    return () => controller.abort();
  }, [code]);
  if (error) return <section className="sv-container sv-section"><h1>學校資料暫時無法載入</h1><p>{error}</p><Link className="sv-button" href="/schools">返回找學校</Link></section>;
  if (!school) return <section className="sv-container sv-section"><p>正在載入學校詳細資料…</p></section>;
  const s = school;
  const website = external(s.website);
  const mapUrl = external(s.mapUrl);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd(s, website)).replace(/</g, "\\u003c") }} /><header className="sv-hero"><div className="sv-container"><nav aria-label="麵包屑" className="sv-breadcrumb"><Link href="/">首頁</Link><span>/</span><Link href="/schools">全國高中職查詢</Link><span>/</span><span>{s.code}</span></nav><p className="sv-eyebrow">學校代碼 {s.code} · 115 學年度招生</p><h1>{s.name}</h1><p>{[s.ownership,s.schoolType,s.gender,`${s.city} ${s.area}`].filter(Boolean).join(" · ")}</p><p>招生區：{s.admissionDistricts.join("、")}</p><div className="sv-detail-links">{website && <a href={website} target="_blank" rel="noopener noreferrer">學校官方網站 ↗</a>}{mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer">Google 地圖 ↗</a>}{s.phone && !s.phone.includes("：") && <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}>{s.phone}</a>}<Link href={`/schools/compare?schools=${s.code}`}>比較學校 ↗</Link></div></div></header><div className="sv-container sv-detail-body"><nav className="sv-detail-nav" aria-label="學校資訊">{[["basic", "基本資料"], ["admission", "招生資訊"], ["learning", "學習內容"], ["transport", "交通"], ["life", "校園生活"], ["sources", "資料來源"]].map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav><div className="sv-results"><section className="sv-section" id="basic"><h2>基本資料</h2><dl><dt>學校名稱</dt><dd>{field(s.name)}</dd><dt>學校代碼</dt><dd>{field(s.code)}</dd><dt>公私立</dt><dd>{field(s.ownership)}</dd><dt>學制分類</dt><dd>{field(s.schoolType)}</dd><dt>男女校</dt><dd>{field(s.gender)}</dd><dt>縣市</dt><dd>{field(s.city)}</dd><dt>區</dt><dd>{field(s.area)}</dd><dt>地址</dt><dd>{field(s.address)}</dd><dt>電話</dt><dd>{field(s.phone)}</dd><dt>官網</dt><dd>{website ? <a href={website} target="_blank" rel="noopener noreferrer">{website}</a> : field(s.website)}</dd></dl></section><section className="sv-section" id="admission"><h2>招生資訊</h2>{s.admissionRecords.map(record => <article key={record.id} className="rounded-xl border p-4"><h3>{record.sourceDistrict}</h3><dl><dt>招生區</dt><dd>{field(record.admissionDistrict)}</dd><dt>學制分類</dt><dd>{field(record.raw["學制分類"])}</dd><dt>男女校</dt><dd>{field(record.raw["男女校"])}</dd><dt>科系與名額</dt><dd className="whitespace-pre-wrap">{field(record.departmentRaw)}</dd><dt>簡章招生名額</dt><dd>{field(record.brochureQuota)}</dd><dt>招生名額</dt><dd>{field(record.admissionQuota)}</dd><dt>資優班/特色班</dt><dd>{field(record.raw["資優班/特色班"])}</dd></dl></article>)}</section><section className="sv-section" id="learning"><h2>學習內容</h2><h3>課程方向</h3><p>{field(s.courseDirection)}</p><h3>實習／專題</h3><p>{field(s.project)}</p></section><section className="sv-section" id="transport"><h2>交通</h2><h3>校車／專車資訊</h3><p>{field(s.transport)}</p><h3>通勤資訊</h3><p>{field(s.commute)}</p><h3>Google地圖</h3>{mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">{mapUrl}</a> : <p className="break-words whitespace-pre-wrap">{field(s.mapUrl)}</p>}</section><section className="sv-section" id="life"><h2>校園生活</h2><h3>住宿資訊</h3><p>{field(s.lodging)}</p></section><section className="sv-section" id="sources"><h2>資料來源</h2>{([["course","課程資料來源"],["project","實習專題資料來源"],["transport","校車／專車資料來源"],["commute","通勤資料來源"],["lodging","住宿資料來源"],["address","地址資料來源"],["life","生活資料來源"]] as const).map(([key, title]) => <div key={key}><h3>{title}</h3>{s.sourceMetadata[title] ? <p className="break-words whitespace-pre-wrap">{s.sourceMetadata[title]}</p> : <p>{field("")}</p>}{s.sources[key].length ? <Sources links={s.sources[key]} /> : null}</div>)}<div><h3>資料更新日期</h3><p>{field(s.sourceMetadata["資料更新日期"])}</p></div></section></div></div></>;
}

function schoolJsonLd(s: SchoolDetail, website: string) {
  return [{ "@context": "https://schema.org", "@type": "School", name: s.name, identifier: s.code, url: `https://jshs.cc/schools/${s.code}`, ...(website ? { sameAs: website } : {}), ...(s.phone && !s.phone.includes("：") ? { telephone: s.phone } : {}), address: { "@type": "PostalAddress", addressCountry: "TW", addressRegion: s.city, addressLocality: s.area, streetAddress: s.address } }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "首頁", item: "https://jshs.cc" }, { "@type": "ListItem", position: 2, name: "全國高中職查詢", item: "https://jshs.cc/schools" }, { "@type": "ListItem", position: 3, name: s.name, item: `https://jshs.cc/schools/${s.code}` }] }];
}
