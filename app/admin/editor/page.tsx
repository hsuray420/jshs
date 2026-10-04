import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminSchoolFrontendMirror } from "../../../components/admin-school-frontend-mirror";
import { getSchoolDataDraft } from "../../../db/admin-store";
import { parseCsv } from "../../../lib/school-data/pipeline.mjs";
import { getCanonicalSchoolFileSnapshot } from "../../../lib/school-github-sync";
import { getSchoolByCode } from "../../../lib/school-repository";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function AdminEditorPage({ searchParams }: { searchParams: Promise<{ schoolCode?: string; region?: string }> }) {
  const admin = await requireAdmin();
  const query = await searchParams;
  if (!query.schoolCode) return <section className="admin-panel admin-editor-entry">
    <p className="admin-eyebrow">Website editor</p><h1>前台鏡像編輯</h1>
    <p className="admin-muted">從正式學校資料選擇一所學校，在實際前台頁面上預覽並編輯。草稿儲存在後台，只有確認發布才會更新 GitHub source。</p>
    <Link className="admin-button" href="/admin/schools">選擇學校</Link>
  </section>;

  const school = getSchoolByCode(query.schoolCode);
  if (!school) notFound();
  const records = school.admissionRecords.map((record) => ({
    record,
    regionCode: (record as typeof record & { sourceDistrictCode?: string }).sourceDistrictCode,
  })).filter((item): item is typeof item & { regionCode: string } => Boolean(item.regionCode));
  const selected = records.find((item) => item.regionCode === query.region) || (records.length === 1 ? records[0] : null);
  if (!selected) return <section className="admin-panel admin-region-choice">
    <p className="admin-eyebrow">School / Region</p><h1>{school.name}</h1>
    <p className="admin-muted">這所學校出現在多個正式區域資料列中。選擇要預覽／編輯的資料來源。</p>
    {records.map(({ record, regionCode }) => {
      const sourceRecord = record as typeof record & { sourceCsv?: string };
      return <Link key={regionCode} href={`/admin/editor?schoolCode=${encodeURIComponent(school.code)}&region=${encodeURIComponent(regionCode)}`}>
        <strong>{record.sourceDistrict || regionCode}</strong><span>{sourceRecord.sourceCsv || "regional CSV"}</span>
      </Link>;
    })}
  </section>;
  const regionCode = selected.regionCode;
  if (!regionCode) notFound();

  const sourceRecord = selected.record as typeof selected.record & { sourceCsv?: string };
  const localRaw = selected.record.raw as Record<string, string>;
  const snapshot = await getCanonicalSchoolFileSnapshot(regionCode);
  const raw = "content" in snapshot
    ? (parseCsv(snapshot.content).rows as Record<string, string>[]).find((row) => row["學校代碼"] === school.code) || localRaw
    : localRaw;
  const expectedSha = "sha" in snapshot ? snapshot.sha || "" : "";
  const syncConfigured = "content" in snapshot;
  const sourceFile = "filePath" in snapshot ? snapshot.filePath : sourceRecord.sourceCsv || "regional CSV";
  const saved = await getSchoolDataDraft(school.code, regionCode, admin.user.lineUserId);
  const initialDraft = saved ? { ...raw, ...(JSON.parse(saved.updates_json) as Record<string, string>) } : raw;
  const initialDraftBase = saved ? { ...raw, ...(JSON.parse(saved.base_values_json) as Record<string, string>) } : raw;
  return <AdminSchoolFrontendMirror
    schoolCode={school.code}
    regionCode={regionCode}
    raw={raw}
    initialDraft={initialDraft}
    initialDraftBase={initialDraftBase}
    expectedSha={expectedSha}
    sourceFile={sourceFile}
    syncConfigured={syncConfigured}
    canEdit={["editor", "administrator", "owner"].includes(admin.user.role)}
    canPublish={admin.user.role === "owner" || admin.user.role === "administrator"}
    initialCommitSha={saved?.commit_sha || ""}
    initialCommitUrl={saved?.commit_url || ""}
  />;
}
