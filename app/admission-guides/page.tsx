import type { Metadata } from "next";
import { AdmissionGuideLibrary } from "@/components/admission-guide-library";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = { title: "官方簡章與規則｜116 學年度升學資訊", description: "查閱 15 個免試就學區的官方簡章、規則與原始招生網站，明確區分服務年度與來源年度。", alternates: { canonical: "/admission-guides" } };

export default function AdmissionGuidesPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/admission-guides" /><FeatureHero theme="official" eyebrow="官方資訊 · 簡章與規則" title="從官方來源查閱各區簡章與規則" description="依就學區查看原始招生網站、官方簡章與規則，並保留服務年度與來源年度。" illustration="official-document" /><DistrictGate><AdmissionGuideLibrary /></DistrictGate><SiteFooter /></main>;
}
