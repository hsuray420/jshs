/**
 * Single Source of Truth CSV Data Registry
 * 
 * Maps front-end features directly to their canonical GitHub CSV files:
 * 1. 【找學校】15 就學區學校主檔 (data/schools_master.csv & data/schools/*.csv)
 * 2. 【學校地圖】學校座標檔 (data/school_coordinates.csv)
 * 3. 【歷年錄取成績】落點分數庫 (data/admission_scores.csv)
 * 4. 【學長姐分享】已審核經驗分享 (data/senior_shares.csv)
 */

export type CsvDataSource = Readonly<{
  id: string;
  name: string;
  featureName: string;
  featureHref: string;
  fileName: string;
  filePath: string;
  rowCount: number;
  columnsCount: number;
  lastUpdated: string;
  status: "active" | "verifying";
  description: string;
  githubEditUrl: string;
  githubRawUrl: string;
  districtSubFiles?: readonly Readonly<{
    id: string;
    name: string;
    fileName: string;
    filePath: string;
    rowCount: number;
    status: "available" | "verifying";
    githubEditUrl: string;
  }>[];
}>;

const GITHUB_REPO_BASE = "https://github.com/hsuray420/jshs";
const GITHUB_BRANCH = "main";

export const getGitHubEditUrl = (path: string) =>
  `${GITHUB_REPO_BASE}/edit/${GITHUB_BRANCH}/${path.replace(/^\//, "")}`;

export const getGitHubRawUrl = (path: string) =>
  `${GITHUB_REPO_BASE}/blob/${GITHUB_BRANCH}/${path.replace(/^\//, "")}`;

export const DISTRICT_CSV_FILES = [
  { id: "tp", name: "基北區", fileName: "01_tp_基北區.csv", filePath: "data/schools/01_tp_基北區.csv", rowCount: 135, status: "available" as const },
  { id: "taoyuan-lienchiang", name: "桃連區", fileName: "02_taoyuan-lienchiang_桃連區.csv", filePath: "data/schools/02_taoyuan-lienchiang_桃連區.csv", rowCount: 50, status: "available" as const },
  { id: "hsinchu-miaoli", name: "竹苗區", fileName: "03_hsinchu-miaoli_竹苗區.csv", filePath: "data/schools/03_hsinchu-miaoli_竹苗區.csv", rowCount: 39, status: "available" as const },
  { id: "ct", name: "中投區", fileName: "04_ct_中投區.csv", filePath: "data/schools/04_ct_中投區.csv", rowCount: 96, status: "available" as const },
  { id: "kaohsiung", name: "高雄區", fileName: "05_kaohsiung_高雄區.csv", filePath: "data/schools/05_kaohsiung_高雄區.csv", rowCount: 53, status: "available" as const },
  { id: "changhua", name: "彰化區", fileName: "06_changhua_彰化區.csv", filePath: "data/schools/06_changhua_彰化區.csv", rowCount: 49, status: "available" as const },
  { id: "yunlin", name: "雲林區", fileName: "07_yunlin_雲林區.csv", filePath: "data/schools/07_yunlin_雲林區.csv", rowCount: 22, status: "verifying" as const },
  { id: "chiayi", name: "嘉義區", fileName: "08_chiayi_嘉義區.csv", filePath: "data/schools/08_chiayi_嘉義區.csv", rowCount: 21, status: "verifying" as const },
  { id: "tainan", name: "臺南區", fileName: "09_tainan_臺南區.csv", filePath: "data/schools/09_tainan_臺南區.csv", rowCount: 73, status: "available" as const },
  { id: "pingtung", name: "屏東區", fileName: "10_pingtung_屏東區.csv", filePath: "data/schools/10_pingtung_屏東區.csv", rowCount: 23, status: "verifying" as const },
  { id: "ilan", name: "宜蘭區", fileName: "11_ilan_宜蘭區.csv", filePath: "data/schools/11_ilan_宜蘭區.csv", rowCount: 12, status: "verifying" as const },
  { id: "hualien", name: "花蓮區", fileName: "12_hualien_花蓮區.csv", filePath: "data/schools/12_hualien_花蓮區.csv", rowCount: 16, status: "verifying" as const },
  { id: "taitung", name: "臺東區", fileName: "13_taitung_臺東區.csv", filePath: "data/schools/13_taitung_臺東區.csv", rowCount: 11, status: "verifying" as const },
  { id: "penghu", name: "澎湖區", fileName: "14_penghu_澎湖區.csv", filePath: "data/schools/14_penghu_澎湖區.csv", rowCount: 2, status: "verifying" as const },
  { id: "kinmen", name: "金門區", fileName: "15_kinmen_金門區.csv", filePath: "data/schools/15_kinmen_金門區.csv", rowCount: 2, status: "verifying" as const },
].map((item) => ({
  ...item,
  githubEditUrl: getGitHubEditUrl(item.filePath),
}));

export function getCoreCsvDataSources(): readonly CsvDataSource[] {
  return [
    {
      id: "schools",
      name: "15 就學區學校主檔資料庫",
      featureName: "找學校",
      featureHref: "/schools",
      fileName: "schools.csv",
      filePath: "data/schools.csv",
      rowCount: 495, // Active canonical rows; 545 schools nationally
      columnsCount: 30,
      lastUpdated: "2026-09-08",
      status: "active",
      description: "全臺 15 就學區公私立高中職、五專招生名額、學制分類與科別主檔，改動後觸發全站資料自動同步。",
      githubEditUrl: getGitHubEditUrl("data/schools.csv"),
      githubRawUrl: getGitHubRawUrl("data/schools.csv"),
      districtSubFiles: DISTRICT_CSV_FILES,
    },
    {
      id: "coordinates",
      name: "全臺學校經緯度座標檔",
      featureName: "學校地圖",
      featureHref: "/schools/map",
      fileName: "school_coordinates.csv",
      filePath: "data/school_coordinates.csv",
      rowCount: 538,
      columnsCount: 12,
      lastUpdated: "2026-09-05",
      status: "active",
      description: "供學校地圖讀取之官方 TGOS 與地政核對經緯度座標檔，絕無漂移假點。",
      githubEditUrl: getGitHubEditUrl("data/school_coordinates.csv"),
      githubRawUrl: getGitHubRawUrl("data/school_coordinates.csv"),
    },
    {
      id: "admission_scores",
      name: "歷年錄取分數與會考落點庫",
      featureName: "歷年錄取成績",
      featureHref: "/scores/history",
      fileName: "admission_scores.csv",
      filePath: "data/admission_scores.csv",
      rowCount: 44,
      columnsCount: 11,
      lastUpdated: "2026-08-10",
      status: "active",
      description: "收錄社群與公開整理之歷年高中職最低錄取分數與門檻紀錄。",
      githubEditUrl: getGitHubEditUrl("data/admission_scores.csv"),
      githubRawUrl: getGitHubRawUrl("data/admission_scores.csv"),
    },
    {
      id: "senior_shares",
      name: "學長姐經驗分享公開庫",
      featureName: "學長姐經驗分享",
      featureHref: "/schools",
      fileName: "senior_shares.csv",
      filePath: "data/senior_shares.csv",
      rowCount: 0,
      columnsCount: 12,
      lastUpdated: "2026-10-24",
      status: "active",
      description: "經後台管理員嚴格審核通過後，自動寫入並公開至前台的學長姐升學經驗與會考回報檔。",
      githubEditUrl: getGitHubEditUrl("data/senior_shares.csv"),
      githubRawUrl: getGitHubRawUrl("data/senior_shares.csv"),
    },
  ];
}

export function formatReviewToCsvRow(review: {
  id: string;
  district: string;
  school_code: string;
  school_name: string;
  nickname: string;
  graduation_year?: string;
  exam_score?: string;
  admission_score?: string;
  admission_result?: string;
  content: string;
  created_at?: string;
}): string {
  const escape = (val: string | undefined | null) => {
    if (!val) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };
  return [
    escape(review.id),
    escape(review.district),
    escape(review.school_code),
    escape(review.school_name),
    escape(review.nickname || "匿名學長姐"),
    escape(review.graduation_year || ""),
    escape(review.exam_score || ""),
    escape(review.admission_score || ""),
    escape(review.admission_result || ""),
    escape(review.content),
    escape("published"),
    escape(new Date().toISOString()),
  ].join(",");
}

