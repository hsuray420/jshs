import { getNewsCategoryMetadata, NewsCategoryPage } from "@/components/news-category-page";

export const metadata = getNewsCategoryMetadata("parents");

export default function ParentsNewsPage() {
  return <NewsCategoryPage categorySlug="parents" />;
}
