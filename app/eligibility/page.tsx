import type { Metadata } from "next";
import { AdmissionPathFinder } from "@/components/admission-path-finder";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "特殊入學與資格｜升學指南｜全國國中升學資訊網", description: "整理特色招生、直升、跨區、外加名額與特殊身分的初步確認方向。", alternates: { canonical: "/eligibility" } };

export default function EligibilityPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><DistrictGate><AdmissionPathFinder /></DistrictGate><SiteFooter /></main>;
}
