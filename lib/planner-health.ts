export type PlannerHealthStatus = "pass" | "warning" | "error";

export type PlannerHealthItem = {
  id: string;
  schoolCode: string;
  tier?: string;
  hasQuota?: boolean;
  qualificationStatus?: "pass" | "warning" | "error" | "unknown";
  commuteMinutes?: number | null;
};

export type PlannerHealthCheck = {
  id: string;
  label: string;
  status: PlannerHealthStatus;
  detail: string;
  actionLabel: string;
  actionHref: string;
};

export function analyzePlannerHealth(input: { serviceYear: string; items: readonly PlannerHealthItem[] }): PlannerHealthCheck[] {
  const items = [...input.items];
  const tiers = new Set(items.map((item) => item.tier));
  const duplicateCodes = items.filter((item, index) => items.findIndex((candidate) => candidate.schoolCode === item.schoolCode) !== index);
  const missingQuota = items.some((item) => item.hasQuota === false);
  const unknownQualification = items.some((item) => !item.qualificationStatus || item.qualificationStatus === "unknown");
  const longCommute = items.some((item) => typeof item.commuteMinutes === "number" && item.commuteMinutes > 90);
  const distributionWarning = items.length > 0 && (!tiers.has("stable") || !tiers.has("balanced"));

  return [
    {
      id: "distribution", label: "志願分布", status: items.length === 0 || distributionWarning ? "warning" : "pass",
      detail: items.length === 0 ? "尚未建立志願清單。" : distributionWarning ? "建議同時檢查挑戰、適中與穩定選項，避免志願過度集中。" : "三個風險層級都有安排。",
      actionLabel: "查看系統推薦", actionHref: "/planner/recommend?focus=distribution",
    },
    {
      id: "qualification", label: "資格", status: items.some((item) => item.qualificationStatus === "error") ? "error" : unknownQualification ? "warning" : "pass",
      detail: unknownQualification ? "部分校科尚未取得足夠資格資料，請逐校核對官方規定。" : "目前清單沒有已知資格衝突。",
      actionLabel: "查看資格說明", actionHref: "/eligibility",
    },
    {
      id: "data", label: "資料完整度", status: missingQuota || input.serviceYear === "116" && items.length > 0 && missingQuota ? "warning" : "pass",
      detail: missingQuota ? "部分 116 學年度招生名額尚未公告，不能把缺漏當成零名額。" : "目前清單的招生資料欄位完整。",
      actionLabel: "查看資料狀態", actionHref: "/trust/status",
    },
    {
      id: "commute", label: "通勤", status: longCommute ? "warning" : "pass",
      detail: longCommute ? "有校科的估算通勤時間超過 90 分鐘，建議重新確認交通方式。" : "目前沒有超過 90 分鐘的通勤估算。",
      actionLabel: "比較通勤", actionHref: "/schools/commute",
    },
    {
      id: "rules", label: "規則", status: "warning",
      detail: "志願序與同分比序仍須依所在就學區正式簡章確認。",
      actionLabel: "查看積分規則", actionHref: "/tools/rules",
    },
    {
      id: "duplicates", label: "重複志願", status: duplicateCodes.length ? "error" : "pass",
      detail: duplicateCodes.length ? "清單中有重複校科，請刪除重複項目。" : "沒有偵測到重複校科。",
      actionLabel: "回到自己排", actionHref: "/planner/custom",
    },
  ];
}
