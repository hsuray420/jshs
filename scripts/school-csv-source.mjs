import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultSourceDir = "/Users/ray/Desktop/hs/JSHS_CSV_各區資料_2026-09-01";
const bundledSourceDir = path.join(projectRoot, "content", "schools", "regions");

export function getSchoolCsvSourceDir() {
  const configured = process.env.JSHS_CSV_SOURCE_DIR || defaultSourceDir;
  const preferred = path.resolve(configured);
  const sourceDir = fs.existsSync(path.join(preferred, "schools_master.csv")) ? preferred : bundledSourceDir;
  const required = ["schools_master.csv", "school_admission_records.csv"];
  const missing = required.filter((file) => !fs.existsSync(path.join(sourceDir, file)));
  if (missing.length) throw new Error(`School CSV source is incomplete: ${sourceDir}; missing ${missing.join(", ")}`);
  return sourceDir;
}

export function projectPath(...parts) { return path.join(projectRoot, ...parts); }
export const regionalCsvFiles = {
  tp: "基北區_tp/schools_tp.csv",
  "taoyuan-lienchiang": "桃連區_taoyuan-lienchiang/schools.csv",
  "hsinchu-miaoli": "竹苗區_hsinchu-miaoli/schools.csv",
  ct: "中投區_ct/schools.csv",
  changhua: "彰化區_changhua/schools.csv",
  yunlin: "雲林區_yunlin/schools.csv",
  chiayi: "嘉義區_chiayi/schools.csv",
  tainan: "臺南區_tainan/schools.csv",
  kaohsiung: "高雄區_kaohsiung/schools_高雄區_逐校查核完整補全_男女校已補.csv",
  pingtung: "屏東區_pingtung/schools.csv",
  ilan: "宜蘭區_ilan/schools.csv",
  hualien: "花蓮區_hualien/schools.csv",
  taitung: "臺東區_taitung/schools.csv",
  penghu: "澎湖區_penghu/schools.csv",
  kinmen: "金門區_kinmen/schools.csv",
};

export function regionalCsvPath(code) {
  const relative = regionalCsvFiles[code];
  if (!relative) throw new Error(`Unknown school district CSV: ${code}`);
  return path.join(schoolCsvSourceDir, relative);
}

export function regionalAdmissionHistoryPath(code) {
  const csvPath = regionalCsvPath(code);
  return path.join(path.dirname(csvPath), "admission-history.csv");
}
export const schoolCsvSourceDir = getSchoolCsvSourceDir();
