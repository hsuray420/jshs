import data from "../content/schools/generated/school-search-index.json";

export type SchoolSearchIndexEntry = (typeof data)[number];

const index = data as SchoolSearchIndexEntry[];
const byCode = new Map(index.map((school) => [school.code, school]));

export const getSchoolSearchIndex = (): SchoolSearchIndexEntry[] => index;
export const getSchoolSearchEntryByCode = (code: string): SchoolSearchIndexEntry | undefined => byCode.get(code);

