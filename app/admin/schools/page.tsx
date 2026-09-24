import { requireAdmin } from "../auth";
import { getSchools } from "../../../lib/school-repository";
import { listSchoolMediaOverrides } from "../../../db/admin-store";
import { AdminSchoolsBrowser, type AdminSchoolListItem } from "../../../components/admin-schools-browser";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  await requireAdmin();
  const [schools, media] = await Promise.all([Promise.resolve(getSchools()), listSchoolMediaOverrides()]);
  const imageCodes = new Set(media.map((item) => item.school_code));
  const items: AdminSchoolListItem[] = schools.map((school) => ({
    code: school.code, name: school.name, ownership: school.ownership, schoolType: school.schoolType,
    city: school.city, area: school.area, districts: school.admissionDistricts,
    regions: [...new Set(school.admissionRecords.map((record) => (record as { sourceDistrictCode?: string }).sourceDistrictCode).filter(Boolean) as string[])],
    address: school.address, website: school.website, transport: school.transport, commute: school.commute,
    lodging: school.lodging, hasImage: imageCodes.has(school.code),
  }));
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Data / Canonical Schools</p><h1>學校資料管理</h1><p className="admin-muted">搜尋前台正式學校資料，從正確的區域 CSV 進行小幅修正。生成快取不在此直接編輯。</p></div><span className="admin-badge ok">{items.length} 所學校</span></section><AdminSchoolsBrowser schools={items} /></>;
}
