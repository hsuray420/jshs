import { getNewsCategoryMetadata, NewsCategoryPage } from "@/components/news-category-page";

export const metadata = getNewsCategoryMetadata("schools");

export default function SchoolsNewsPage() {
  return <NewsCategoryPage categorySlug="schools" />;
}
