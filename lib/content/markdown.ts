import type { ContentDocument, ContentMetadata } from "./types";

function parseValue(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true" || trimmed === "false") return trimmed === "true";
  if (/^-?\d+(\.\d+)?$/u.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try { return JSON.parse(trimmed); } catch { /* fall through to string */ }
  }
  return trimmed.replace(/^['"]|['"]$/gu, "");
}

export function parseFrontmatter<T extends ContentMetadata = ContentMetadata>(source: string, filePath: string): ContentDocument<T> {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/u);
  if (!match) throw new Error(`Content file must contain YAML frontmatter: ${filePath}`);
  const metadata = Object.fromEntries(match[1].split(/\r?\n/u).filter(Boolean).map((line) => {
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`Invalid frontmatter in ${filePath}: ${line}`);
    return [line.slice(0, separator).trim(), parseValue(line.slice(separator + 1))];
  })) as T;
  return Object.freeze({ metadata, content: match[2].trim(), path: filePath });
}

export function renderMarkdown(source: string): string {
  return source
    .replace(/^### (.+)$/gimu, "<h3>$1</h3>")
    .replace(/^## (.+)$/gimu, "<h2>$1</h2>")
    .replace(/^# (.+)$/gimu, "<h1>$1</h1>")
    .replace(/^- (.+)$/gimu, "<li>$1</li>")
    .replace(/^> (.+)$/gimu, "<blockquote>$1</blockquote>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/gu, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gu, "<em>$1</em>")
    .replace(/`([^`]+)`/gu, "<code>$1</code>")
    .split(/\n{2,}/u)
    .map((block) => block.startsWith("<h") || block.startsWith("<li>") ? block : `<p>${block.replace(/\n/gu, " ")}</p>`)
    .join("\n");
}
