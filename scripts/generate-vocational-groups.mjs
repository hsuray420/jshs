import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCsvRows } from "../lib/school-catalog.mjs";
import { regionalCsvPath } from "./school-csv-source.mjs";

const root = process.cwd();
const metadata = JSON.parse(await readFile(resolve(root, "public/it_hs/district-metadata.json"), "utf8"));
const groups = [
  ["mechanical", "機械群", ["機械", "模具", "板金", "鑄造"]], ["power-mechanical", "動力機械群", ["汽車", "車輛", "動力機械"]], ["electrical-electronic", "電機與電子群", ["電機", "電子", "資訊", "控制", "冷凍空調"]], ["chemical", "化工群", ["化工", "製藥"]], ["civil-architecture", "土木與建築群", ["土木", "建築", "營造", "測量"]], ["design", "設計群", ["設計", "美工", "室內空間"]], ["engineering-management", "工程與管理群", ["工程管理"]], ["business-management", "商業與管理群", ["商業", "會計", "資料處理", "電子商務", "國際貿易"]], ["foreign-languages", "外語群", ["應用英語", "應用日語", "外語"]], ["hospitality", "餐旅群", ["餐飲", "觀光", "旅館"]], ["agriculture", "農業群", ["農業", "園藝", "森林", "畜產", "農場"]], ["food", "食品群", ["食品"]], ["home-economics", "家事群", ["家政", "幼兒保育", "美容", "服裝"]], ["maritime", "海事群", ["水產", "海事", "漁"]], ["arts", "藝術群", ["藝術", "表演", "音樂"]],
];
const schools = JSON.parse(await readFile(resolve(root, "content/schools/generated/schools.json"), "utf8"));
const names = new Set(schools.flatMap((school) => school.departments.map((department) => department.name)));
for (const districtCode of Object.keys({ tp: 1, "taoyuan-lienchiang": 1, "hsinchu-miaoli": 1, ct: 1, changhua: 1, yunlin: 1, chiayi: 1, tainan: 1, kaohsiung: 1, pingtung: 1, ilan: 1, hualien: 1, taitung: 1, penghu: 1, kinmen: 1 })) {
  const rows = parseCsvRows(await readFile(regionalCsvPath(districtCode), "utf8"));
  const headers = (rows[0] || []).map((header) => header.replace(/^\uFEFF/, "").trim());
  const departmentsIndex = headers.indexOf("科系與名額");
  for (const row of rows.slice(1)) for (const item of String(row[departmentsIndex] || "").split(/[；;]/u)) {
    const name = item.split(/[:：]/u)[0]?.trim();
    if (name) names.add(name);
  }
}
const departments = [...names].sort((a, b) => a.localeCompare(b, "zh-TW")).flatMap((name) => {
  const matched = groups.find(([, , keywords]) => keywords.some((keyword) => name.includes(keyword)));
  return matched ? [{ id: `school-directory-${name}`, name, groupId: matched[0], groupName: matched[1], sourceId: "vocational-programs-115", sourceType: "jshs_curated", status: "pending_verification", learningContent: null, commonCourses: null, progression: null }] : [];
});
await writeFile(resolve(root, "data/vocational-groups.json"), `${JSON.stringify({ schemaVersion: "1.0", updatedAt: metadata.updatedAt, sourceId: "vocational-programs-115", groups: groups.map(([id, name]) => ({ id, name, status: "pending_verification" })), departments }, null, 2)}\n`, "utf8");
console.log(`Generated vocational group schema: ${departments.length} mapped departments; unmapped program names remain pending.`);
