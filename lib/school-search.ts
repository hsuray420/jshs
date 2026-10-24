import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";

/**
 * Normalizes user queries and school text:
 * - Converts "台" to "臺"
 * - Converts to lower case
 * - Strips all whitespace
 * - Unicode NFKC normalization
 */
export const normalizeSchoolSearch = (value: string): string => {
  if (!value) return "";
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("台", "臺")
    .replace(/\s+/g, "");
};

/**
 * Popular School Aliases & Abbreviation Dictionary
 * Maps school code to recognized aliases, acronyms, and nicknames
 */
export const POPULAR_SCHOOL_ALIASES: Record<string, string[]> = {
  // 中投區 (ct)
  "193301": ["台中女中", "臺中女中", "中女中", "女中", "中女"],
  "193302": ["中一中", "台中一中", "臺中一中", "一中", "中中"],
  "194303": ["中二中", "台中二中", "臺中二中", "二中"],
  "193305": ["文華高中", "文華"],
  "193306": ["惠文高中", "惠文"],
  "193307": ["忠明高中", "忠明"],
  "193308": ["西苑高中", "西苑"],
  "193309": ["東山高中", "東山"],
  "193401": ["台中高工", "臺中高工", "中工", "高工"],
  "193402": ["台中家商", "臺中家商", "中家", "家商"],
  "190401": ["興大附農", "中農", "台中農校", "臺中農校", "農工"],
  "060301": ["興大附中", "附中", "國大里"],
  "084301": ["暨大附中", "暨附", "附中", "埔里高中"],
  "084302": ["南投高中", "投高", "投中"],
  "084304": ["竹山高中", "竹高"],
  "084401": ["草屯商工", "草商", "商工"],
  "084402": ["埔里高工", "埔工", "高工"],
  "084403": ["水里商工", "水商", "商工"],
  "084404": ["仁愛高農", "仁農", "高農"],
  "050314": ["卓蘭高中", "卓蘭高職", "卓中"],
  "050315": ["苑裡高中", "苑高"],
  "050401": ["大湖農工", "湖農", "農工"],

  // 彰化區 (ch)
  "070301": ["彰化高中", "彰中"],
  "070302": ["彰化女中", "彰女", "女中"],
  "070401": ["彰化高工", "彰工", "高工"],
  "070402": ["彰化高商", "彰商", "家商"],
  "070305": ["員林高中", "員高", "員中"],
  "070403": ["員林家商", "員家", "家商"],
  "070404": ["員林崇實", "崇實高工", "崇實"],

  // 基北區 (tp)
  "330301": ["師大附中", "附中"],
  "343301": ["中山女高", "中山女中", "中山"],
  "353301": ["建中", "建國中學", "建國高中"],
  "353302": ["成功高中", "成功"],
  "353303": ["北一女", "北一", "北一女中", "女中"],
  "343302": ["松山高中", "松高"],
  "353401": ["大安高工", "大安", "高工"],
  "343401": ["松山工農", "松農", "農工"],
  "343402": ["松山家商", "松商", "家商"],
  "363401": ["士林高商", "士商", "家商"],
  "373401": ["木柵高工", "木工", "高工"],
  "383401": ["內湖高工", "湖工", "高工"],
  "393401": ["南港高工", "港工", "高工"],

  // 臺南區 (tn)
  "210305": ["南一中", "台南一中", "臺南一中", "一中"],
  "210306": ["南女", "台南女中", "臺南女中", "女中"],
  "210303": ["南二中", "台南二中", "臺南二中", "二中"],
  "210401": ["台南高工", "臺南高工", "南工", "高工"],
  "210402": ["台南高商", "臺南高商", "南商", "家商"],

  // 高雄區 (kh)
  "553301": ["雄中", "高雄中學", "高雄高中"],
  "573301": ["雄女", "高雄女中", "女中"],
  "563401": ["高雄高工", "雄工", "高工"],
  "583401": ["高雄高商", "雄商", "家商"],
};

/**
 * Checks if a single search token matches a school
 */
export const matchSchoolSingleToken = (
  school: SchoolSearchIndexEntry,
  token: string
): boolean => {
  if (!token) return true;
  const normalizedToken = normalizeSchoolSearch(token);
  if (!normalizedToken) return true;

  // 1. Direct field matches (code, city, area, address, normalizedSearchText)
  if (school.code && school.code.toLowerCase().includes(normalizedToken)) return true;
  if (school.city && normalizeSchoolSearch(school.city).includes(normalizedToken)) return true;
  if (school.area && normalizeSchoolSearch(school.area).includes(normalizedToken)) return true;
  if (school.address && normalizeSchoolSearch(school.address).includes(normalizedToken)) return true;
  if (school.normalizedSearchText && school.normalizedSearchText.includes(normalizedToken)) return true;

  // 2. School Name
  const normName = normalizeSchoolSearch(school.name);
  if (normName.includes(normalizedToken)) return true;

  // 3. School Types and Departments
  if (school.schoolTypes && school.schoolTypes.some((t) => normalizeSchoolSearch(t).includes(normalizedToken))) return true;
  if (school.departmentNames && school.departmentNames.some((d) => normalizeSchoolSearch(d).includes(normalizedToken))) return true;

  // 4. Popular School Aliases by code
  const aliases = POPULAR_SCHOOL_ALIASES[school.code] || [];
  if (aliases.some((alias) => normalizeSchoolSearch(alias).includes(normalizedToken))) return true;

  // 5. Intelligent Abbreviation Patterns:
  // "一中", "二中", "三中" ... -> matches "第一...中", "第二...中" etc.
  const digitMatch = normalizedToken.match(/^([一二三四五六七八九])中$/);
  if (digitMatch && new RegExp(`第${digitMatch[1]}.*中`).test(normName)) {
    return true;
  }

  // "女中" or "女高" -> matches schools containing "女" and ("中" or "高")
  if (normalizedToken === "女中" || normalizedToken === "女高") {
    if (/女.*(中|高)/.test(normName)) return true;
  }

  // "附中" -> matches any school with "附" and "中" (師大附中, 興大附中, 暨大附中, 政大附中, 高師大附中)
  if (normalizedToken === "附中") {
    if (/附.*中/.test(normName)) return true;
  }

  // "高工" -> matches "高級工業" or school with "高工" or schoolTypes vocational
  if (normalizedToken === "高工") {
    if (/工|技術/.test(normName) || (school.schoolTypes && school.schoolTypes.some((t) => /高職|技術/.test(t)))) {
      return true;
    }
  }

  // "家商" -> matches "家事商業", "高級家商" or school with "家商"
  if (normalizedToken === "家商") {
    if (/家商|家事|商業/.test(normName)) return true;
  }

  // "商工" -> matches "商業工業", "商工"
  if (normalizedToken === "商工") {
    if (/商工|商業/.test(normName)) return true;
  }

  // "農工" / "高農" -> matches "農業", "農工", "高農"
  if (normalizedToken === "農工" || normalizedToken === "高農") {
    if (/農/.test(normName)) return true;
  }

  // "餐飲" semantic expansion
  if (normalizedToken === "餐飲" && /餐旅|烘焙/.test(school.normalizedSearchText)) {
    return true;
  }

  // "公立" / "私立"
  if (normalizedToken === "公立" && (school.ownership || "").includes("公立")) return true;
  if (normalizedToken === "私立" && (school.ownership || "").includes("私立")) return true;
  if (normalizedToken === "高職" && (school.schoolTypes || []).some((t) => /高職|技術/.test(t))) return true;
  if (normalizedToken === "高中" && (school.schoolTypes || []).some((t) => /普通|高中/.test(t))) return true;
  if (normalizedToken === "綜高" && (school.schoolTypes || []).some((t) => /綜合/.test(t))) return true;
  if (normalizedToken === "五專" && (school.schoolTypes || []).some((t) => /五專|專科/.test(t))) return true;

  return false;
};

/**
 * Multi-token fuzzy match: splits query by spaces or punctuation and requires every token to match
 */
export const matchesSchoolFuzzy = (
  school: SchoolSearchIndexEntry,
  rawQuery: string
): boolean => {
  if (!rawQuery || !rawQuery.trim()) return true;
  const tokens = rawQuery.trim().split(/[\s、,;；+]+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => matchSchoolSingleToken(school, token));
};

/**
 * Returns a crisp, user-friendly short name for school map pins
 */
export const getSchoolShortName = (school: SchoolSearchIndexEntry): string => {
  const aliases = POPULAR_SCHOOL_ALIASES[school.code];
  if (aliases && aliases.length > 0) {
    return aliases[0];
  }
  let name = school.name;
  name = name.replace(/^(國立|私立|臺中市立|臺北市立|新北市立|高雄市立|臺南市立|桃園市立|彰化縣立|南投縣立|苗栗縣立|雲林縣立|嘉義縣立|屏東縣立|宜蘭縣立|花蓮縣立|臺東縣立|澎湖縣立|金門縣立)/, "");
  if (name.endsWith("高級中等學校")) {
    name = name.replace(/高級中等學校$/, "高中");
  } else if (name.endsWith("高級中學")) {
    name = name.replace(/高級中學$/, "高中");
  } else if (name.endsWith("高級職業學校")) {
    name = name.replace(/高級職業學校$/, "高職");
  } else if (name.endsWith("高級工商職業學校")) {
    name = name.replace(/高級工商職業學校$/, "工商");
  } else if (name.endsWith("高級商業職業學校")) {
    name = name.replace(/高級商業職業學校$/, "高商");
  } else if (name.endsWith("高級工業職業學校")) {
    name = name.replace(/高級工業職業學校$/, "高工");
  } else if (name.endsWith("高級農工職業學校")) {
    name = name.replace(/高級農工職業學校$/, "農工");
  }
  return name;
};
