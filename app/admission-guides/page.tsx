import type { Metadata } from "next";
import { AdmissionGuideLibrary } from "@/components/admission-guide-library";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "各區簡章下載｜115 學年度免試入學", description: "下載與查閱 15 個免試就學區的 115 學年度官方免試入學簡章。", alternates: { canonical: "/admission-guides" } };

export default function AdmissionGuidesPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/eligibility" /><DistrictGate><AdmissionGuideLibrary /></DistrictGate><SiteFooter /></main>;
}
