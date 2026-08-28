import districtMetadata from "../public/it_hs/district-metadata.json";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR } from "@/lib/trust";

export function OfficialPlatformLinks() {
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="p-6 jshs-surface-card"><p className="text-sm leading-7 jshs-muted-copy">這裡只提供官方入口導向，不代替資格審查、志願填寫或正式送出。服務年度為 {SERVICE_YEAR}；目前可查到的入口資料來源為 {SOURCE_ACADEMIC_YEAR} 學年度，請以各區最新公告為準。</p><div className="mt-5 grid gap-3 md:grid-cols-2">{Object.entries(districtMetadata.districts).map(([code, district]) => <article key={code} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h2 className="text-lg">{district.label}</h2><p className="mt-1 text-sm text-slate-500">資料來源 {district.academicYear} 學年度 · {district.dataStatus === "ready" ? "入口可查，116 狀態仍待公告" : "請再次核對公告"}</p><a className="mt-4 inline-flex min-h-11 items-center px-4 py-3 text-sm jshs-button-primary" href={district.sourceUrl} target="_blank" rel="noreferrer">前往官方入口 ↗</a></article>)}</div></div></section>;
}
