import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import districtMetadata from "../../public/it_hs/district-metadata.json";

const title = "全國就學區｜15 區學校資料與升學工具入口";
const description = "選擇適用就學區，查看學校資料、適用學年度、更新日期，以及目前可使用的積分試算與落點分析功能。";

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

function resolveDistrictTarget(target: FunctionalTarget | undefined, district: District): FunctionalTarget {
  if (target === "calculator" && !district.calculator) return "schools";
  if (target === "analysis" && !district.analysis) return "schools";
  return target || (district.calculator ? "overview" : "schools");
}

function destinationFor(target: FunctionalTarget, code: string) {
  if (target === "calculator") return `/tools?district=${code}`;
  if (target === "analysis") return `/planner?district=${code}`;
  return `/schools?district=${code}`;
}

function Feature({ enabled, children }: { enabled: boolean; children: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${enabled ? "bg-emerald-50 text-[#147a67]" : "bg-slate-100 text-slate-500"}`}>{enabled ? children : `${children}建置中`}</span>;
}

export default async function DistrictsPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string }>;
}) {
  const params = await searchParams;
  const target = normalizeTarget(params.target);
  const activeHref = target === "schools" ? "/schools" : target === "calculator" ? "/tools" : target === "analysis" ? "/planner" : "/districts";
  const requestedLabel = target ? targetLabels[target] : "就學區功能";

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#14213d]">
      <SiteHeader activeHref={activeHref} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-12">
          <p className="text-xs font-black tracking-[.18em] text-[#2868d7]">15 ADMISSION DISTRICTS</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-5xl">先選對就學區，直接進入{requestedLabel}。</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{target ? `選擇地區後會直接開啟${requestedLabel}；若該區規則尚未完成校核，會先進入可用的學校查詢。` : description}</p>
        </div>
      </section>

      <section aria-labelledby="district-list" className="mx-auto w-[min(1120px,calc(100%-32px))] py-14 md:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-black tracking-[.16em] text-[#ba6b18]">全國入口</p><h2 id="district-list" className="mt-3 text-4xl font-black tracking-[-.05em]">選擇你的就學區</h2></div><p className="max-w-md leading-7 text-slate-500">不確定適用哪一區時，先詢問就讀國中的升學承辦人，再查閱當年度官方簡章。</p></div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {districts.map(([code, district]) => {
            const resolvedTarget = resolveDistrictTarget(target, district);
            const destinationLabel = targetLabels[resolvedTarget];
            const fellBackToSchools = Boolean(target && resolvedTarget !== target);
            return (
            <a key={code} href={destinationFor(resolvedTarget, code)} className="group border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:bg-blue-50">
              <div className="flex items-start justify-between gap-3"><span className="text-xs font-black tracking-[.13em] text-[#2868d7]">{code.toUpperCase()}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{district.academicYear} 學年度</span></div>
              <h2 className="mt-5 text-2xl font-black">{district.label}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{district.areas}</p>
              <div className="mt-5 flex flex-wrap gap-2"><Feature enabled={district.schools}>學校查詢</Feature><Feature enabled={district.calculator}>積分試算</Feature><Feature enabled={district.analysis}>落點分析</Feature></div>
              <small className="mt-5 block text-xs text-slate-400">更新：{district.updatedAt || districtMetadata.updatedAt}</small>
              <b className="mt-4 flex items-center justify-between text-sm text-[#173d78]">{fellBackToSchools ? "此區先開啟學校查詢" : `直接開啟${destinationLabel}`} <span className="transition group-hover:translate-x-1">→</span></b>
            </a>
          )})}
        </div>
        <p className="mt-7 text-sm leading-6 text-slate-500">{districtMetadata.disclaimer}</p>
      </section>
      <SiteFooter />
    </main>
  );
}
