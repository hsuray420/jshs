import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../auth";
import { getSchoolByCode } from "../../../../lib/school-repository";
import { parseCsv } from "../../../../lib/school-data/pipeline.mjs";
import { getCanonicalSchoolFileSnapshot } from "../../../../lib/school-github-sync";
import { AdminSchoolDetailEditor } from "../../../../components/admin-school-detail-editor";

export const dynamic = "force-dynamic";

export default async function AdminSchoolDetailPage({ params, searchParams }: { params: Promise<{ schoolCode: string }>; searchParams: Promise<{ region?: string }> }) {
  await requireAdmin();
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
  try {
    const snapshot = await getCanonicalSchoolFileSnapshot(selected.regionCode!);
    if ("content" in snapshot) {
      const remote = (parseCsv(snapshot.content).rows as Record<string, string>[]).find((row) => row["學校代碼"] === school.code);
      if (remote) raw = remote;
      expectedSha = snapshot.sha || "";
      syncConfigured = true;
      sourceFile = snapshot.filePath;
    }
  } catch { /* The local repository remains readable when GitHub is unavailable. */ }
  return <><section className="admin-page-heading admin-detail-heading"><div><Link className="admin-back-link" href="/admin/schools">← 返回學校資料管理</Link><p className="admin-eyebrow">Canonical School / {selected.regionCode}</p><h1>{raw["學校名稱"] || school.name}</h1><p className="admin-muted">{school.code} · {raw["縣市"]} {raw["區"]} · {raw["公私立"]} · {raw["學制分類"]}</p></div><Link className="admin-button-secondary" href={`/admin/media?school_code=${encodeURIComponent(school.code)}`}>管理學校圖片</Link></section><section className="admin-source-strip"><span><strong>Canonical source</strong><small>{sourceFile}</small></span><span><strong>{syncConfigured ? "GitHub SHA 已載入" : "尚未連線 GitHub"}</strong><small>{expectedSha || "儲存前需要 server-side GitHub token"}</small></span></section><AdminSchoolDetailEditor schoolCode={school.code} regionCode={selected.regionCode!} raw={raw} expectedSha={expectedSha} syncConfigured={syncConfigured} /></>;
}
