import type { Metadata } from "next";
import { AdmissionPathFinder } from "@/components/admission-path-finder";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "升學路徑與資格判定中心｜全國國中升學資訊網", description: "回答幾個關於學籍、所在地與升學需求的問題，整理可能適用的升學路徑、原因、文件與官方依據。", alternates: { canonical: "/eligibility" } };

export default function EligibilityPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/eligibility" /><DistrictGate><AdmissionPathFinder /></DistrictGate><SiteFooter /></main>;
}
