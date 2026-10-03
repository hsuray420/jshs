import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRegionById } from "@/lib/region-registry";
import districtMetadata from "../../public/it_hs/district-metadata.json";

const title = "選擇就學區｜15 區學校資料與升學工具";
const description = "選擇適用就學區後，回到找學校、成績分析或我的志願使用對應資料。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/districts" },
  openGraph: { type: "website", locale: "zh_TW", url: "/districts", siteName: "全國國中升學資訊網", title, description },
};

type District = (typeof districtMetadata.districts)[keyof typeof districtMetadata.districts];
const districts = Object.entries(districtMetadata.districts) as Array<[string, District]>;
type FunctionalTarget = "overview" | "schools" | "calculator" | "analysis";

const targetLabels: Readonly<Record<FunctionalTarget, string>> = {
  overview: "升學總覽",
  schools: "學校查詢",
  calculator: "積分試算",
  analysis: "落點與志願規劃",
};

function normalizeTarget(value?: string): FunctionalTarget | undefined {
  return ["schools", "calculator", "analysis"].includes(value || "")
    ? value as FunctionalTarget
    : undefined;
}

function getRegionStatus(code: string) {
  return getRegionById(code);
}

function resolveDistrictTarget(target: FunctionalTarget | undefined, code: string, district: District): FunctionalTarget {
  const region = getRegionStatus(code);
  if (target === "schools" && region?.schoolDataStatus !== "available") return "overview";
  if (target === "calculator" && region?.calculatorStatus !== "available") return "overview";
  if (target === "analysis" && (region?.calculatorStatus !== "available" || !district.analysis)) return "overview";
  return target || "overview";
}

function destinationFor(target: FunctionalTarget, code: string) {
  if (target === "calculator") return `/tools?district=${code}`;
  if (target === "analysis") return `/planner?district=${code}`;
  if (target === "overview") return `/districts`;
  return `/schools?district=${code}`;
}

function Feature({ enabled, children }: { enabled: boolean; children: string }) {
  return <span className={`jshs-chip ${enabled ? "" : "opacity-70"}`}>{enabled ? children : `${children}資料驗證中`}</span>;
}

function DataStatus({ value }: { value: string }) {
  const label = value === "ready" ? "已校核" : value === "reference" ? "參考資料" : "整理中";
  return <span className={`jshs-data-tag ${value === "ready" ? "is-verified" : value === "reference" ? "is-reference" : "is-pending"}`}>{label}</span>;
}

function AvailabilityTag({ status }: { status: string }) {
  const available = status === "available";
  return <span className={`jshs-data-tag ${available ? "is-verified" : "is-pending"}`}>{available ? "可使用" : "資料驗證中"}</span>;
}

export default async function DistrictsPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string }>;
}) {
  const params = await searchParams;
  const target = normalizeTarget(params.target);
  const activeHref = target === "schools" ? "/schools" : target === "calculator" ? "/scores" : target === "analysis" ? "/planner" : "/districts";
  const requestedLabel = target ? targetLabels[target] : "就學區功能";

  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref={activeHref} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-12">
          <p className="jshs-eyebrow">15 ADMISSION DISTRICTS</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-5xl">先選對就學區，直接進入{requestedLabel}。</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{target ? `選擇地區後會直接開啟${requestedLabel}；找學校與積分試算依目前通過驗證的區域資料提供。` : description}</p>
        </div>
      </section>

      <section aria-labelledby="district-list" className="mx-auto w-[min(1120px,calc(100%-32px))] py-14 md:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="jshs-eyebrow">全國入口</p><h2 id="district-list" className="mt-3 text-4xl font-black tracking-[-.05em]">選擇你的就學區</h2></div><p className="max-w-md leading-7 jshs-muted-copy">不確定適用哪一區時，先詢問就讀國中的升學承辦人，再查閱當年度官方簡章。</p></div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {districts.map(([code, district]) => {
            const region = getRegionStatus(code);
            const schoolDataAvailable = region?.schoolDataStatus === "available";
            const calculatorAvailable = region?.calculatorStatus === "available";
            const resolvedTarget = resolveDistrictTarget(target, code, district);
            const destinationLabel = targetLabels[resolvedTarget];
            const fellBackToSchools = Boolean(target && resolvedTarget !== target);
            return (
            <article key={code} className={`group p-5 jshs-surface-card ${schoolDataAvailable ? "" : "opacity-75"}`}>
              <div className="flex items-start justify-between gap-3"><span className="text-xs font-black tracking-[.13em] text-[var(--jshs-primary)]">{code.toUpperCase()}</span><span className="jshs-chip">{district.academicYear} 學年度</span></div>
              <h2 className="mt-5 text-2xl font-black">{district.label}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 jshs-muted-copy">{district.areas}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2"><AvailabilityTag status={region?.schoolDataStatus || "unavailable"} /><DataStatus value={schoolDataAvailable ? district.dataStatus : "verifying"} /><span className="jshs-chip">{district.academicYear} 學年度</span></div>
              <div className="mt-3 flex flex-wrap gap-2"><Feature enabled={schoolDataAvailable}>學校查詢</Feature><Feature enabled={calculatorAvailable}>積分試算</Feature><Feature enabled={calculatorAvailable && district.analysis}>落點分析</Feature><Feature enabled={calculatorAvailable}>規則</Feature></div>
              <small className="mt-5 block text-xs text-slate-400">更新：{district.updatedAt || districtMetadata.updatedAt}</small>
              <p className="mt-3 text-sm leading-6 text-slate-600">{schoolDataAvailable && calculatorAvailable ? `主要任務：${district.tasks?.[0] || "先確認適用區域與官方公告"}` : "本區資料驗證中，學校查詢與成績試算尚未開放；完成驗證後會再開放使用。"}</p>
              <a className="mt-3 inline-block text-xs text-[var(--jshs-primary)]" href={district.sourceUrl} target="_blank" rel="noreferrer">官方委員會／來源 ↗</a>
              <a className="mt-4 flex items-center justify-between text-sm text-[var(--jshs-primary)]" href={destinationFor(resolvedTarget, code)}>{fellBackToSchools ? "查看目前可用入口" : `直接開啟${destinationLabel}`} <span className="transition group-hover:translate-x-1">→</span></a>
            </article>
          )})}
        </div>
        <p className="mt-7 text-sm leading-6 text-slate-500">{districtMetadata.disclaimer}</p>
      </section>
      <SiteFooter />
    </main>
  );
}
