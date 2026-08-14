/**
 * @typedef {Readonly<{
 *   name: string;
 *   quota: number | null;
 *   audience: string;
 * }>} SchoolDepartment
 *
 * @typedef {Readonly<{
 *   rank: string;
 *   code: string;
 *   name: string;
 *   ownership: string;
 *   admissionTrack: string;
 *   program: string;
 *   gender: string;
 *   city: string;
 *   area: string;
 *   address: string;
 *   website: string;
 *   phone: string;
 *   departmentsRaw: string;
 *   departments: readonly SchoolDepartment[];
 *   quota: string;
 *   referenceScore: string;
 *   scoreYear: string;
 *   sourceNote: string;
 *   specialPrograms: string;
 * }>} SchoolRecord
 */

export function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row = [...row, field];
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      if (field || row.length) rows.push([...row, field]);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) rows.push([...row, field]);
  return rows;
}

/** @returns {readonly SchoolDepartment[]} */
export function parseDepartments(value) {
  if (!value?.trim()) return [];
  return value.split("；").map((item) => {
    const normalized = item.trim();
    const match = normalized.match(/^(.*?):\s*(\d+)\s*(?:\(([^)]*)\))?$/);
    if (!match) return Object.freeze({ name: normalized, quota: null, audience: "" });
    return Object.freeze({
      name: match[1].trim(),
      quota: Number(match[2]),
      audience: (match[3] || "").trim(),
    });
  });
}

/** @returns {readonly SchoolRecord[]} */
export function toSchoolRecords(csv) {
  const rows = parseCsvRows(csv);
  const headers = (rows[0] || []).map((header) => header.replace(/^\uFEFF/, "").trim());
  const columnIndexes = new Map(headers.map((header, index) => [header, index]));
  const at = (row, name) => row[columnIndexes.get(name)]?.trim() || "";

  return Object.freeze(rows.slice(1).filter((row) => row.some(Boolean)).map((row) => {
    const departmentsRaw = at(row, "科系與名額");
    return Object.freeze({
      rank: at(row, "排名"),
      code: at(row, "學校代碼"),
      name: at(row, "學校名稱"),
      ownership: at(row, "公私立"),
      admissionTrack: at(row, "招生區"),
      program: at(row, "學制分類"),
      gender: at(row, "男女校"),
      city: at(row, "縣市"),
      area: at(row, "區"),
      address: at(row, "地址"),
      website: at(row, "官網"),
      phone: at(row, "電話"),
      departmentsRaw,
      departments: parseDepartments(departmentsRaw),
      quota: at(row, "招生名額") || at(row, "簡章招生名額"),
      referenceScore: at(row, "最低錄取分數"),
      scoreYear: at(row, "分數年度"),
      sourceNote: at(row, "分數來源備註"),
      specialPrograms: at(row, "資優班/特色班"),
    });
  }).filter((school) => school.code && school.name));
}
