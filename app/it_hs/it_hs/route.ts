export function GET(request: Request) {
  const source = new URL(request.url);
  const destination = new URL("/it_hs/guide.htm", source.origin);
  destination.search = source.search;
  return Response.redirect(destination, 307);
}
