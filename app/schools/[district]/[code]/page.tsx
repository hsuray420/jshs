import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SchoolDecisionActions } from "@/components/school-decision-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRelatedSchools, getSchoolDirectoryRecord, schoolDirectory } from "@/lib/school-directory";
import { getMemberSession } from "@/lib/member-auth";
import { SourceBadge } from "@/components/source-badge";

type SchoolPageProps = { params: Promise<{ district: string; code: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return schoolDirectory.map((school) => ({ district: school.districtCode, code: school.code }));
}

export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const { district, code } = await params;
  const school = getSchoolDirectoryRecord(district, code);
  if (!school) return {};
  const title = `${school.name}｜${school.districtLabel}校科詳情與招生資料`;
  const description = `查看${school.name}的學制分類、科系與名額、招生資訊、生活條件與官方來源。資料年度：${school.academicYear}學年度。`;
  return { title, description, alternates: { canonical: `/schools/${district}/${code}` }, openGraph: { type: "website", locale: "zh_TW", url: `/schools/${district}/${code}`, siteName: "全國國中升學資訊網", title, description } };
}

export default async function SchoolDetailPage({ params }: SchoolPageProps) {
  const { district, code } = await params;
  const school = getSchoolDirectoryRecord(district, code);
  if (!school) notFound();
  const relatedSchools = getRelatedSchools(school);
  const canonicalUrl = `https://jshs.cc/schools/${school.districtCode}/${school.code}`;
  const schoolSchema = { "@context": "https://schema.org", "@type": "EducationalOrganization", name: school.name, identifier: school.code, url: canonicalUrl, sameAs: school.website || undefined, telephone: school.phone || undefined, address: { "@type": "PostalAddress", addressRegion: school.city, addressLocality: school.area, streetAddress: school.address, addressCountry: "TW" } };

  return (
    <main className="min-h-screen jshs-page-shell">
      <JsonLd data={schoolSchema} />
      <SiteHeader activeHref="/schools" />
      <header className="jshs-hero-section">
        <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-12 md:py-18">
          <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href="/schools">找學校</Link><span aria-hidden="true">/</span><Link href={`/schools?district=${school.districtCode}`}>{school.districtLabel}</Link><span aria-hidden="true">/</span><span className="text-[var(--jshs-primary)]">{school.code}</span></nav>
          <div className="mt-8 flex flex-wrap items-center gap-2"><span className="jshs-chip">{school.districtLabel}</span><span className="jshs-chip">{school.academicYear} 學年度</span><span className="jshs-chip">{school.dataStatus === "ready" ? "資料已校核" : "參考資料"}</span><SourceBadge sourceType="jshs_curated" /></div>
          <p className="mt-5 jshs-eyebrow">學校代碼 {school.code}</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black leading-[1.12] tracking-[-.055em] md:text-6xl">{school.name}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 jshs-muted-copy">把學制分類、學習內容、招生資訊與生活條件放在同一頁，再決定是否加入你的規劃。</p>
        </div>
      </header>

      <nav aria-label="學校詳情分頁" className="border-b border-slate-200 bg-white"><div className="mx-auto flex w-[min(1120px,calc(100%-32px))] gap-2 overflow-x-auto py-4">{[["overview", "一眼看懂"], ["learning", "學習內容"], ["admission", "招生資訊"], ["life", "生活條件"], ["decision", "決策操作"]].map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 px-4 py-2 text-sm jshs-button-secondary">{label}</a>)}</div></nav>

      <div className="mx-auto grid w-[min(1120px,calc(100%-32px))] gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
        <div className="space-y-4">
          <SchoolSection id="overview" title="一眼看懂" eyebrow="OVERVIEW" open><div className="flex flex-wrap items-center gap-3"><SourceBadge sourceType="jshs_curated" /><span className="text-sm jshs-muted-copy">JSHS 將公開學校資料整理成可查詢欄位。</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Fact label="學制分類" value={school.program || "待確認"} /><Fact label="縣市" value={school.city || "待確認"} /><Fact label="區" value={school.area || "待確認"} /><Fact label="公私立" value={school.ownership || "待確認"} /><Fact label="目前資料年度" value={`${school.academicYear} 學年度`} /></div><p className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-7 text-slate-700">資料狀態：{school.dataStatus === "ready" ? "本區資料已整理，可作為初步比較" : "本區為參考資料，請等待或回查當年度正式公告"}。</p></SchoolSection>

          <SchoolSection id="learning" title="學習內容" eyebrow="LEARNING"><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div><h3 className="font-black">科系與名額</h3>{school.departments.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{school.departments.map((department) => <li key={`${department.name}-${department.quota}`} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><strong className="text-[var(--jshs-primary)]">{department.name}</strong><span className="mt-2 block text-sm text-slate-600">招生名額：{department.quota === null ? "待公告" : department.quota} · {department.audience ? `招生對象：${department.audience}` : "招生對象依簡章"}</span></li>)}</ul> : <MissingField label="科系與名額" />}{school.courseDirection ? <InfoBlock title="課程方向" value={school.courseDirection} /> : <MissingField label="課程方向" />}</div><div className="rounded-2xl border border-[var(--jshs-border)] p-5"><h3 className="font-black">實習／專題</h3>{school.internshipProject ? <p className="mt-3 text-sm leading-7 text-slate-600">{school.internshipProject}</p> : <MissingField label="實習／專題" />}{school.specialPrograms ? <InfoBlock title="資優班/特色班" value={school.specialPrograms} /> : <MissingField label="資優班/特色班" />}<h3 className="mt-6 font-black">適合學生</h3>{school.suitableStudents ? <p className="mt-3 text-sm leading-7 text-slate-600">{school.suitableStudents}</p> : <MissingField label="適合學生" />}</div></div></SchoolSection>

          <SchoolSection id="admission" title="招生資訊" eyebrow="ADMISSION"><div className="flex flex-wrap items-center gap-3"><SourceBadge sourceType="jshs_curated" /><span className="text-sm jshs-muted-copy">以下結構化欄位是 JSHS 整理；正式名額、資格與日期請以官方來源核對。</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Fact label="招生名額" value={school.quota || (school.hasQuota ? "依科別資料彙整" : "待公告")} /><Fact label="招生區" value={school.admissionTrack || `${school.districtLabel}免試入學`} /><Fact label="正式簡章連結" value={school.brochureUrl ? "已提供官方連結" : "請以本區官方入口最新版本為準"} /><Fact label="JSHS 整理來源" value={school.sourceName} /></div><div className="mt-6 flex flex-wrap items-center gap-3"><SourceBadge sourceType="official" /><a className="px-4 py-3 text-sm jshs-button-primary" href={school.sourceUrl} target="_blank" rel="noreferrer">查看正式招生來源 ↗</a>{school.brochureUrl ? <a className="px-4 py-3 text-sm jshs-button-secondary" href={school.brochureUrl} target="_blank" rel="noreferrer">查看正式簡章 ↗</a> : null}{school.website ? <a className="px-4 py-3 text-sm jshs-button-secondary" href={school.website} target="_blank" rel="noreferrer">查看學校官方網站 ↗</a> : null}</div></SchoolSection>

          <SchoolSection id="life" title="生活條件" eyebrow="LIFE & COMMUTE"><div><dl className="grid gap-4 text-sm sm:grid-cols-[120px_1fr]"><dt className="font-black text-slate-500">地址</dt><dd className="font-bold leading-6">{school.address || "資料未提供"}</dd><dt className="font-black text-slate-500">電話</dt><dd className="font-bold leading-6">{school.phone || "資料未提供"}</dd><dt className="font-black text-slate-500">交通方式</dt><dd className="font-bold leading-6">{school.transport || "CSV 尚未提供，請以學校官方資料確認"}</dd><dt className="font-black text-slate-500">通勤資訊</dt><dd className="font-bold leading-6">{school.commuteInfo || "CSV 尚未提供，請用家庭實際出發地確認"}</dd><dt className="font-black text-slate-500">住宿資訊</dt><dd className="font-bold leading-6">{school.boardingInfo || "CSV 尚未提供，請以學校官方資料確認"}</dd><dt className="font-black text-slate-500">生活資料來源</dt><dd className="font-bold leading-6">{school.lifeSource || "CSV 尚未提供，請以學校官方資料確認"}</dd></dl></div><p className="mt-5 text-xs leading-6 text-slate-500">地址來源：{school.sourceName}；{school.lifeSource ? `生活資料來源：${school.lifeSource}；` : "生活資料尚未由 CSV 提供；"}</p></SchoolSection>

          <SchoolSection id="decision" title="決策操作" eyebrow="DECISION"><SchoolDecisionActions district={school.districtCode} schoolCode={school.code} schoolName={school.name} departments={school.departmentsRaw} isMember={Boolean(await getMemberSession())} /></SchoolSection>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><section className="p-6 jshs-surface-card"><p className="jshs-eyebrow">資料信任</p><h2 className="mt-3 text-2xl font-black">先確認版本，再做規劃。</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">本站整理到 {school.updatedAt}；名額、資格、簡章與報名日期仍以官方最新公告為準。</p><Link className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-secondary" href={`/schools?district=${school.districtCode}&q=${encodeURIComponent(school.code)}`}>返回搜尋結果 →</Link></section><section className="p-6 jshs-surface-card"><p className="jshs-eyebrow">同區延伸探索</p><div className="mt-4 grid gap-2">{relatedSchools.map((related) => <Link key={`${related.districtCode}-${related.code}`} href={`/schools/${related.districtCode}/${related.code}`} className="rounded-2xl border border-[var(--jshs-border)] p-4 hover:bg-[var(--jshs-muted-surface)]"><b className="block text-sm text-[var(--jshs-primary)]">{related.name}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{related.districtLabel} · {related.area} · {related.program}</span></Link>)}</div></section></aside>
      </div>
      <SiteFooter />
    </main>
  );
}

function SchoolSection({ id, title, eyebrow, open = false, children }: { id: string; title: string; eyebrow: string; open?: boolean; children: ReactNode }) {
  return <details id={id} open={open} className="scroll-mt-24 p-6 md:p-8 jshs-surface-card"><summary className="cursor-pointer list-none"><p className="jshs-eyebrow">{eyebrow}</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{title}</h2></summary><div className="mt-6">{children}</div></details>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><span className="block text-xs font-black text-slate-400">{label}</span><strong className="mt-2 block leading-6 text-[var(--jshs-primary)]">{value}</strong></div>;
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return <div className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h4 className="font-black text-[var(--jshs-primary)]">{title}</h4><p className="mt-2 text-sm leading-7 text-slate-600">{value}</p></div>;
}

function MissingField({ label }: { label: string }) {
  return <p className="mt-3 rounded-2xl border border-dashed border-[var(--jshs-border)] bg-white p-4 text-sm leading-6 text-slate-500">{label}：CSV 尚未提供；目前不推估。</p>;
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
