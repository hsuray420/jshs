import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../auth";
import { getSchoolByCode } from "../../../../lib/school-repository";
import { parseCsv } from "../../../../lib/school-data/pipeline.mjs";
import { getCanonicalSchoolFileSnapshot } from "../../../../lib/school-github-sync";
import { AdminSchoolDetailEditor } from "../../../../components/admin-school-detail-editor";
import { getSchoolDataDraft } from "../../../../db/admin-store";

export const dynamic = "force-dynamic";

export default async function AdminSchoolDetailPage({ params, searchParams }: { params: Promise<{ schoolCode: string }>; searchParams: Promise<{ region?: string }> }) {
  const admin = await requireAdmin();
  const { schoolCode } = await params;
  const school = getSchoolByCode(schoolCode);
  if (!school) notFound();
  const query = await searchParams;
  const records = school.admissionRecords.map((record) => ({ record, regionCode: (record as { sourceDistrictCode?: string }).sourceDistrictCode })).filter((item) => item.regionCode);
  const selected = records.find((item) => item.regionCode === query.region) || (records.length === 1 ? records[0] : null);
  if (!selected) return <><section className="admin-page-heading"><div><p className="admin-eyebrow">School / Region Required</p><h1>{school.name}</h1><p className="admin-muted">這所學校在多個區域資料列中出現，請先選擇要編輯的 canonical regional CSV。</p></div></section><section className="admin-panel admin-region-choice"><h2>選擇資料來源</h2>{records.map(({ record, regionCode }) => { const sourceRecord = record as typeof record & { sourceCsv?: string }; return <Link key={regionCode} href={`/admin/schools/${encodeURIComponent(school.code)}?region=${encodeURIComponent(regionCode || "")}`}><strong>{record.sourceDistrict || regionCode}</strong><span>{sourceRecord.sourceCsv || "regional CSV"}</span></Link>; })}</section></>;
  const sourceRecord = selected.record as typeof selected.record & { sourceCsv?: string };
  const localRaw: Record<string, string> = selected.record.raw as Record<string, string>;
  let raw = localRaw;
  let expectedSha = "";
  let syncConfigured = false;
  let sourceFile = sourceRecord.sourceCsv || "regional CSV";
  let repository = "";
  let branch = "main";
  try {
    const snapshot = await getCanonicalSchoolFileSnapshot(selected.regionCode!);
    if ("content" in snapshot) {
      const remote = (parseCsv(snapshot.content).rows as Record<string, string>[]).find((row) => row["學校代碼"] === school.code);
      if (remote) raw = remote;
      expectedSha = snapshot.sha || "";
      syncConfigured = true;
      sourceFile = snapshot.filePath;
      repository = snapshot.repository || "";
      branch = snapshot.branch || "main";
    }
  } catch { /* The local repository remains readable when GitHub is unavailable. */ }
  let initialDraft = raw;
  let initialDraftBase = raw;
  try {
    const saved = await getSchoolDataDraft(school.code, selected.regionCode!, admin.user.lineUserId);
    if (saved) {
      initialDraft = { ...raw, ...(JSON.parse(saved.updates_json) as Record<string, string>) };
      initialDraftBase = { ...raw, ...(JSON.parse(saved.base_values_json) as Record<string, string>) };
    }
  } catch { /* A D1 outage must not prevent read-only access to canonical data. */ }
  const canPublish = admin.user.role === "owner" || admin.user.role === "administrator";
  return <><section className="admin-page-heading admin-detail-heading"><div><Link className="admin-back-link" href="/admin/schools">← 返回學校資料管理</Link><p className="admin-eyebrow">Canonical School / {selected.regionCode}</p><h1>{raw["學校名稱"] || school.name}</h1><p className="admin-muted">{school.code} · {raw["縣市"]} {raw["區"]} · {raw["公私立"]} · {raw["學制分類"]}</p></div><span className="admin-badge">{admin.user.role}</span></section><section className="admin-source-strip"><span><strong>{syncConfigured ? "GitHub 已連線" : "GitHub 尚未連線"}</strong><small>{syncConfigured ? `${repository} · ${branch} · ${expectedSha.slice(0, 12)}` : "草稿仍可保存；發布需要 server-side token"}</small></span><span><strong>Canonical source</strong><small>{sourceFile}</small></span></section><AdminSchoolDetailEditor schoolCode={school.code} regionCode={selected.regionCode!} raw={raw} initialDraft={initialDraft} initialDraftBase={initialDraftBase} expectedSha={expectedSha} sourceFile={sourceFile} syncConfigured={syncConfigured} canPublish={canPublish} /></>;
}
