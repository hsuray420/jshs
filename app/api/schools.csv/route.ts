import { getR2, getSiteSetting } from "../../../db/admin-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const setting = await getSiteSetting("schools_csv_object_key").catch(() => null);
  if (setting?.value) {
    const object = await getR2().get(setting.value);
    if (object) {
      return new Response(object.body, {
        headers: {
          "cache-control": "no-store",
          "content-disposition": `inline; filename="schools.csv"`,
          "content-type": "text/csv; charset=utf-8",
        },
      });
    }
  }

  return Response.redirect(new URL("/it_hs/schools.csv", request.url), 307);
}
