import { renderMarkdown } from "@/lib/content";

export function ContentRenderer({ content }: { content: string }) {
  return <div className="content-renderer jshs-article-copy" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
}
