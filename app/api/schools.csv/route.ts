import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

const DISTRICT_ASSETS: Readonly<Record<string, string>> = {
  ct: "/it_hs/ct/schools.csv",
  tp: "/it_hs/tp/schools_tp.csv",
  ilan: "/it_hs/ilan/schools.csv",
  "taoyuan-lienchiang": "/it_hs/taoyuan-lienchiang/schools_tl.csv",
  "hsinchu-miaoli": "/it_hs/hsinchu-miaoli/schools.csv",
  changhua: "/it_hs/changhua/schools.csv",
  yunlin: "/it_hs/yunlin/schools.csv",
  chiayi: "/it_hs/chiayi/schools.csv",
  tainan: "/it_hs/tainan/schools.csv",
  kaohsiung: "/it_hs/kaohsiung/schools.csv",
  pingtung: "/it_hs/pingtung/schools.csv",
  hualien: "/it_hs/hualien/schools.csv",
  taitung: "/it_hs/taitung/schools.csv",
  penghu: "/it_hs/penghu/schools.csv",
  kinmen: "/it_hs/kinmen/schools.csv",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const district = url.searchParams.get("district") || "ct";
  const assetPath = DISTRICT_ASSETS[district];
  if (!assetPath) {
    return Response.json({ ok: false, error: "invalid_district" }, { status: 400 });
  }

  const assetUrl = new URL(assetPath, request.url);
  const asset = await env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
  if (!asset.ok) return Response.json({ ok: false, error: "school_data_not_found" }, { status: 404 });

  const headers = new Headers(asset.headers);
  headers.set("cache-control", "public, max-age=300, stale-while-revalidate=3600");
  headers.set("content-disposition", `inline; filename="schools-${district}.csv"`);
  headers.set("content-type", "text/csv; charset=utf-8");
  headers.set("x-jshs-storage", "cloudflare-assets");
  return new Response(asset.body, { status: 200, headers });
}
