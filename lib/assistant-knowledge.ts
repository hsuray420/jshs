import districtMetadata from "../public/it_hs/district-metadata.json";
import { newsArticles } from "./news";
import { menuGroups } from "./site-map";
import { schoolDirectory } from "./school-directory";

export type AssistantSource = Readonly<{
  title: string;
  url: string;
  snippet: string;
}>;

type KnowledgeEntry = AssistantSource & { searchable: string };

const menuEntries = menuGroups.flatMap((group) => flattenMenuItems(group.items));
const districtEntries = Object.entries(districtMetadata.districts).map(([code, district]) => ({
  title: `${district.label}就學區資料`,
  url: `https://jshs.cc/districts?target=schools`,
  snippet: `${district.label}：${district.areas}；${district.academicYear} 學年度；資料狀態 ${district.dataStatus}；${district.tasks.join("；")}；來源：${district.sourceName} ${district.sourceUrl}`,
  searchable: `${district.label} ${district.areas} ${district.academicYear} ${district.tasks.join(" ")} ${code}`,
}));
const articleEntries = newsArticles.map((article) => ({
  title: article.title,
  url: `https://jshs.cc/news/${article.slug}`,
  snippet: `${article.description} ${article.oneLineConclusion} ${article.summary.join("；")} ${article.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]).join("；")} 來源：${article.sources.map((source) => `${source.label} ${source.url}`).join("；")}`,
  searchable: `${article.title} ${article.description} ${article.keywords.join(" ")} ${article.summary.join(" ")}`,
}));
const schoolEntries = schoolDirectory.map((school) => ({
  title: `${school.name}｜${school.program}`,
  url: `https://jshs.cc/schools/${school.districtCode}/${school.code}`,
  snippet: `${school.districtLabel} ${school.city}${school.area}；${school.program}；群科：${school.groups.join("、") || "未標示"}；科別：${school.departmentsRaw || "未標示"}；通勤：${school.commuteInfo || "未標示"}；資料年度：${school.academicYear}；來源：${school.sourceName} ${school.sourceUrl}`,
  searchable: `${school.name} ${school.program} ${school.departmentsRaw} ${school.groups.join(" ")} ${school.city} ${school.area} ${school.districtLabel}`,
}));
const entries: readonly KnowledgeEntry[] = Object.freeze([
  ...menuEntries,
  ...districtEntries,
  ...articleEntries,
  ...schoolEntries,
]);

export function searchSiteKnowledge(question: string, limit = 8): readonly AssistantSource[] {
  const terms = getSearchTerms(question);
  if (!terms.length) return [];
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry.searchable, terms) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title, "zh-TW"))
    .slice(0, limit)
    .map(({ entry }) => ({ title: entry.title, url: entry.url, snippet: entry.snippet.slice(0, 1800) }));
}

export function formatAssistantContext(sources: readonly AssistantSource[]) {
  return sources.map((source, index) => `[${index + 1}] ${source.title}\nURL: ${source.url}\n內容：${source.snippet}`).join("\n\n");
}

function getSearchTerms(question: string) {
  const normalized = question.toLocaleLowerCase("zh-TW").replace(/\s/g, "");
  const terms = new Set<string>();
  for (const token of normalized.split(/[，。！？、,!?；;:：/\\]+/u)) if (token.length >= 2) terms.add(token);
  for (let index = 0; index < normalized.length - 1; index += 1) {
    const pair = normalized.slice(index, index + 2);
    if (/[^\u3400-\u9fff]/u.test(pair)) continue;
    terms.add(pair);
  }
  return [...terms].filter((term) => term.length >= 2).slice(0, 80);
}

function scoreEntry(searchable: string, terms: readonly string[]) {
  const haystack = searchable.toLocaleLowerCase("zh-TW");
  return terms.reduce((score, term) => score + (haystack.includes(term) ? (term.length > 2 ? 3 : 1) : 0), 0);
}

function flattenMenuItems(items: readonly { label: string; href: string; description: string; children?: readonly { label: string; href: string; description: string }[] }[]): KnowledgeEntry[] {
  return items.flatMap((item) => [
    { title: item.label, url: `https://jshs.cc${item.href}`, snippet: item.description, searchable: `${item.label} ${item.description}` },
    ...flattenMenuItems(item.children || []),
  ]);
}
