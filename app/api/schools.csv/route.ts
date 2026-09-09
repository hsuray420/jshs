import schoolsCsv from "../../../public/data/schools.csv?raw";

export const dynamic = "force-dynamic";

/**
 * Compatibility download endpoint. The CSV is a generated aggregate view of
 * enabled regional CSV sources, never a manually maintained master file.
 */
export async function GET() {
  return new Response(schoolsCsv, {
    headers: {
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      "content-disposition": "inline; filename=schools.csv",
      "content-type": "text/csv; charset=utf-8",
      "x-jshs-school-source": "regional_csv",
    },
  });
}
