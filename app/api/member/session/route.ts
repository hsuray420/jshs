import { getMemberSession } from "../../../../lib/member-auth";

export async function GET() {
  const member = await getMemberSession();
  return Response.json(
    member ? { authenticated: true, displayName: member.displayName, pictureUrl: member.pictureUrl || null } : { authenticated: false },
    { headers: { "cache-control": "no-store" } },
  );
}
