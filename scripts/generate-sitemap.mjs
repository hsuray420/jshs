import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { toSchoolRecords } from "../lib/school-catalog.mjs";

const root = process.cwd();
const districtMetadata = await readJson("public/it_hs/district-metadata.json");

const updatedAt = districtMetadata.updatedAt;
const staticEntries = [
  entry("/", updatedAt, "weekly", "1.0"),
  entry("/it_5/it_5.html", updatedAt, "weekly", "0.7"),
  entry("/news", updatedAt, "weekly", "0.8"),
  entry("/admission-guides", updatedAt, "monthly", "0.8"),
  entry("/admission-guides/schedule", updatedAt, "weekly", "0.8"),
  entry("/schools", updatedAt, "weekly", "0.9"),
  entry("/schools/groups", updatedAt, "monthly", "0.7"),
  entry("/tools", updatedAt, "weekly", "0.9"),
  entry("/tools/rules", updatedAt, "monthly", "0.8"),
  entry("/tools/placement", updatedAt, "monthly", "0.7"),
  entry("/tools/summary", updatedAt, "monthly", "0.7"),
  entry("/tools/history", updatedAt, "monthly", "0.7"),
  entry("/planner", updatedAt, "weekly", "0.8"),
  entry("/planner/versions", updatedAt, "monthly", "0.6"),
  entry("/planner/export", updatedAt, "monthly", "0.6"),
  entry("/planner/official-platform", updatedAt, "monthly", "0.7"),
  entry("/schedule", updatedAt, "weekly", "0.9"),
  ...["timeline", "now", "tasks"].map((slug) => entry(`/schedule/${slug}`, updatedAt, "weekly", "0.8")),
  entry("/knowledge", updatedAt, "monthly", "0.8"),
  ...["admission-basics", "rules", "glossary", "fit-quiz"].map((slug) => entry(`/knowledge/${slug}`, updatedAt, "monthly", "0.7")),
  entry("/eligibility", updatedAt, "monthly", "0.7"),
  ...["sources", "status", "progress", "methodology", "versions", "report", "credibility"].map((slug) => entry(`/trust/${slug}`, updatedAt, "monthly", "0.6")),
  entry("/search", updatedAt, "weekly", "0.8"),
  entry("/trust", updatedAt, "monthly", "0.7"),
];
const schoolEntries = Object.entries(districtMetadata.districts).flatMap(([districtCode, district]) => {
  const file = districtCode === "tp" ? "schools_tp.csv" : districtCode === "taoyuan-lienchiang" ? "schools_tl.csv" : "schools.csv";
  return readFile(resolve(root, `public/it_hs/${districtCode}/${file}`), "utf8")
    .then((csv) => toSchoolRecords(csv).map((school) => entry(`/schools/${districtCode}/${school.code}`, district.updatedAt, "monthly", "0.7")));
});
const schoolEntryGroups = await Promise.all(schoolEntries);
const entries = [...staticEntries, ...schoolEntryGroups.flat()];
const uniqueEntries = [...new Map(entries.map((item) => [item.path, item])).values()];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueEntries.map(toXml).join("\n")}
</urlset>
`;

await writeFile(resolve(root, "public/sitemap.xml"), xml, "utf8");

function entry(path, lastmod, changefreq, priority) {
  return Object.freeze({ path, lastmod, changefreq, priority });
}

function toXml(item) {
  return `    <url>
        <loc>https://jshs.cc${item.path}</loc>
        <lastmod>${item.lastmod}</lastmod>
        <changefreq>${item.changefreq}</changefreq>
        <priority>${item.priority}</priority>
    </url>`;
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}
