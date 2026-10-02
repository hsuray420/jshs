"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import articles from "@/content/guide/articles.json";

type Article = (typeof articles)[number];

export function GuideKnowledgeCenter({ backendArticles = [] }: { backendArticles?: readonly Article[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [year, setYear] = useState("all");
  const catalog = useMemo(() => {
    const merged = [...backendArticles, ...articles];
    return Array.from(new Map(merged.map((article) => [article.slug, article])).values());
  }, [backendArticles]);
  const categories = Array.from(new Set(catalog.map((article) => article.category)));
  const districts = Array.from(new Set(catalog.flatMap((article) => article.districts)));
  const years = Array.from(new Set(catalog.map((article) => article.academicYear)));
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-TW");
    return catalog.filter((article) => {
      const searchable = [article.title, article.summary, article.body, ...article.tags].join(" ").toLocaleLowerCase("zh-TW");
      return (!normalized || searchable.includes(normalized)) && (category === "all" || article.category === category) && (district === "all" || article.districts.includes(district)) && (year === "all" || article.academicYear === year);
    });
  }, [catalog, category, district, query, year]);
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10" aria-label="升學知識中心">
    <div className="jshs-surface-card p-6 md:p-8">
      <p className="jshs-eyebrow">可查詢、可核對、持續更新</p><h2 className="mt-2 text-3xl">升學知識中心</h2><p className="mt-3 max-w-3xl text-sm leading-7 jshs-muted-copy">內容由官方來源整理，保存學年度、適用區域、發布／更新日與最後核對時間。規則仍以當年度原始簡章為準。</p>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-black md:col-span-2">搜尋指南、名詞與 FAQ<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：志願序、五專、超額比序" /></label>
        <Filter label="分類" value={category} onChange={setCategory} options={categories} /><Filter label="適用區域" value={district} onChange={setDistrict} options={districts} /><Filter label="學年度" value={year} onChange={setYear} options={years} />
      </div>
    </div>
    <div className="mt-8 flex items-end justify-between gap-3"><div><p className="jshs-eyebrow">搜尋結果</p><h2 className="mt-1 text-2xl">{filtered.length} 篇可閱讀內容</h2></div><Link href="/trust/sources" className="text-sm font-black text-[var(--jshs-primary)]">查看來源政策 →</Link></div>
    {filtered.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((article) => <ArticleCard key={article.id} article={article} />)}</div> : <div className="mt-4 rounded-2xl border border-dashed p-8 text-center"><p className="font-black">找不到符合條件的內容</p><p className="mt-2 text-sm jshs-muted-copy">請換個關鍵字或清除篩選；若官方資料尚未公告，請先查看官方資訊入口。</p><button type="button" className="mt-4 px-4 py-3 text-sm jshs-button-secondary" onClick={() => { setQuery(""); setCategory("all"); setDistrict("all"); setYear("all"); }}>清除條件</button></div>}
    <div className="mt-8 rounded-2xl bg-[var(--jshs-muted-surface)] p-5 text-sm leading-7 jshs-muted-copy"><strong className="text-[var(--jshs-ink)]">資料狀態：</strong>目前內容以 115 學年度官方來源作為可核對參考；116 學年度尚未公告的欄位會標示待公告，不會用舊資料冒充新規則。</div>
  </section>;
}

function ArticleCard({ article }: { article: Article }) {
  return <article className="flex min-h-64 flex-col p-6 jshs-surface-card"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[var(--jshs-brand-tint)] px-3 py-1 font-black text-[var(--jshs-primary)]">{article.category}</span><span className="rounded-full bg-[var(--jshs-muted-surface)] px-3 py-1">{article.academicYear} 學年度</span></div><h3 className="mt-4 text-xl">{article.title}</h3><p className="mt-3 flex-1 text-sm leading-7 jshs-muted-copy">{article.summary}</p><p className="mt-4 text-xs jshs-muted-copy">最後核對：{article.lastCheckedAt} · {article.districts.join("、")}</p><Link href={`/knowledge/${article.slug}`} className="mt-4 inline-flex w-fit px-4 py-3 text-sm jshs-button-primary">閱讀並查看來源 →</Link></article>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return <label className="grid gap-2 text-sm font-black">{label}<select value={value} onChange={(event) => onChange(event.target.value)}><option value="all">全部</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
