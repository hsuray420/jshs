import type { Metadata } from "next";
import { SchoolCostPlanner } from "@/components/school-cost-planner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "費用試算｜找學校｜全國國中升學資訊網", description: "區分官方金額、JSHS 估算與自行輸入的升學費用。", alternates: { canonical: "/schools/cost" } };

export default function CostRoute() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><SchoolCostPlanner /><SiteFooter /></main>;
}
