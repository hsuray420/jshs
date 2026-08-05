import { calculateAdmissionScore, type AdmissionScoreInput } from "../../../../lib/admission-score";

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "/api/admission/calculate",
    method: "POST",
    scoreStorage: "tenths",
    note: "POST AdmissionScoreInput JSON to calculate total score, storage tenths, comparison keys, and per-choice results.",
  });
}

export async function POST(request: Request) {
  const input = (await request.json()) as AdmissionScoreInput;
  return Response.json({
    ok: true,
    source: "115_ct_admission_rules",
    result: calculateAdmissionScore(input),
  });
}
