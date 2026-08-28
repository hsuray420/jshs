import { redirect } from "next/navigation";

const legacyTools = ["history", "alumni", "map", "cost", "commute"] as const;
type LegacyTool = (typeof legacyTools)[number];

export const dynamicParams = false;

export function generateStaticParams() {
  return legacyTools.map((district) => ({ district }));
}

export default async function LegacySchoolToolRoute({ params, searchParams }: { params: Promise<{ district: string }>; searchParams: Promise<{ district?: string; schoolCode?: string }> }) {
  const { district: tool } = await params;
  const query = await searchParams;
  if (!legacyTools.includes(tool as LegacyTool)) redirect("/schools");
  const next = new URLSearchParams({ view: tool });
  if (query.district) next.set("district", query.district);
  if (query.schoolCode) next.set("schoolCode", query.schoolCode);
  redirect(`/schools?${next.toString()}`);
}
