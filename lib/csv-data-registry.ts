/**
 * 4 大功能獨立分割槽 (Segmented Slots) 資料登錄中心
 * 
 * 全站依功能強制切分為 4 個獨立分割槽，絕不將資料雜揉或自製肥大總表：
 * 
 * 1. 【找學校】15 就學區獨立 CSV 槽 (15 District Slots)：
 *    直接讀取 content/schools/regions/ 下 15 區獨立 CSV，一區一檔，改哪一區就只動該區。
 * 2. 【學校地圖】經緯度座標 CSV 槽：
 *    data/school_coordinates.csv（TGOS 與地政核對經緯度 538 筆）
 * 3. 【歷年錄取成績】分數落點 CSV 槽：
 *    data/admission_scores.csv（44 筆歷年會考錄取標準）
 * 4. 【學長姐分享】經驗分享 CSV 與稽核槽：
 *    data/senior_shares.csv（經管理員後台核准之真實經驗分享）
 */

export const GITHUB_REPO_BASE = "https://github.com/hsuray420/jshs";
export const GITHUB_BRANCH = "main";

export const getGitHubEditUrl = (path: string) =>
  `${GITHUB_REPO_BASE}/edit/${GITHUB_BRANCH}/${path.replace(/^\//, "")}`;

export const getGitHubRawUrl = (path: string) =>
  `${GITHUB_REPO_BASE}/blob/${GITHUB_BRANCH}/${path.replace(/^\//, "")}`;

export type RegionalSchoolSlot = Readonly<{
  id: string;
  name: string;
  fileName: string;
  csvPath: string;
  rowCount: number;
  schoolYear: number;
  status: "available" | "verifying";
  githubEditUrl: string;
  githubRawUrl: string;
}>;

export const REGIONAL_SCHOOL_SLOTS: readonly RegionalSchoolSlot[] = [
  {
    id: "tp",
    name: "基北區",
    fileName: "JSHS_基北區_135校_完成版_無排序分數_2026-09-07.csv",
    csvPath: "content/schools/regions/基北區_tp/JSHS_基北區_135校_完成版_無排序分數_2026-09-07.csv",
    rowCount: 135,
    schoolYear: 115,
    status: "available",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/基北區_tp/JSHS_基北區_135校_完成版_無排序分數_2026-09-07.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/基北區_tp/JSHS_基北區_135校_完成版_無排序分數_2026-09-07.csv"),
  },
  {
    id: "taoyuan-lienchiang",
    name: "桃連區",
    fileName: "JSHS_桃連區_50校_最終完成版_2026-09-08.csv",
    csvPath: "content/schools/regions/桃連區_taoyuan-lienchiang/JSHS_桃連區_50校_最終完成版_2026-09-08.csv",
    rowCount: 50,
    schoolYear: 115,
    status: "available",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/桃連區_taoyuan-lienchiang/JSHS_桃連區_50校_最終完成版_2026-09-08.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/桃連區_taoyuan-lienchiang/JSHS_桃連區_50校_最終完成版_2026-09-08.csv"),
  },
  {
    id: "hsinchu-miaoli",
    name: "竹苗區",
    fileName: "JSHS_竹苗區_39校_最終完成版_2026-09-08.csv",
    csvPath: "content/schools/regions/竹苗區_hsinchu-miaoli/JSHS_竹苗區_39校_最終完成版_2026-09-08.csv",
    rowCount: 39,
    schoolYear: 115,
    status: "available",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/竹苗區_hsinchu-miaoli/JSHS_竹苗區_39校_最終完成版_2026-09-08.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/竹苗區_hsinchu-miaoli/JSHS_竹苗區_39校_最終完成版_2026-09-08.csv"),
  },
  {
    id: "ct",
    name: "中投區",
    fileName: "JSHS_中投區_96校_最終版_2026-09-07.csv",
    csvPath: "content/schools/regions/中投區_ct/JSHS_中投區_96校_最終版_2026-09-07.csv",
    rowCount: 96,
    schoolYear: 115,
    status: "available",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/中投區_ct/JSHS_中投區_96校_最終版_2026-09-07.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/中投區_ct/JSHS_中投區_96校_最終版_2026-09-07.csv"),
  },
  {
    id: "kaohsiung",
    name: "高雄區",
    fileName: "JSHS_高雄區_53校_最終完成版_2026-09-07.csv",
    csvPath: "content/schools/regions/高雄區_kaohsiung/JSHS_高雄區_53校_最終完成版_2026-09-07.csv",
    rowCount: 53,
    schoolYear: 115,
    status: "available",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/高雄區_kaohsiung/JSHS_高雄區_53校_最終完成版_2026-09-07.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/高雄區_kaohsiung/JSHS_高雄區_53校_最終完成版_2026-09-07.csv"),
  },
  {
    id: "changhua",
    name: "彰化區",
    fileName: "JSHS_彰化區_49校_最終完成版_2026-09-08.csv",
    csvPath: "content/schools/regions/彰化區_changhua/JSHS_彰化區_49校_最終完成版_2026-09-08.csv",
    rowCount: 49,
    schoolYear: 115,
    status: "available",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/彰化區_changhua/JSHS_彰化區_49校_最終完成版_2026-09-08.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/彰化區_changhua/JSHS_彰化區_49校_最終完成版_2026-09-08.csv"),
  },
  {
    id: "yunlin",
    name: "雲林區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/雲林區_yunlin/schools.csv",
    rowCount: 22,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/雲林區_yunlin/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/雲林區_yunlin/schools.csv"),
  },
  {
    id: "chiayi",
    name: "嘉義區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/嘉義區_chiayi/schools.csv",
    rowCount: 21,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/嘉義區_chiayi/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/嘉義區_chiayi/schools.csv"),
  },
  {
    id: "tainan",
    name: "臺南區",
    fileName: "JSHS_臺南區_73校_最終完成版_2026-09-08.csv",
    csvPath: "content/schools/regions/臺南區_tainan/JSHS_臺南區_73校_最終完成版_2026-09-08.csv",
    rowCount: 73,
    schoolYear: 115,
    status: "available",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/臺南區_tainan/JSHS_臺南區_73校_最終完成版_2026-09-08.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/臺南區_tainan/JSHS_臺南區_73校_最終完成版_2026-09-08.csv"),
  },
  {
    id: "pingtung",
    name: "屏東區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/屏東區_pingtung/schools.csv",
    rowCount: 23,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/屏東區_pingtung/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/屏東區_pingtung/schools.csv"),
  },
  {
    id: "ilan",
    name: "宜蘭區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/宜蘭區_ilan/schools.csv",
    rowCount: 12,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/宜蘭區_ilan/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/宜蘭區_ilan/schools.csv"),
  },
  {
    id: "hualien",
    name: "花蓮區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/花蓮區_hualien/schools.csv",
    rowCount: 16,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/花蓮區_hualien/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/花蓮區_hualien/schools.csv"),
  },
  {
    id: "taitung",
    name: "臺東區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/臺東區_taitung/schools.csv",
    rowCount: 11,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/臺東區_taitung/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/臺東區_taitung/schools.csv"),
  },
  {
    id: "penghu",
    name: "澎湖區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/澎湖區_penghu/schools.csv",
    rowCount: 2,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/澎湖區_penghu/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/澎湖區_penghu/schools.csv"),
  },
  {
    id: "kinmen",
    name: "金門區",
    fileName: "schools.csv",
    csvPath: "content/schools/regions/金門區_kinmen/schools.csv",
    rowCount: 2,
    schoolYear: 115,
    status: "verifying",
    githubEditUrl: getGitHubEditUrl("content/schools/regions/金門區_kinmen/schools.csv"),
    githubRawUrl: getGitHubRawUrl("content/schools/regions/金門區_kinmen/schools.csv"),
  },
];

export const MAP_COORDINATES_SLOT = {
  id: "coordinates",
  name: "學校經緯度座標主檔",
  featureName: "學校地圖",
  featureHref: "/schools/map",
  fileName: "school_coordinates.csv",
  filePath: "data/school_coordinates.csv",
  rowCount: 538,
  columnsCount: 12,
  lastUpdated: "2026-09-05",
  description: "TGOS 官方與地政核對經緯度座標檔，絕無人工捏造或漂移假點。",
  githubEditUrl: getGitHubEditUrl("data/school_coordinates.csv"),
  githubRawUrl: getGitHubRawUrl("data/school_coordinates.csv"),
} as const;

export const ADMISSION_SCORES_SLOT = {
  id: "admission_scores",
  name: "歷年錄取分數與會考落點庫",
  featureName: "歷年錄取成績",
  featureHref: "/scores/history",
  fileName: "admission_scores.csv",
  filePath: "data/admission_scores.csv",
  rowCount: 44,
  columnsCount: 11,
  lastUpdated: "2026-08-10",
  description: "歷年各高中職最低錄取門檻、積分累積與採計標準紀錄。",
  githubEditUrl: getGitHubEditUrl("data/admission_scores.csv"),
  githubRawUrl: getGitHubRawUrl("data/admission_scores.csv"),
} as const;

export const SENIOR_SHARES_SLOT = {
  id: "senior_shares",
  name: "學長姐經驗分享正式資料庫",
  featureName: "學長姐經驗分享",
  featureHref: "/schools",
  fileName: "senior_shares.csv",
  filePath: "data/senior_shares.csv",
  rowCount: 0,
  columnsCount: 12,
  lastUpdated: "2026-10-24",
  description: "經後台管理員審核通過之經驗分享，點擊核准後自動加入此檔並公開至前台。",
  githubEditUrl: getGitHubEditUrl("data/senior_shares.csv"),
  githubRawUrl: getGitHubRawUrl("data/senior_shares.csv"),
} as const;

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
