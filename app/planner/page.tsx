import type { Metadata } from "next";
import { PlannerHub } from "@/components/planner-hub";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

const title = "我的志願｜先試算，再選填方式";
const description = "先完成成績試算，再選擇系統推薦或自選排序兩種填志願方式。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/planner" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const member = await getMemberSession();
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/planner" />
      <PlannerHub isMember={Boolean(member)} />
      <SiteFooter />
    </main>
  );
}
