export async function GET() {
  return Response.json({
    ok: true,
    service: "jshs-admission-site",
    phase: "static-preview-with-backend-stubs",
  });
}
