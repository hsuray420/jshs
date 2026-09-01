import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const routeMetadata = await readJson("content/route-metadata.json");
const newsCatalog = await readJson("content/news.json");
const centralSchoolsCsv = await readFile(resolve(root, "public/it_hs/ct/schools.csv"), "utf8");
const searchSource = await readFile(resolve(root, "lib/search-index.ts"), "utf8");

for (const required of ["normalizeSearchText", "tokenizeSearchQuery", "categoryWeights", "synonyms", "title.includes", "alias.includes"]) {
  assert.match(searchSource, new RegExp(required), `search-index.ts should contain ${required}`);
}

const documents = [
  ...routeMetadata.routes.filter((route) => !route.legacy).map((route) => ({
    title: route.title,
    body: route.description,
    category: route.category,
    aliases: route.aliases,
    keywords: [route.pathname, route.canonical],
    weight: route.category === "積分規則" ? 10 : route.category === "升學指南" ? 9 : route.category === "官方資訊" ? 8 : route.category === "學校" || route.category === "科別" ? 7 : 5,
  })),
  ...newsCatalog.articles.map((article) => ({
    title: article.title,
    body: article.description,
    category: "公告",
    aliases: [article.category, article.kicker],
    keywords: article.keywords,
    weight: 6,
  })),
  ...centralSchoolsCsv.split(/\r?\n/u).slice(1).filter(Boolean).slice(0, 120).map((line) => {
    const columns = line.split(",");
    return {
      title: columns[2] || "",
      body: `${columns[4] || ""} ${columns[7] || ""} ${columns[12] || ""}`,
      category: "學校",
      aliases: [columns[1] || "", "中投區"],
      keywords: [columns[5] || "", columns[12] || ""],
      weight: 7,
    };
  }),
];

const cases = [
  ["中投志願序", ["積分規則", "志願與積分"]],
  ["台中 資訊科", ["資訊科", "學校"]],
  ["臺中 資訊科", ["資訊科", "學校"]],
  ["官方簡章", ["官方", "官方簡章與規則"]],
  ["AI 隱私", ["AI", "隱私"]],
];

for (const [query, expectedFragments] of cases) {
  const results = search(query).slice(0, 8);
  assert.ok(results.length > 0, `${query}: expected results`);
  const joined = results.slice(0, 3).map((result) => `${result.title} ${result.category} ${result.body}`).join(" ");
  for (const fragment of expectedFragments) assert.match(joined, new RegExp(fragment), `${query}: top results should include ${fragment}`);
}

const topForCentral = search("中投志願序").slice(0, 3);
assert.ok(topForCentral.some((result) => result.category === "積分規則"), "中投志願序 should prioritize score/rule content");
assert.equal(search("火星香蕉鉛筆").length, 0);

console.log("Search audit passed: normalization, synonyms, weighting, categories, and empty results verified.");

function search(query) {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);
  if (!normalizedQuery || !tokens.length) return [];
  return documents
    .map((document) => {
      const title = normalize(document.title);
      const alias = normalize(document.aliases.join(" "));
      const keywords = normalize(document.keywords.join(" "));
      const body = normalize(document.body);
      const score = document.weight
        + (title.includes(normalizedQuery) ? 80 : 0)
        + (alias.includes(normalizedQuery) ? 55 : 0)
        + (keywords.includes(normalizedQuery) ? 35 : 0)
        + (body.includes(normalizedQuery) ? 16 : 0)
        + tokens.reduce((sum, token) => sum + (title.includes(token) ? 14 : alias.includes(token) ? 10 : keywords.includes(token) ? 6 : body.includes(token) ? 3 : 0), 0);
      return { ...document, score };
    })
    .filter((result) => result.score > result.weight)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-TW"));
}

function normalize(value) {
  return String(value).normalize("NFKC").replace(/[臺]/gu, "台").replace(/\s+/gu, "").trim().toLocaleLowerCase("zh-TW");
}

function tokenize(value) {
  const compact = normalize(value);
  if (!compact) return [];
  const synonyms = {
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
  const explicit = String(value).normalize("NFKC").replace(/[臺]/gu, "台").toLocaleLowerCase("zh-TW").split(/[\s,，、/／｜|]+/u).map(normalize).filter(Boolean);
  const expanded = synonyms[compact] || [];
  const chunks = compact.length > 2 ? Array.from({ length: compact.length - 1 }, (_, index) => compact.slice(index, index + 2)) : [];
  return [...new Set([compact, ...explicit, ...expanded.map(normalize), ...chunks])].filter(Boolean);
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}
