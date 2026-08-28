import type { Metadata } from "next";
import { KnowledgeTopicWorkspace } from "@/components/knowledge-topic-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "群科介紹｜找學校｜全國國中升學資訊網",
  description: "從學習內容、常見科別與後續升學方向認識高中職群科。",
  alternates: { canonical: "/schools/groups" },
};

export default function SchoolGroupsPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><KnowledgeTopicWorkspace topic="groups" /><SiteFooter /></main>;
}
