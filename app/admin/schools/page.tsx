import Link from "next/link";
import { requireAdmin } from "../auth";
import { getSchools, getRegions } from "../../../lib/school-repository";
import { listSchoolMediaMetadata } from "../../../db/school-media-store";
import { AdminSchoolsBrowser, type AdminSchoolListItem } from "../../../components/admin-schools-browser";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  await requireAdmin();
  const { region = "" } = await searchParams;
  const [schools, media] = await Promise.all([Promise.resolve(getSchools()), listSchoolMediaMetadata()]);
  const imageCodes = new Set(media.map((item) => item.school_code));
  const regionsList = getRegions();
  const regionItem = regionsList.find((item: { code: string; label: string }) => item.code === region || item.label === region);
  const targetRegion = regionItem?.label || region;
  const items: AdminSchoolListItem[] = schools.map((school) => ({
    code: school.code, name: school.name, ownership: school.ownership, schoolType: school.schoolType,
    city: school.city, area: school.area, districts: school.admissionDistricts,
    regions: [...new Set([
      ...school.admissionDistricts,
      ...school.admissionRecords.map((record) => record.sourceDistrict).filter(Boolean),
    ])],
    address: school.address, website: school.website, transport: school.transport, commute: school.commute,
    lodging: school.lodging, hasImage: imageCodes.has(school.code),
  }));
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Data / Canonical Schools</p><h1>學校資料管理</h1><p className="admin-muted">搜尋前台正式學校資料，從正確的區域 CSV 進行修正。生成快取不在此直接編輯。</p></div><div style={{ display: "flex", gap: "10px", alignItems: "center" }}><Link className="admin-button-secondary" href="/admin/schools/popular">設定熱門學校 ↗</Link><span className="admin-badge ok">{items.length} 所學校</span></div></section><AdminSchoolsBrowser schools={items} initialRegion={targetRegion} /></>;
}
