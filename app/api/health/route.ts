export async function GET() {
  return Response.json({
    ok: true,
    service: "jshs-admission-site",
    phase: "line-admin-and-file-backend",
    checked_at: new Date().toISOString(),
  });
}
