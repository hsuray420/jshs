import type { Metadata } from "next";
import { AdmissionCalculator } from "@/components/admission-calculator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const title = "升學工具｜從積分試算到志願清單";
const description = "集中使用積分試算、落點分析、志願清單、校科比較、通勤比較與升學時程，讓每次查資料都能留下可執行的結果。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tools" },
  openGraph: { type: "website", locale: "zh_TW", url: "/tools", siteName: "全國國中升學資訊網", title, description },
};

export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/tools" />
      <AdmissionCalculator initialDistrict={params.district === "tp" ? "tp" : "ct"} />
      <SiteFooter />
    </main>
  );
}
