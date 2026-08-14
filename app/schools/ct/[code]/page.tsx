import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SchoolPlannerAction } from "@/components/school-planner-action";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { centralSchools, getCentralSchool, getRelatedCentralSchools } from "@/lib/central-schools";
import districtMetadata from "../../../../public/it_hs/district-metadata.json";

type SchoolPageProps = {
  params: Promise<{ code: string }>;
};

const district = districtMetadata.districts.ct;

export const dynamicParams = false;

export function generateStaticParams() {
  return centralSchools.map((school) => ({ code: school.code }));
}

export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const { code } = await params;
  const school = getCentralSchool(code);
  if (!school) return {};

  const title = `${school.name}｜科別、招生名額與學校資料`;
  const description = `${school.name}位於${school.city}${school.area}，整理 115 學年度中投區的${school.program || "招生"}科別、名額、地址與官方來源。`;
  return {
    title,
    description,
    alternates: { canonical: `/schools/ct/${school.code}` },
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: `/schools/ct/${school.code}`,
      siteName: "全國國中升學資訊網",
      title,
      description,
    },
  };
}

export default async function CentralSchoolPage({ params }: SchoolPageProps) {
  const { code } = await params;
  const school = getCentralSchool(code);
  if (!school) notFound();

  const canonicalUrl = `https://jshs.cc/schools/ct/${school.code}`;
  const relatedSchools = getRelatedCentralSchools(school);
  const schoolSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.name,
    identifier: school.code,
    url: canonicalUrl,
    sameAs: school.website || undefined,
    telephone: school.phone || undefined,
    address: {
      "@type": "PostalAddress",
      addressRegion: school.city,
      addressLocality: school.area,
      streetAddress: school.address,
      addressCountry: "TW",
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: "https://jshs.cc/" },
      { "@type": "ListItem", position: 2, name: "找學校", item: "https://jshs.cc/schools" },
      { "@type": "ListItem", position: 3, name: "中投區", item: "https://jshs.cc/schools?district=ct" },
      { "@type": "ListItem", position: 4, name: school.name, item: canonicalUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#14213d]">
      <JsonLd data={schoolSchema} />
      <JsonLd data={breadcrumbSchema} />
      <SiteHeader activeHref="/schools" />

      <header className="border-b border-blue-100 bg-[radial-gradient(circle_at_84%_0%,#dcecff,transparent_34%),linear-gradient(135deg,#fff,#edf5ff)]">
        <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-12 md:py-18">
          <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
            <Link href="/">首頁</Link><span aria-hidden="true">/</span>
            <Link href="/schools">找學校</Link><span aria-hidden="true">/</span>
            <Link href="/schools?district=ct">中投區</Link><span aria-hidden="true">/</span>
            <span className="text-[#2868d7]">{school.code}</span>
          </nav>
          <div className="mt-9 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-[#173d78] px-3 py-1.5 text-white">115 學年度</span>
            <span className="rounded-full bg-white px-3 py-1.5 text-[#173d78] shadow-sm">中投區</span>
            {[school.ownership, school.program, school.gender].filter(Boolean).map((label) => (
              <span key={label} className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">{label}</span>
            ))}
          </div>
          <p className="mt-5 text-xs font-black tracking-[.16em] text-[#2868d7]">學校代碼 {school.code}</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black leading-[1.12] tracking-[-.055em] md:text-6xl">{school.name}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">整理校科、招生名額、地址與聯絡方式，協助你先確認選項，再接續比較、試算與志願規劃。</p>
        </div>
      </header>

      <div className="mx-auto grid w-[min(1120px,calc(100%-32px))] gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:py-14">
        <div className="space-y-8">
          <section aria-labelledby="school-overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <h2 id="school-overview" className="sr-only">學校基本資料</h2>
            <FactCard label="學制分類" value={school.program || "請查官方資料"} />
            <FactCard label="公私立" value={school.ownership || "請查官方資料"} />
            <FactCard label="招生名額" value={school.quota ? `${school.quota} 名` : "請查當年度簡章"} />
            <FactCard label="所在地" value={[school.city, school.area].filter(Boolean).join(" ") || "—"} />
          </section>

          <section aria-labelledby="departments" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-black tracking-[.16em] text-[#2868d7]">PROGRAMS & QUOTAS</p>
            <h2 id="departments" className="mt-3 text-3xl font-black tracking-[-.04em]">115 學年度科別與名額</h2>
            <p className="mt-3 leading-7 text-slate-500">以下為中投區免試入學資料中的一般招生名額。實際名額與資格仍以當年度正式簡章及學校公告為準。</p>
            {school.departments.length ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {school.departments.map((department) => (
                  <article key={`${department.name}-${department.quota}`} className="rounded-2xl border border-blue-100 bg-[#f7fbff] p-5">
                    <h3 className="text-lg font-black text-[#173d78]">{department.name}</h3>
                    <p className="mt-3 text-3xl font-black tracking-[-.04em]">{department.quota === null ? "—" : department.quota}<span className="ml-1 text-sm tracking-normal text-slate-500">名</span></p>
                    {department.audience ? <p className="mt-2 text-xs font-bold text-slate-500">招生對象：{department.audience}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl bg-amber-50 p-5 font-bold leading-7 text-amber-900">這筆資料尚未列出科別，請直接核對學校與招生委員會公告。</p>
            )}
          </section>

          <section aria-labelledby="contact" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-black tracking-[.16em] text-[#147a67]">CONTACT</p>
            <h2 id="contact" className="mt-3 text-3xl font-black tracking-[-.04em]">學校位置與聯絡方式</h2>
            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-[110px_1fr]">
              <dt className="font-black text-slate-500">地址</dt><dd className="font-bold leading-6">{school.address || "資料未提供"}</dd>
              <dt className="font-black text-slate-500">電話</dt><dd className="font-bold leading-6">{school.phone || "資料未提供"}</dd>
              <dt className="font-black text-slate-500">招生管道</dt><dd className="font-bold leading-6">{school.admissionTrack || "中投區免試入學"}</dd>
              <dt className="font-black text-slate-500">特色班別</dt><dd className="font-bold leading-6">{school.specialPrograms || "請以學校當年度公告為準"}</dd>
            </dl>
            {school.website ? <a className="mt-7 inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-[#173d78]" href={school.website} target="_blank" rel="noreferrer">前往學校官網 ↗</a> : null}
          </section>

          {school.referenceScore ? (
            <section aria-labelledby="score-reference" className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 md:p-8">
              <p className="text-xs font-black tracking-[.16em] text-amber-700">HISTORICAL REFERENCE</p>
              <h2 id="score-reference" className="mt-3 text-2xl font-black">歷年錄取參考紀錄</h2>
              <p className="mt-4 text-xl font-black text-amber-950">{school.referenceScore}</p>
              <p className="mt-2 text-sm font-bold text-amber-800">資料年度：{school.scoreYear || "未標示"}</p>
              <p className="mt-4 text-sm leading-7 text-amber-900">歷年紀錄不是本年度錄取保證，名額、報名結構與同分比序都可能改變。請只用於建立討論範圍。</p>
            </section>
          ) : null}

          <section aria-labelledby="official-source" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-black tracking-[.16em] text-[#147a67]">FACT CHECK</p>
            <h2 id="official-source" className="mt-3 text-2xl font-black">官方資料來源</h2>
            <p className="mt-4 leading-7 text-slate-600">{school.sourceNote || `${district.academicYear} 學年度中投區免試入學招生資料。`}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
              <a className="rounded-xl bg-[#eaf6f2] px-4 py-3 text-[#116454]" href={district.sourceUrl} target="_blank" rel="noreferrer">{district.sourceName} ↗</a>
              <span className="rounded-xl bg-slate-100 px-4 py-3 text-slate-600">本站更新：{district.updatedAt}</span>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-[2rem] bg-[#173d78] p-6 text-white shadow-2xl shadow-blue-950/15">
            <p className="text-xs font-black tracking-[.14em] text-blue-200">下一步</p>
            <h2 className="mt-3 text-2xl font-black text-white">把這所學校放進你的決策清單</h2>
            <p className="mt-3 text-sm leading-7 text-blue-100">先收藏，再搭配積分與其他校科比較，不必一次決定志願順序。</p>
            <div className="mt-6"><SchoolPlannerAction schoolCode={school.code} schoolName={school.name} departments={school.departmentsRaw} /></div>
            <div className="mt-4 grid gap-2">
              <a className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15" href="/it_hs/guide.htm?district=ct#calculator">開始中投區積分試算 →</a>
              <a className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15" href="/it_hs/guide.htm?district=ct#analysis">進入志願規劃台 →</a>
              <Link className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15" href={`/schools?district=ct&q=${encodeURIComponent(school.code)}`}>返回中投區校科查詢 →</Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black tracking-[.14em] text-[#2868d7]">同區延伸探索</p>
            <div className="mt-4 grid gap-2">
              {relatedSchools.map((related) => (
                <Link key={related.code} href={`/schools/ct/${related.code}`} className="rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50">
                  <b className="block text-sm text-[#173d78]">{related.name}</b>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{related.area} · {related.program}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <SiteFooter />
    </main>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-xs font-black tracking-[.1em] text-slate-400">{label}</span><strong className="mt-2 block text-lg leading-7 text-[#173d78]">{value}</strong></article>;
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
