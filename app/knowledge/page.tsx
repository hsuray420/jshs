import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";
import { GuideKnowledgeCenter } from "@/components/guide-knowledge-center";
import guideNavigation from "@/content/guide/navigation.json";
import { getPublishedGuideArticles } from "@/lib/guide-center-server";

// 保留既有導覽資料契約；前台卡片已改由知識中心資料目錄渲染。
export const guideSections = guideNavigation.sections;
// 導覽相容標籤：升學入門、志願與積分、特殊入學與資格、升學百科、生涯探索、升學動態。

export const metadata: Metadata = {
  title: "升學指南｜全國國中升學資訊網",
  description: "從升學入門、志願與積分、特殊入學與資格、升學百科到生涯探索，建立升學判斷。",
  alternates: { canonical: "/knowledge" },
};

export default async function KnowledgePage() {
  const articles = await getPublishedGuideArticles();
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><FeatureHero theme="guide" eyebrow="升學指南" title="先建立升學全貌，再做自己的選擇" description="白話理解制度與探索方向；精確規則與官方公告仍可回到對應功能核對。" illustration="guide" /><GuideKnowledgeCenter backendArticles={articles} /><SiteFooter /></main>;
}
