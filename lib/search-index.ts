import { newsArticles } from "./news";
import { getOfficialInformationRecords } from "./official-information";
import { routeMetadata, searchableRoutes, type RouteCategory } from "./route-metadata";
import { getSchools } from "./school-repository";
import districtMetadata from "../public/it_hs/district-metadata.json";

export type SearchResultCategory = RouteCategory;

export type SearchResult = Readonly<{
  id: string;
  title: string;
  body: string;
  href: string;
  category: SearchResultCategory;
  meta: string;
  external?: boolean;
  score: number;
}>;

type SearchDocument = Readonly<{
  id: string;
  title: string;
  body: string;
  href: string;
  category: SearchResultCategory;
  meta: string;
  external?: boolean;
  summary?: string;
  aliases: readonly string[];
  keywords: readonly string[];
  categoryWeight: number;
}>;

const categoryWeights: Record<SearchResultCategory, number> = {
  學校: 7,
  科別: 7,
  升學指南: 9,
  積分規則: 10,
  官方資訊: 8,
  日程: 8,
  功能: 6,
  Trust: 5,
  公告: 6,
};

const synonyms: Record<string, readonly string[]> = {
  ai: ["人工智慧", "科技"],
  餐飲: ["餐旅", "烘焙"],
  中投志願序: ["中投", "志願序", "積分規則", "超額比序"],
  中投積分: ["中投", "積分", "超額比序", "志願序"],
  台中: ["臺中", "中投"],
  臺中: ["台中", "中投"],
  志願: ["志願序", "選填", "志願清單"],
  積分: ["超額比序", "比序", "成績"],
  科系: ["科別", "群科", "校科"],
  公告: ["官方資訊", "招生資訊", "簡章"],
  日程: ["時程", "日期", "倒數"],
};

const staticDocuments = searchableRoutes.map((route) => ({
  id: `route:${route.pathname}`,
  title: route.title,
  body: route.description,
  href: route.pathname,
  category: route.category,
  meta: route.indexable ? "公開頁面" : "功能入口",
  aliases: route.aliases,
  keywords: [route.pathname, route.canonical],
  categoryWeight: categoryWeights[route.category],
})) satisfies readonly SearchDocument[];

const schoolDocuments = getSchools().map((school): SearchDocument => ({
  id: `school:${school.code}`,
  title: school.name,
  body: [school.city, school.area, ...school.admissionDistricts, school.schoolType,
    school.departmentRaw, school.features, school.courseDirection, school.project,
    school.transport, school.commute, school.lodging].filter(Boolean).join(" · "),
  summary: `${school.city} ${school.area} · ${school.schoolType} · ${school.departments.map((department) => department.name).slice(0, 4).join("、")} · ${school.admissionDistricts.join("、")}`,
  href: `/schools/${school.code}`,
  category: "學校",
  meta: "115 學年度 · 學校與分區招生資料",
  aliases: [school.code, school.city, school.area, ...school.admissionDistricts],
  keywords: [school.schoolType, school.ownership, school.gender, ...school.departments.map((department) => department.name)],
  categoryWeight: categoryWeights.學校,
}));

const articleDocuments = newsArticles.map((article) => ({
  id: `article:${article.slug}`,
  title: article.title,
  body: `${article.description} ${article.oneLineConclusion} ${article.content}`,
  href: `/news/${article.slug}`,
  category: "公告" as const,
  meta: `更新 ${article.updatedAt} · ${article.districtScope}`,
  aliases: [article.category, article.kicker],
  keywords: article.keywords,
  categoryWeight: categoryWeights.公告,
})) satisfies readonly SearchDocument[];

const officialDocuments = getOfficialInformationRecords().map((record) => ({
  id: `official:${record.id}`,
  title: record.title,
  body: record.summary,
  href: record.sourceUrl,
  category: "官方資訊" as const,
  meta: record.issuer,
  external: /^https?:\/\//i.test(record.sourceUrl),
  aliases: [record.issuer, record.district, record.type],
  keywords: [record.schoolYear, record.dataSchoolYear, record.yearStatus],
  categoryWeight: categoryWeights.官方資訊,
})) satisfies readonly SearchDocument[];

const timelineDocuments = districtMetadata.timelineDefaults.ready.map((item) => ({
  id: `schedule:${item.title}`,
  title: item.title,
  body: item.detail,
  href: "/admission-guides/schedule",
  category: "日程" as const,
  meta: `${item.date} · ${item.status}`,
  aliases: ["官方招生時程", "重要時程"],
  keywords: [item.date, item.status],
  categoryWeight: categoryWeights.日程,
})) satisfies readonly SearchDocument[];

export const searchDocuments: readonly SearchDocument[] = Object.freeze([
  ...staticDocuments,
  ...schoolDocuments,
  ...articleDocuments,
  ...officialDocuments,
  ...timelineDocuments,
]);

export const searchSuggestions = ["中投志願序", "超額比序", "資訊科", "官方簡章", "會考日期", "五專", "學校比較", "AI 隱私"] as const;
export const commonSearchEntrypoints = routeMetadata
  .filter((route) => ["/schools", "/tools/rules", "/admission-guides", "/schedule", "/knowledge", "/trust"].includes(route.pathname))
  .map((route) => ({ title: route.title, href: route.pathname, category: route.category }));

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[臺]/gu, "台")
    .replace(/\s+/gu, "")
    .trim()
    .toLocaleLowerCase("zh-TW");
}

export function tokenizeSearchQuery(value: string): readonly string[] {
  const compact = normalizeSearchText(value);
  if (!compact) return [];
  const explicit = value
    .normalize("NFKC")
    .replace(/[臺]/gu, "台")
    .toLocaleLowerCase("zh-TW")
    .split(/[\s,，、/／｜|]+/u)
    .map(normalizeSearchText)
    .filter(Boolean);
  const expanded = synonyms[compact] || [];
  const chunks = compact.length > 2 ? Array.from({ length: compact.length - 1 }, (_, index) => compact.slice(index, index + 2)) : [];
  return [...new Set([compact, ...explicit, ...expanded.map(normalizeSearchText), ...chunks])].filter(Boolean);
}

export function searchSite(query: string, limit = 60): readonly SearchResult[] {
  const normalizedQuery = normalizeSearchText(query).slice(0, 80);
  const tokens = tokenizeSearchQuery(query);
  if (!normalizedQuery || !tokens.length) return [];

  return searchDocuments
    .map((document) => {
      const title = normalizeSearchText(document.title);
      const alias = normalizeSearchText(document.aliases.join(" "));
      const keywords = normalizeSearchText(document.keywords.join(" "));
      const body = normalizeSearchText(document.body);
      const exactTitle = title.includes(normalizedQuery) ? 80 : 0;
      const exactAlias = alias.includes(normalizedQuery) ? 55 : 0;
      const exactKeyword = keywords.includes(normalizedQuery) ? 35 : 0;
      const exactBody = body.includes(normalizedQuery) ? 16 : 0;
      const tokenScore = tokens.reduce((score, token) => {
        if (!token) return score;
        if (title.includes(token)) return score + 14;
        if (alias.includes(token)) return score + 10;
        if (keywords.includes(token)) return score + 6;
        if (body.includes(token)) return score + 3;
        return score;
      }, 0);
      const score = document.categoryWeight + exactTitle + exactAlias + exactKeyword + exactBody + tokenScore;
      return { ...document, body: document.summary ?? document.body, score };
    })
    .filter((result) => result.score > result.categoryWeight)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-TW"))
    .slice(0, limit);
}
