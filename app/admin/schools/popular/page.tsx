import type { Metadata } from "next";
import { requireAdmin } from "../../auth";
import { getPopularSchoolsMap } from "../../../../lib/popular-schools";
import { getRegionRegistry } from "../../../../lib/region-registry";
import { getSchools } from "../../../../lib/school-repository";
import { AdminPopularSchoolsEditor } from "../../../../components/admin-popular-schools-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "熱門學校推薦管理｜管理後台" };

export default async function AdminPopularSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; updated?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const [popularMap, schools] = await Promise.all([
    getPopularSchoolsMap(),
    Promise.resolve(getSchools()),
  ]);

  const regions = getRegionRegistry().map((r) => ({
    id: r.id,
    name: r.name,
  }));

  const allSchools = schools.map((school) => ({
    code: school.code,
    name: school.name,
    city: school.city,
    ownership: school.ownership,
    districts: school.admissionDistricts,
  }));

  const statusMessage =
    params.updated === "ok"
      ? "設定已儲存！前台「熱門學校」將即時顯示更新。"
      : "";

  return (
    <>
      <section className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Website Editor / Popular Schools</p>
          <h1>熱門學校推薦設定</h1>
          <p className="admin-muted">
            設定前台「全國校科查詢」頁面頂端優先展示的熱門學校。可針對各就學區（基北區、中投區、高雄區等）分別挑選推薦學校。
          </p>
        </div>
      </section>

      <AdminPopularSchoolsEditor
        initialPopularMap={popularMap}
        regions={regions}
        allSchools={allSchools}
        initialDistrict={params.district || "tp"}
        statusMessage={statusMessage}
      />
    </>
  );
}
