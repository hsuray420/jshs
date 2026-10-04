import { addFavorite, listFavorites } from "../../../../db/favorite-store";
import { createMemberScoreSnapshot, hasMemberScoreSnapshot } from "../../../../db/score-store";
import { saveMockExam, hasMockExam } from "../../../../db/mock-exam-store";
import { createPlannerItem, createPlannerVersion, getOrCreateMemberPlanner, getPlannerState, listPlannerItems, hasPlannerItem, hasPlannerVersion, savePlannerState, type PlannerItem } from "../../../../db/planner-store";
import { getMemberSession, getMemberUserId } from "../../../../lib/member-auth";
import { getAdmissionChoiceLimit } from "../../../../lib/admission-score";
import { getRegionRegistry } from "../../../../lib/region-registry";
import { getSchoolSearchIndex } from "../../../../lib/school-search-index";

export const dynamic = "force-dynamic";

const SUBJECTS = ["國文", "數學", "英文", "社會", "自然"] as const;
const MAX_SCORE_RECORDS = 20;
const MAX_MOCK_RECORDS = 100;
const MAX_PLANNER_ITEMS = 100;
const MAX_FAVORITES = 500;

type ImportPayload = Readonly<{
  scores?: unknown;
  mockExams?: unknown;
  plannerItems?: unknown;
  plannerSnapshots?: unknown;
  plannerState?: unknown;
  favoriteCodes?: unknown;
}>;

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required" }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1_000_000) return Response.json({ ok: false, error: "import_payload_too_large" }, { status: 413 });
  const userId = await getMemberUserId(member);
  const body = await request.json().catch(() => null) as ImportPayload | null;
  if (!body || !isArrayWithin(body.scores, MAX_SCORE_RECORDS) || !isArrayWithin(body.mockExams, MAX_MOCK_RECORDS)
    || !isArrayWithin(body.plannerItems, MAX_PLANNER_ITEMS) || !isArrayWithin(body.plannerSnapshots, 30) || !isArrayWithin(body.favoriteCodes, MAX_FAVORITES)) {
    return Response.json({ ok: false, error: "invalid_import_payload" }, { status: 400 });
  }

  function validatePlannerSnapshot(value: unknown) {
    if (!isObject(value) || typeof value.id !== "string" || !/^[\w-]{1,80}$/.test(value.id)
      || typeof value.created_at !== "string" || Number.isNaN(Date.parse(value.created_at))
      || !Array.isArray(value.items) || value.items.length > MAX_PLANNER_ITEMS || !isPlannerState(value.state)) return null;
    const items = value.items.map(validatePlannerItem);
    if (items.some((item) => !item)) return null;
    return { id: value.id, created_at: new Date(value.created_at).toISOString(), items: items as NonNullable<(typeof items)[number]>[], state: value.state };
  }

  const scores = (body.scores as unknown[]).map(validateScore);
  const exams = (body.mockExams as unknown[]).map(validateMockExam);
  const plannerItems = (body.plannerItems as unknown[]).map(validatePlannerItem);
  const plannerSnapshots = (body.plannerSnapshots as unknown[]).map(validatePlannerSnapshot);
  const favoriteCodes = body.favoriteCodes as unknown[];
  if (scores.some((item) => !item) || exams.some((item) => !item) || plannerItems.some((item) => !item) || plannerSnapshots.some((item) => !item)
    || favoriteCodes.some((code) => typeof code !== "string" || !isKnownSchool(code))) {
    return Response.json({ ok: false, error: "invalid_import_record" }, { status: 400 });
  }
  if ((scores as NonNullable<(typeof scores)[number]>[]).some((score) => JSON.stringify(score.result).length > 20_000)) {
    return Response.json({ ok: false, error: "score_record_too_large" }, { status: 400 });
  }

  const imported = { scores: 0, mockExams: 0, plannerItems: 0, favorites: 0 };
  const scoreRecords = scores as NonNullable<(typeof scores)[number]>[];
  const scoreIds = await Promise.all(scoreRecords.map((score) => stableHash(`${score.savedAt}:${score.district}:${JSON.stringify(score.result)}`)));
  if (new Set(scoreIds).size !== scoreIds.length
    || new Set((exams as NonNullable<(typeof exams)[number]>[]).map((exam) => exam.id)).size !== exams.length) {
    return Response.json({ ok: false, error: "duplicate_import_records" }, { status: 400 });
  }
  const validPlannerItems = plannerItems as NonNullable<(typeof plannerItems)[number]>[];
  const uniquePlannerItems = [...new Map(validPlannerItems.map((item) => [plannerKey(item), item])).values()];
  let plannerId: string | null = null;
  let existingPlannerItems: PlannerItem[] = [];
  if (uniquePlannerItems.length || plannerSnapshots.length || body.plannerState !== undefined) {
    plannerId = await getOrCreateMemberPlanner(userId);
    existingPlannerItems = await listPlannerItems(plannerId);
    const districtCounts = new Map<string, number>();
    for (const item of existingPlannerItems) districtCounts.set(item.district, (districtCounts.get(item.district) || 0) + 1);
    for (const item of uniquePlannerItems) {
      if (existingPlannerItems.some((existing) => plannerKey(existing) === plannerKey(item))) continue;
      const nextCount = (districtCounts.get(item.district) || 0) + 1;
      if (nextCount > getAdmissionChoiceLimit(item.district)) {
        return Response.json({ ok: false, error: "planner_choice_limit_exceeded", district: item.district }, { status: 409 });
      }
      districtCounts.set(item.district, nextCount);
    }
  }
  for (const [index, score] of scoreRecords.entries()) {
    const id = `guest-${scoreIds[index]}`;
    await createMemberScoreSnapshot({
      id,
      user_id: userId,
      district: score.district,
      academic_year: score.academicYear,
      total_score: score.totalScore,
      result_json: JSON.stringify(score.result),
      created_at: score.savedAt,
    });
  }

  for (const exam of exams as NonNullable<(typeof exams)[number]>[]) {
    await saveMockExam({
      id: exam.id,
      user_id: userId,
      name: exam.name,
      exam_date: exam.date,
      subjects_json: JSON.stringify(exam.subjects),
      essay: exam.essay,
      created_at: exam.createdAt,
      updated_at: exam.updatedAt,
    });
  }

  const plannerWrittenIds: string[] = [];
  const plannerSnapshotIds: string[] = [];
  if (plannerId) {
    const existingKeys = new Set(existingPlannerItems.map(plannerKey));
    for (const candidate of uniquePlannerItems) {
      if (existingKeys.has(plannerKey(candidate))) continue;
      const item: PlannerItem = {
        ...candidate,
        id: crypto.randomUUID(),
        planner_id: plannerId,
      };
      await createPlannerItem(item);
      plannerWrittenIds.push(item.id);
      existingKeys.add(plannerKey(item));
      imported.plannerItems += 1;
    }
    if (isPlannerState(body.plannerState)) await savePlannerState(plannerId, JSON.stringify(body.plannerState));
    for (const snapshot of plannerSnapshots as NonNullable<(typeof plannerSnapshots)[number]>[]) {
      const versionId = `guest-${userId.slice(0, 8)}-${snapshot.id}`.slice(0, 120);
      const snapshotItems = snapshot.items.map((item, index) => ({ ...item, id: `${versionId}-${index}`, planner_id: plannerId as string }));
      await createPlannerVersion(plannerId, JSON.stringify(snapshot.state), snapshotItems, versionId, snapshot.created_at);
      plannerSnapshotIds.push(versionId);
    }
  }

  for (const code of new Set(favoriteCodes as string[])) await addFavorite(userId, code);

  const savedScores = await Promise.all(scoreIds.map((hash) => hasMemberScoreSnapshot(userId, `guest-${hash}`)));
  const savedMockExams = await Promise.all((exams as NonNullable<(typeof exams)[number]>[]).map((exam) => hasMockExam(userId, exam.id)));
  const savedPlannerItems = await Promise.all(plannerWrittenIds.map((id) => plannerId ? hasPlannerItem(plannerId, id) : false));
  const savedPlannerSnapshots = await Promise.all(plannerSnapshotIds.map((id) => plannerId ? hasPlannerVersion(plannerId, id) : false));
  const savedFavorites = favoriteCodes.length ? await listFavorites(userId) : [];
  const readback = {
    scores: savedScores.filter(Boolean).length,
    mockExams: savedMockExams.filter(Boolean).length,
    plannerItems: savedPlannerItems.filter(Boolean).length,
    plannerSnapshots: savedPlannerSnapshots.filter(Boolean).length,
    favorites: savedFavorites.filter((item) => new Set(favoriteCodes as string[]).has(item.school_code)).length,
    plannerState: plannerId && isPlannerState(body.plannerState) ? (await getPlannerState(plannerId)) === JSON.stringify(body.plannerState) : true,
  };
  const expectedPlannerCount = plannerWrittenIds.length;
  if (readback.scores !== scoreRecords.length || readback.mockExams !== exams.length
    || (expectedPlannerCount > 0 && readback.plannerItems < expectedPlannerCount)
    || readback.plannerSnapshots !== plannerSnapshotIds.length
    || readback.favorites !== new Set(favoriteCodes as string[]).size || !readback.plannerState) {
    return Response.json({ ok: false, error: "import_readback_failed", readback }, { status: 502 });
  }
  return Response.json({
    ok: true,
    imported: { ...imported, scores: readback.scores, mockExams: readback.mockExams, plannerSnapshots: readback.plannerSnapshots, favorites: readback.favorites },
    readback,
  }, { headers: { "cache-control": "no-store" } });
}

function isArrayWithin(value: unknown, max: number): value is unknown[] { return Array.isArray(value) && value.length <= max; }
function isObject(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }

function validateScore(value: unknown) {
  if (!isObject(value) || typeof value.district !== "string" || !getRegionRegistry().some((region) => region.id === value.district)
    || typeof value.academicYear !== "string" || !/^\d{4}$/.test(value.academicYear)
    || typeof value.savedAt !== "string" || Number.isNaN(Date.parse(value.savedAt)) || !isObject(value.result)
    || typeof value.result.totalScore !== "number" || !Number.isFinite(value.result.totalScore) || value.result.totalScore < 0) return null;
  return { district: value.district, academicYear: value.academicYear, savedAt: new Date(value.savedAt).toISOString(), totalScore: value.result.totalScore, result: value.result };
}

function validateMockExam(value: unknown) {
  if (!isObject(value) || typeof value.id !== "string" || !/^[\w-]{1,80}$/.test(value.id)
    || typeof value.name !== "string" || !value.name.trim() || value.name.length > 120
    || typeof value.date !== "string" || !isValidDate(value.date) || !isObject(value.subjects)
    || typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt))
    || (value.updatedAt !== undefined && (typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))))) return null;
  const subjects: Record<string, number | null> = {};
  for (const subject of SUBJECTS) {
    const score = value.subjects[subject];
    if (score !== null && score !== undefined && (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100)) return null;
    subjects[subject] = score == null ? null : score;
  }
  if (Object.keys(value.subjects).some((subject) => !SUBJECTS.includes(subject as typeof SUBJECTS[number]))) return null;
  return {
    id: value.id,
    name: value.name.trim(),
    date: value.date,
    subjects,
    essay: typeof value.essay === "string" ? value.essay.slice(0, 40) : "",
    createdAt: new Date(value.createdAt).toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? new Date(value.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function validatePlannerItem(value: unknown): Omit<PlannerItem, "id" | "planner_id"> | null {
  if (!isObject(value) || typeof value.district !== "string" || !getRegionRegistry().some((region) => region.id === value.district)
    || typeof value.school_code !== "string" || !isKnownSchool(value.school_code)
    || typeof value.school_name !== "string" || typeof value.department !== "string"
    || typeof value.tier !== "string" || !["", "challenge", "balanced", "stable"].includes(value.tier)
    || typeof value.notes !== "string" || typeof value.created_at !== "string" || Number.isNaN(Date.parse(value.created_at))) return null;
  return {
    district: value.district,
    school_code: value.school_code,
    school_name: value.school_name.slice(0, 120),
    department: value.department.slice(0, 1200),
    tier: value.tier,
    notes: value.notes.slice(0, 1000),
    created_at: new Date(value.created_at).toISOString(),
  };
}

function isKnownSchool(code: string) { return getSchoolSearchIndex().some((school) => school.code === code); }
function isValidDate(value: string) { const date = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }
function plannerKey(item: Pick<PlannerItem, "district" | "school_code" | "department">) { return `${item.district}:${item.school_code}:${item.department}`; }
function isPlannerState(value: unknown): value is Record<string, unknown> { return isObject(value) && JSON.stringify(value).length <= 100_000; }
async function stableHash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
