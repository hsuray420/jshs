import { getNewsCategoryMetadata, NewsCategoryPage } from "@/components/news-category-page";

export const metadata = getNewsCategoryMetadata("exam");

export default function ExamNewsPage() {
  return <NewsCategoryPage categorySlug="exam" />;
}
