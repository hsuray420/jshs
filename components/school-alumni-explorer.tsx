"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlumniSharing } from "@/components/alumni-sharing";

type Review = Readonly<{ id: string; district: string; school_code: string; school_name: string; nickname: string; graduation_year: string; exam_score: string; admission_score: string; admission_result: string; content: string; created_at: string }>;
type School = Readonly<{ districtCode: string; code: string; name: string; city: string; area: string }>;
type History = Readonly<{ districtCode: string; code: string; referenceScore: string; scoreYear: string }>;

export function SchoolAlumniExplorer({ districtOptions, initialDistrict = "all", initialSchoolCode = "" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string; initialSchoolCode?: string }) {
  const [reviews, setReviews] = useState<readonly Review[]>([]);
  const [schools, setSchools] = useState<readonly School[]>([]);
  const [history, setHistory] = useState<readonly History[]>([]);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "all");
  const [selectedSchoolCode, setSelectedSchoolCode] = useState(initialSchoolCode);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/school-reviews", { headers: { accept: "application/json" } }).then(async (response) => response.ok ? response.json() as Promise<{ reviews?: Review[] }> : { reviews: [] }),
      fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } }).then(async (response) => response.ok ? response.json() as Promise<{ schools?: School[] }> : { schools: [] }),
      fetch("/it_hs/admission-history.json", { headers: { accept: "application/json" } }).then(async (response) => response.ok ? response.json() as Promise<{ schools?: History[] }> : { schools: [] }),
    ]).then(([reviewPayload, schoolPayload, historyPayload]) => {
      if (!active) return;
      setReviews(Array.isArray(reviewPayload.reviews) ? reviewPayload.reviews : []);
      setSchools(Array.isArray(schoolPayload.schools) ? schoolPayload.schools : []);
      setHistory(Array.isArray(historyPayload.schools) ? historyPayload.schools : []);
    }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return reviews.filter((review) => {
      const haystack = normalize(`${review.school_name} ${review.school_code} ${review.content} ${review.nickname}`);
      return (!needle || haystack.includes(needle)) && (district === "all" || review.district === district);
    });
  }, [district, query, reviews]);
  const selectableSchools = useMemo(() => schools.filter((school) => district === "all" || school.districtCode === district).sort((a, b) => a.name.localeCompare(b.name, "zh-TW")), [district, schools]);
  const selectedSchool = schools.find((school) => school.code === selectedSchoolCode && (district === "all" || school.districtCode === district));
  const selectedHistory = history.find((item) => item.code === selectedSchoolCode && item.districtCode === selectedSchool?.districtCode);
  const districtLabels = useMemo(() => new Map(districtOptions.map((option) => [option.code, option.label])), [districtOptions]);

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">學長姐分享</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">先聽過來人的真實經驗，再看分數。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">這裡集中顯示使用者留下的非官方經驗；每一則都只是個人經驗，不能取代當年度官方公告。選擇學校後，可以匿名分享會考成績與錄取結果。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12">
      <div className="grid gap-4 p-5 jshs-surface-card md:grid-cols-[1fr_220px] md:p-7"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校或分享內容<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：中科實驗、通勤、課程" /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => { setDistrict(event.target.value); setSelectedSchoolCode(""); }}><option value="all">全部就學區</option>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><span className="jshs-chip">目前 {filtered.length} 則分享</span><span className="text-xs leading-5 text-slate-500">非官方內容，請自行核對年度與校科。</span></div>
      <section className="mt-7 p-5 jshs-surface-card"><p className="jshs-eyebrow">匿名分享</p><h2 className="mt-2 text-2xl font-black">選一間學校，分享你的會考與錄取經驗</h2><label className="mt-4 grid max-w-xl gap-2 text-sm font-black text-[var(--jshs-primary)]">學校<select value={selectedSchoolCode} onChange={(event) => setSelectedSchoolCode(event.target.value)}><option value="">請選擇學校</option>{selectableSchools.map((school) => <option key={`${school.districtCode}:${school.code}`} value={school.code}>{school.name}（{school.code}）</option>)}</select></label>{selectedSchool ? <div className="mt-6"><AlumniSharing district={selectedSchool.districtCode} schoolCode={selectedSchool.code} referenceScore={selectedHistory?.referenceScore || ""} scoreYear={selectedHistory?.scoreYear || ""} /></div> : <p className="mt-4 text-sm leading-6 jshs-muted-copy">送出前請先選擇學校；內容會先進入待審核資料表，管理員審核後才公開。</p>}</section>
      {loading ? <div className="mt-6 p-8 text-center jshs-surface-card">正在載入學長姐分享…</div> : null}
      {loadError ? <div className="mt-6 p-8 text-center jshs-surface-card"><h2 className="text-xl">分享暫時無法載入</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">請稍後重新整理。</p></div> : null}
      {!loading && !loadError && filtered.length ? <div className="mt-7 grid gap-4 lg:grid-cols-2">{filtered.map((review) => <article key={review.id} className="p-5 jshs-surface-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black tracking-[.12em] text-[var(--jshs-primary)]">{districtLabels.get(review.district) || review.district} · {review.school_code}</p><h2 className="mt-2 text-xl font-black">{review.school_name}</h2></div><span className="jshs-chip">非官方分享</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="jshs-chip">{review.nickname || "匿名學長姐"}</span>{review.graduation_year ? <span className="jshs-chip">{review.graduation_year} 畢業</span> : null}{review.exam_score ? <span className="jshs-chip">會考成績：{review.exam_score}</span> : null}{review.admission_score ? <span className="jshs-chip">最低錄取：{review.admission_score}</span> : null}{review.admission_result ? <span className="jshs-chip">錄取結果：{review.admission_result}</span> : null}</div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{review.content}</p><Link className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]" href={`/schools/alumni?district=${review.district}&schoolCode=${review.school_code}`}>選擇這間並留下分享 →</Link></article>)}</div> : null}
      {!loading && !loadError && !filtered.length ? <div className="mt-6 rounded-2xl border border-dashed border-[var(--jshs-border)] p-8 text-center"><h2 className="text-xl font-black">目前還沒有符合條件的公開分享</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">先從上方選擇學校，就可以留下第一則待審核經驗。</p></div> : null}
    </section>
  </>;
}

function normalize(value: string) {
  return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW");
}
