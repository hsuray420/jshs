export type PlannerHealthStatus = "pass" | "warning" | "error" | "unknown";

export type PlannerHealthItem = {
  id: string;
  schoolCode: string;
  tier?: string;
  hasQuota?: boolean;
  qualificationStatus?: "pass" | "warning" | "error" | "unknown";
  commuteMinutes?: number | null;
  department?: string;
  hasHistoricalData?: boolean;
  hasSchoolCode?: boolean;
  hasSource?: boolean;
  hasAcademicYear?: boolean;
};

export type PlannerHealthCheck = {
  id: string;
  label: string;
  status: PlannerHealthStatus;
  detail: string;
  actionLabel: string;
  actionHref: string;
};

export function analyzePlannerHealth(input: { serviceYear: string; district?: string; score?: number; choiceLimit?: number; items: readonly PlannerHealthItem[] }): PlannerHealthCheck[] {
  const items = [...input.items];
  const tiers = new Set(items.map((item) => item.tier));
  const duplicateCodes = items.filter((item, index) => items.findIndex((candidate) => candidate.schoolCode === item.schoolCode) !== index);
  const missingData = items.flatMap((item, index) => [
    item.hasQuota === false ? `第 ${index + 1} 志願缺少招生名額資料` : "",
    item.hasHistoricalData === false ? `第 ${index + 1} 志願缺少歷年參考資料` : "",
    item.hasSchoolCode === false ? `第 ${index + 1} 志願缺少校科代碼` : "",
    item.hasAcademicYear === false ? `第 ${index + 1} 志願缺少招生年度` : "",
    item.hasSource === false ? `第 ${index + 1} 志願缺少官方來源` : "",
  ].filter(Boolean));
  const unknownQualification = items.some((item) => !item.qualificationStatus || item.qualificationStatus === "unknown");
  const longCommute = items.some((item) => typeof item.commuteMinutes === "number" && item.commuteMinutes > 90);
  const commuteUnknown = items.length > 0 && items.every((item) => item.commuteMinutes == null);
  const distributionWarning = items.length > 0 && (!tiers.has("stable") || !tiers.has("balanced") || !tiers.has("challenge"));

  return [
    {
      id: "distribution", label: "志願分布", status: items.length === 0 || distributionWarning ? "warning" : "pass",
      detail: items.length === 0 ? "尚未建立志願清單。" : distributionWarning ? `目前有 ${items.filter((item) => item.tier === "challenge").length} 個挑戰、${items.filter((item) => item.tier === "balanced").length} 個適中、${items.filter((item) => item.tier === "stable").length} 個穩定志願；建議補足不同層級。` : "三個風險層級都有安排。",
      actionLabel: "查看系統推薦", actionHref: "/planner/recommend?focus=distribution",
    },
    {
      id: "qualification", label: "資格", status: items.some((item) => item.qualificationStatus === "error") ? "error" : unknownQualification ? "warning" : "pass",
      detail: unknownQualification ? "部分校科尚未取得足夠資格資料，請逐校核對官方規定。" : "目前清單沒有已知資格衝突。",
      actionLabel: "查看資格說明", actionHref: "/eligibility",
    },
    {
      id: "data", label: "資料完整度", status: missingData.length ? "warning" : "pass",
      detail: missingData.length ? missingData.join("；") : "目前清單的招生資料欄位完整。",
      actionLabel: "查看資料狀態", actionHref: "/trust/status",
    },
    {
      id: "commute", label: "通勤", status: commuteUnknown ? "unknown" : longCommute ? "warning" : "pass",
      detail: commuteUnknown ? "尚未填寫所在地或通勤資料，無法判定。" : longCommute ? "有校科的估算通勤時間超過 90 分鐘，建議重新確認交通方式。" : "目前沒有超過 90 分鐘的通勤估算。",
      actionLabel: "比較通勤", actionHref: "/schools/commute",
    },
    {
      id: "rules", label: "規則", status: input.choiceLimit && items.length > input.choiceLimit ? "error" : "pass",
      detail: input.choiceLimit && items.length > input.choiceLimit ? `目前有 ${items.length} 個志願，已超過本區上限 ${input.choiceLimit} 個。` : "志願順序與目前選定區域的規則一致。",
      actionLabel: "查看積分規則", actionHref: "/tools/rules",
    },
    {
      id: "duplicates", label: "重複志願", status: duplicateCodes.length ? "error" : "pass",
      detail: duplicateCodes.length ? "清單中有重複校科，請刪除重複項目。" : "沒有偵測到重複校科。",
      actionLabel: "回到自己排", actionHref: "/planner/custom",
    },
  ];
}
