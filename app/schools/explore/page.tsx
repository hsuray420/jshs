import type { Metadata } from "next";
import { SchoolDiscoveryExplorer } from "@/components/school-discovery-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "探索學校｜全國國中升學資訊網", description: "依就學區、縣市、公私立、學制與科別探索高中職。", alternates: { canonical: "/schools/explore" } };

export default function SchoolExplorePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><SchoolDiscoveryExplorer /><SiteFooter /></main>;
}
