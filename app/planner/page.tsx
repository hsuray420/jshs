import type { Metadata } from "next";
import { PlannerWorkspace } from "@/components/planner-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const title = "我的升學規劃｜收藏、志願與待辦";
const description = "整理收藏校科、志願結構、待辦清單與重要日期；個人規劃保存在使用中的瀏覽器，不建立公開搜尋頁面。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/planner" },
  robots: { index: false, follow: false },
};

export default function PlannerPage() {
  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#14213d]">
      <SiteHeader activeHref="/planner" />
      <PlannerWorkspace />
      <SiteFooter />
    </main>
  );
}
