import type { Metadata } from "next";
import { AdmissionHistoryExplorer } from "@/components/admission-history-explorer";
import { SchoolAlumniExplorer } from "@/components/school-alumni-explorer";
import { CommuteComparison } from "@/components/commute-comparison";
import { SchoolCostPlanner } from "@/components/school-cost-planner";
import { SchoolExplorer, type SchoolExplorerFilters } from "@/components/school-explorer";
import { SchoolMapExplorer } from "@/components/school-map-explorer";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDistrictOptions } from "@/lib/school-directory";

const title = "找學校｜全國高中職、校科與五專探索";
const description = "從全國就學區、校科、十五群科與五專路徑探索升學選項，將學習內容、通勤與後續發展放在同一套決策流程。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/schools" },
  openGraph: { type: "website", locale: "zh_TW", url: "/schools", siteName: "全國國中升學資訊網", title, description },
};

export default async function SchoolsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const view = params.view || "schools";
  const initialFilters: SchoolExplorerFilters = {
    district: params.district || "all",
    query: params.q?.slice(0, 100) || "",
    program: params.program || "all",
    ownership: params.ownership || "all",
    city: params.city || "all",
    quota: params.quota === "yes" || params.quota === "no" ? params.quota : "all",
    history: params.history === "yes" || params.history === "no" ? params.history : "all",
  };
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/schools" />
      <DistrictGate initialDistrict={params.district}>
        {view === "history" ? <AdmissionHistoryExplorer districtOptions={schoolDistrictOptions} initialDistrict={params.district} />
          : view === "alumni" ? <SchoolAlumniExplorer districtOptions={schoolDistrictOptions} initialDistrict={params.district} />
            : view === "map" ? <SchoolMapExplorer districtOptions={schoolDistrictOptions} initialDistrict={params.district} />
              : view === "cost" ? <SchoolCostPlanner />
                : view === "commute" ? <CommuteComparison districtOptions={schoolDistrictOptions} initialDistrict={params.district} />
                  : <SchoolExplorer districtOptions={schoolDistrictOptions} initialFilters={initialFilters} />}
      </DistrictGate>
      <SiteFooter />
    </main>
  );
}
