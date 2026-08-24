import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { toSchoolRecords } from "../lib/school-catalog.mjs";

const root = process.cwd();
const csvFiles = {
  ct: "ct/schools.csv",
  tp: "tp/schools_tp.csv",
  ilan: "ilan/schools.csv",
  "taoyuan-lienchiang": "taoyuan-lienchiang/schools_tl.csv",
  "hsinchu-miaoli": "hsinchu-miaoli/schools.csv",
  changhua: "changhua/schools.csv",
  yunlin: "yunlin/schools.csv",
  chiayi: "chiayi/schools.csv",
  tainan: "tainan/schools.csv",
  kaohsiung: "kaohsiung/schools.csv",
  pingtung: "pingtung/schools.csv",
  hualien: "hualien/schools.csv",
  taitung: "taitung/schools.csv",
  penghu: "penghu/schools.csv",
  kinmen: "kinmen/schools.csv",
};

const historyHeaders = [
  "學校代碼",
  "學校名稱",
  "學制分類",
  "縣市",
  "區",
  "科系與名額",
  "最低錄取分數",
  "分數年度",
  "分數來源備註",
  "資料性質",
];

for (const [districtCode, relativePath] of Object.entries(csvFiles)) {
  const csv = await readFile(resolve(root, `public/it_hs/${relativePath}`), "utf8");
  const records = toSchoolRecords(csv)
    .filter((school) => school.referenceScore)
    .map((school) => [
      school.code,
      school.name,
      school.program,
      school.city,
      school.area,
      school.departmentsRaw,
      school.referenceScore,
      school.scoreYear,
      school.sourceNote,
      "非官方整理",
    ]);
  const output = [historyHeaders, ...records].map((row) => row.map(csvValue).join(",")).join("\n") + "\n";
  await writeFile(resolve(root, `public/it_hs/${districtCode}/admission-history.csv`), output, "utf8");
  console.log(`${districtCode}: ${records.length} non-official history records`);
}

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
