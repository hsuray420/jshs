import type { Metadata } from "next";
import { listPublishedContent, parseContentBody } from "../../../../../db/content-store";
import { FeatureHero } from "../../../../../components/feature-hero";
import { MockAnswerWorkspace, type MockAnswerQuestion } from "../../../../../components/mock-answer-workspace";
import { MockScoreEmptyState } from "../../../../../components/mock-score-empty-state";
import { SiteFooter } from "../../../../../components/site-footer";
import { SiteHeader } from "../../../../../components/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "模擬考對答案｜全國國中升學資訊網", robots: { index: false, follow: false } };

type SourceBody = { questions?: MockAnswerQuestion[]; sourceUrl?: string; sourceType?: string; status?: string };

export default async function MockAnswersPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  const slug = decodeURIComponent(exam);
  const entry = (await listPublishedContent("mock_exam_source")).find((candidate) => candidate.slug === slug);
  const body = entry ? parseContentBody<SourceBody>(entry, {}) : {};
  const questions = Array.isArray(body.questions) ? body.questions.filter((question) => question && typeof question.id === "string" && typeof question.prompt === "string" && typeof question.answer === "string") : [];
  return <main className="min-h-screen jshs-page-shell jshs-feature-mock-exam"><SiteHeader activeHref="/scores/mock" /><FeatureHero theme="mock-exam" eyebrow="模擬考 · 對答案" title={entry?.title || "模擬考對答案"} description="答案由後台發布後才會顯示；結果只代表本次作答。" illustration="score-history" />{entry && questions.length ? <MockAnswerWorkspace questions={questions} sourceUrl={body.sourceUrl} sourceLabel={body.sourceType || "後台發布來源"} /> : <MockScoreEmptyState examName={slug} /> }<SiteFooter /></main>;
}
