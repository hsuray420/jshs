import { getNewsCategoryMetadata, NewsCategoryPage } from "@/components/news-category-page";

export const metadata = getNewsCategoryMetadata("rules");

export default function RulesNewsPage() {
  return <NewsCategoryPage categorySlug="rules" />;
}
