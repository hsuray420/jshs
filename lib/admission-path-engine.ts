import districtMetadata from "../public/it_hs/district-metadata.json" with { type: "json" };
import pathRuleData from "../data/admission/115/path-rules.json" with { type: "json" };
import guideCatalog from "../data/admission-guides.json" with { type: "json" };

export const ADMISSION_PATH_STATUSES = ["eligible", "possibly_eligible", "ineligible", "needs_confirmation"] as const;
export type AdmissionPathStatus = (typeof ADMISSION_PATH_STATUSES)[number];
export type StudentType = "current_graduate" | "non_current_graduate" | "transfer_student" | "overseas_student" | "overseas_returning" | "other";
export type Identity = "indigenous" | "disability" | "overseas_chinese" | "mongolian_tibetan" | "government_assigned_child" | "overseas_science_child" | "veteran" | "none" | "unknown";
export type SpecialNeed = "special_admission" | "gifted" | "arts" | "sports" | "direct_selection" | "cross_zone" | "special_education" | "none";

export type AdmissionPathInput = Readonly<{
  academicYear: string;
  zone: string;
  studentType: StudentType | "";
  schoolCounty: string;
  schoolCode: string;
  identities: readonly Identity[];
  specialNeeds: readonly SpecialNeed[];
  answers: Readonly<Record<string, string | boolean>>;
}>;

export type OfficialSource = Readonly<{
  officialSourceTitle: string;
  officialSourceUrl: string;
  officialWebsiteUrl: string;
  officialSourcePage: string;
  lastVerifiedAt: string;
  verificationStatus: string;
}>;

export type AdmissionPathRoute = Readonly<{
  routeId: string;
  title: string;
  category: string;
  status: AdmissionPathStatus;
  confidence: "high" | "medium" | "low";
  reasons: readonly string[];
  missingInformation: readonly string[];
  requiredDocuments: readonly string[];
  nextSteps: readonly string[];
  nextActions: readonly { label: string; href: string }[];
  ruleIds: readonly string[];
  officialSources: readonly OfficialSource[];
}>;

export type AdmissionPathResult = Readonly<{
  routes: readonly AdmissionPathRoute[];
  error?: { code: "missing_context" | "unsupported_year" | "unsupported_zone" | "rule_missing"; message: string };
}>;

type PathRule = (typeof pathRuleData.rules)[number];
type DistrictInfo = (typeof districtMetadata.districts)[keyof typeof districtMetadata.districts];

const researchedZones = new Set(["tp", "ct", "taoyuan-lienchiang", "changhua", "kaohsiung"]);
const nonCurrentStudents = new Set<StudentType>(["non_current_graduate", "transfer_student", "overseas_student", "overseas_returning", "other"]);
const specialIdentityLabels: Readonly<Record<Exclude<Identity, "none" | "unknown">, string>> = {
  indigenous: "原住民",
  disability: "身心障礙",
  overseas_chinese: "僑生",
  mongolian_tibetan: "蒙藏生",
  government_assigned_child: "政府派外人員子女",
  overseas_science_child: "境外優秀科學技術人才子女",
  veteran: "退伍軍人相關身分",
};

export function evaluateAdmissionEligibility(input: AdmissionPathInput): AdmissionPathResult {
  if (!input.academicYear || !input.zone) return { routes: [], error: { code: "missing_context", message: "請先選擇學年度與免試就學區。" } };
  if (input.academicYear !== "115") return { routes: [], error: { code: "unsupported_year", message: "目前只有115學年度規則資料。" } };
  const district = districtMetadata.districts[input.zone as keyof typeof districtMetadata.districts] as DistrictInfo | undefined;
  if (!district) return { routes: [], error: { code: "unsupported_zone", message: "目前找不到這個免試就學區的規則資料。" } };

  try {
    const routes = [evaluateGeneral(input, district), ...evaluateConditionalRoutes(input, district)].filter(Boolean) as AdmissionPathRoute[];
    return { routes };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Missing admission path rule:")) {
      return { routes: [], error: { code: "rule_missing", message: "目前缺少這個升學路徑的規則資料，請查看官方規定或稍後再試。" } };
    }
    throw error;
  }
}

function evaluateGeneral(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute {
  const rule = findRule("general-admission-115");
  const source = sourceFor(rule, input.zone, district);
  const locationKnown = Boolean(input.schoolCounty);
  const locationMatches = locationKnown && district.areas.split("、").includes(input.schoolCounty);
  const isNonCurrent = nonCurrentStudents.has(input.studentType as StudentType);
  const reasons = input.studentType === "current_graduate" ? ["目前為國中應屆畢業生", locationMatches ? `就讀學校所在地位於${district.label}涵蓋區域` : "尚未確認就讀學校所在地是否屬於所選就學區"] : ["目前身分不是一般國中應屆畢業生", "非應屆、轉學生或境外學歷需依個案學籍資料審查"];
  const status: AdmissionPathStatus = isNonCurrent || !locationKnown ? "needs_confirmation" : locationMatches ? "eligible" : "needs_confirmation";
  return routeFromRule(rule, input, district, { status, confidence: status === "eligible" ? "high" : "low", reasons, missingInformation: status === "eligible" ? [] : [!locationKnown ? "就讀學校所在地" : "學籍／報名資格的個案確認"], requiredDocuments: [...rule.required_documents], officialSources: [source], nextSteps: ["確認當年度免試入學資格與報名期限", `前往${district.label}積分試算`, "比較目標高中職與科系", "完成志願模擬"] });
}

function evaluateConditionalRoutes(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute[] {
  const routes: AdmissionPathRoute[] = [];
  if (input.specialNeeds.includes("cross_zone")) routes.push(evaluateCrossZone(input, district));
  if (input.specialNeeds.some((need) => ["special_admission", "arts", "sports"].includes(need))) routes.push(evaluateSpecialAdmission(input, district));
  if (input.specialNeeds.includes("direct_selection")) routes.push(evaluateDirectSelection(input, district));
  if (input.specialNeeds.includes("gifted") || input.specialNeeds.includes("special_education")) routes.push(evaluateSpecialEducation(input, district));
  if (input.identities.some((identity) => identity !== "none")) routes.push(evaluateIdentity(input, district));
  if (nonCurrentStudents.has(input.studentType as StudentType)) routes.push(evaluateNonGraduate(input, district));
  return routes;
}

function evaluateCrossZone(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute {
  const rule = findRule("cross-zone-115");
  const source = sourceFor(rule, input.zone, district);
  const reason = typeof input.answers.crossZoneReason === "string" ? `已選擇跨區原因：${input.answers.crossZoneReason}` : "尚未選擇跨區原因";
  return routeFromRule(rule, input, district, { status: "needs_confirmation", confidence: "low", reasons: [reason, `目前資料尚未包含${district.label}所有原就讀學校與目標學校的官方對照`], missingInformation: ["目標學校", "跨區原因的官方適用性", "原就讀學校與目標學校對照"], requiredDocuments: [...rule.required_documents], officialSources: [source], nextSteps: ["選擇目標學校並確認是否位於核定共同就學區", "向原就讀國中確認跨區申請文件", "以招生委員會正式審查結果為準"] });
}

function evaluateSpecialAdmission(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute {
  const rule = findRule("special-admission-115");
  return routeFromRule(rule, input, district, { status: "needs_confirmation", confidence: "low", reasons: ["你選擇了特色招生、藝才或體育相關需求", "這些管道依目標招生學校與招生類型另訂資格，本站目前沒有完整校級招生目錄"], missingInformation: ["目標招生學校", "招生類型與當年度簡章", "甄試項目與名額"], requiredDocuments: [...rule.required_documents], officialSources: [sourceFor(rule, input.zone, district)], nextSteps: ["選擇目標招生學校", "查看該校當年度招生簡章", "向國中輔導室確認校內作業與期限"] });
}

function evaluateDirectSelection(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute {
  const rule = findRule("direct-selection-115");
  const explicitlyNotDirect = input.answers.directSchoolType === "no";
  return routeFromRule(rule, input, district, { status: explicitlyNotDirect ? "ineligible" : "needs_confirmation", confidence: explicitlyNotDirect ? "medium" : "low", reasons: explicitlyNotDirect ? ["你提供的資料顯示目前學校不是可能辦理直升的完全中學", "因此直升這條路徑目前不適用；甄選仍須另看目標學校公告"] : ["你選擇了直升或甄選入學", "目前沒有全國完全中學直升與各校甄選對照資料，不能自動核定"], missingInformation: explicitlyNotDirect ? ["若要走甄選，仍需確認目標學校招生類型"] : ["就讀學校是否辦理直升", "校內資格與名額", "目標學校甄選簡章"], requiredDocuments: [...rule.required_documents], officialSources: [sourceFor(rule, input.zone, district)], nextSteps: ["向就讀學校註冊組確認是否辦理直升", "查看目標學校甄選公告", "確認校內推薦與報名期限"] });
}

function evaluateSpecialEducation(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute {
  const rule = findRule("special-education-115");
  return routeFromRule(rule, input, district, { status: "needs_confirmation", confidence: "low", reasons: ["你選擇了資優或特殊教育需求", "正式路徑取決於鑑定、安置、IEP 與校內承辦人審查"], missingInformation: ["鑑定／安置結果", "個別化教育計畫或支持紀錄", "校內承辦人確認"], requiredDocuments: [...rule.required_documents], officialSources: [sourceFor(rule, input.zone, district)], nextSteps: ["聯絡就讀學校特教組或輔導室", "整理鑑定、安置與支持紀錄", "依承辦人確認的管道查看招生公告"] });
}

function evaluateIdentity(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute {
  const rule = findRule("special-identity-115");
  const labels = input.identities.filter((identity): identity is Exclude<Identity, "none" | "unknown"> => identity !== "none" && identity !== "unknown").map((identity) => specialIdentityLabels[identity]);
  const known = researchedZones.has(input.zone) && labels.length > 0;
  return routeFromRule(rule, input, district, { status: known ? "possibly_eligible" : "needs_confirmation", confidence: known ? "medium" : "low", reasons: [`已選擇特殊身分：${labels.join("、") || "不確定"}`, known ? "該就學區資料指出特殊身分須另依外加名額或升學優待規定處理" : "目前資料不足以確認這些身分在本區的具體優待方式"], missingInformation: ["有效身分證明", "本區特殊身分適用條文", "外加名額與申請期限"], requiredDocuments: [...rule.required_documents], officialSources: [sourceFor(rule, input.zone, district)], nextSteps: ["確認身分證明有效期限", "查看本區特殊身分與外加名額規定", "向國中承辦人確認申請文件與期限"] });
}

function evaluateNonGraduate(input: AdmissionPathInput, district: DistrictInfo): AdmissionPathRoute {
  const rule = findRule("non-graduate-115");
  return routeFromRule(rule, input, district, { status: "needs_confirmation", confidence: "low", reasons: [input.studentType === "transfer_student" ? "目前身分為轉學生" : "目前身分不是一般應屆畢業生", "成績、學籍與報名管道需由學校或招生委員會依個案確認"], missingInformation: [...rule.required_documents], requiredDocuments: [...rule.required_documents], officialSources: [sourceFor(rule, input.zone, district)], nextSteps: ["向原就讀學校取得學籍與成績文件", "向目標學校或招生委員會確認報名管道", "確認正式審查期限"] });
}

function findRule(ruleId: string): PathRule {
  const rule = pathRuleData.rules.find((item) => item.rule_id === ruleId);
  if (!rule) throw new Error(`Missing admission path rule: ${ruleId}`);
  return rule;
}

function sourceFor(rule: PathRule, _zone: string, district: DistrictInfo): OfficialSource {
  const guide = guideCatalog.guides.find((item) => item.label === district.label);
  return { officialSourceTitle: `${rule.official_source_title}（${district.label}）`, officialSourceUrl: guide?.file || district.sourceUrl, officialWebsiteUrl: guide?.sourceUrl || district.sourceUrl, officialSourcePage: rule.official_source_page, lastVerifiedAt: district.updatedAt, verificationStatus: rule.verification_status };
}

function routeFromRule(rule: PathRule, input: AdmissionPathInput, district: DistrictInfo, result: Omit<AdmissionPathRoute, "routeId" | "title" | "category" | "ruleIds" | "nextActions"> & { officialSources: readonly OfficialSource[] }): AdmissionPathRoute {
  const routeId = routeIdFor(rule.rule_id);
  return { routeId, title: rule.title, category: rule.category, ruleIds: [rule.rule_id, `${input.zone}-${input.academicYear}-district-context`], nextActions: actionsForRoute(routeId), ...result };
}

function routeIdFor(ruleId: string) { return ruleId === "general-admission-115" ? "general-no-exam" : ruleId.replace(/-115$/, ""); }

function actionsForRoute(routeId: string): readonly { label: string; href: string }[] {
  const actions: Record<string, readonly { label: string; href: string }[]> = {
    "general-no-exam": [
      { label: "開始積分試算", href: "/tools" },
      { label: "查看高中職", href: "/schools" },
      { label: "開始志願模擬", href: "/planner" },
    ],
    "cross-zone": [
      { label: "查看跨區規定", href: "/eligibility/cross-district" },
      { label: "查看官方來源", href: "/trust/sources" },
    ],
    "special-identity": [
      { label: "查看特殊身分加分", href: "/eligibility/extra-quota" },
      { label: "查看外加名額規定", href: "/eligibility/extra-quota" },
    ],
    "special-admission": [
      { label: "查看特色招生規定", href: "/eligibility/special-admission" },
      { label: "查看官方來源", href: "/trust/sources" },
    ],
    "direct-selection": [
      { label: "查看直升與甄選規定", href: "/eligibility/direct-selection" },
      { label: "查看官方來源", href: "/trust/sources" },
    ],
    "special-education": [
      { label: "查看資優／特殊教育規定", href: "/eligibility/gifted-special-education" },
      { label: "查看官方來源", href: "/trust/sources" },
    ],
    "non-graduate": [
      { label: "查看非應屆／轉學生規定", href: "/eligibility/non-graduate" },
      { label: "查看官方來源", href: "/trust/sources" },
    ],
  };
  return actions[routeId] || [{ label: "查看官方來源", href: "/trust/sources" }];
}
