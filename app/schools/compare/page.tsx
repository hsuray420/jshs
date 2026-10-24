import type { Metadata } from "next";
import { SchoolComparisonExplorer } from "@/components/school-comparison-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "學校比較｜全國國中升學資訊網",
  description: "選擇 2 至 4 所學校，比較招生、課程、交通與住宿資訊。",
  alternates: { canonical: "/schools/compare" },
};

export default async function SchoolRoute({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; schools?: string }>;
}) {
  const params = await searchParams;
  const initialSchools =
    typeof params.schools === "string"
      ? params.schools.split(",").map((code) => code.trim()).filter(Boolean).slice(0, 4)
      : [];

  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/schools" />
      <SchoolComparisonExplorer
        initialDistrict={params.district}
        initialSchools={initialSchools}
      />
      <SiteFooter />
    </main>
  );
}
