import { getNewsCategoryMetadata, NewsCategoryPage } from "@/components/news-category-page";

export const metadata = getNewsCategoryMetadata("strategy");

export default function StrategyNewsPage() {
  return <NewsCategoryPage categorySlug="strategy" />;
}
