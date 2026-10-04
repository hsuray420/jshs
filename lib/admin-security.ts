export function assertSameOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin === requestUrl.origin && (!fetchSite || fetchSite === "same-origin")) return;
  throw new Error("cross_origin_request");
}

