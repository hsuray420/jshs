import data from "../content/schools/generated/school-summaries.json";

export type SchoolSummary = (typeof data)[number];

const summaries = data as SchoolSummary[];

export const getSchoolSummaries = (): SchoolSummary[] => summaries;
