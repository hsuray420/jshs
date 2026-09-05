import schoolsMasterCsv from "../../../content/schools/generated/schools_master.csv?raw";

export const dynamic = "force-dynamic";

/**
 * Compatibility download endpoint. It serves the national entity source, not
 * one of the retired district-specific front-end files.
 */
export async function GET() {
  return new Response(schoolsMasterCsv, {
    headers: {
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      "content-disposition": "inline; filename=schools_master.csv",
      "content-type": "text/csv; charset=utf-8",
      "x-jshs-school-source": "schools_master.csv",
    },
  });
}
