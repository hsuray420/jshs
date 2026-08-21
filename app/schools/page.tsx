import type { Metadata } from "next";
import { SchoolExplorer } from "@/components/school-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import districtMetadata from "../../public/it_hs/district-metadata.json";

const title = "找學校｜全國高中職、校科與五專探索";
const description = "從全國就學區、校科、十五群科與五專路徑探索升學選項，將學習內容、通勤與後續發展放在同一套決策流程。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/schools" },
  openGraph: { type: "website", locale: "zh_TW", url: "/schools", siteName: "全國國中升學資訊網", title, description },
};

const districtOptions = Object.entries(districtMetadata.districts).map(([code, district]) => ({
  code,
  label: district.label,
}));

export default async function SchoolsPage({ searchParams }: { searchParams: Promise<{ district?: string; q?: string }> }) {
  const params = await searchParams;
  const initialDistrict = districtOptions.some((item) => item.code === params.district) ? params.district! : "ct";
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/schools" />
      <SchoolExplorer districtOptions={districtOptions} initialDistrict={initialDistrict} initialQuery={params.q?.slice(0, 100) || ""} />
      <SiteFooter />
    </main>
  );
}
