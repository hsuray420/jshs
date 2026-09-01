import type { Metadata } from "next";
import { KnowledgeTopicWorkspace } from "@/components/knowledge-topic-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CompactFeatureHero } from "@/components/feature-hero";

export const metadata: Metadata = {
  title: "群科介紹｜找學校｜全國國中升學資訊網",
  description: "從學習內容、常見科別與後續升學方向認識高中職群科。",
  alternates: { canonical: "/schools/groups" },
};

export default function SchoolGroupsPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><CompactFeatureHero theme="schools" eyebrow="找學校 · 群科介紹" title="從群科認識學習方向與選校線索" description="用學習內容、常見科別與後續方向建立選擇脈絡。" illustration="career-groups" /><KnowledgeTopicWorkspace topic="groups" /><SiteFooter /></main>;
}
