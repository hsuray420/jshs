import { getNewsCategoryMetadata, NewsCategoryPage } from "@/components/news-category-page";

export const metadata = getNewsCategoryMetadata("career");

export default function CareerNewsPage() {
  return <NewsCategoryPage categorySlug="career" />;
}
