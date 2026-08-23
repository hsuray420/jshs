import { calculateAdmissionScore, isAdmissionDistrict, type AdmissionScoreInput } from "../../../../lib/admission-score";

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "/api/admission/calculate",
    method: "POST",
    scoreStorage: "tenths",
    districts: ["tp", "ct", "tainan", "kaohsiung", "taoyuan-lienchiang"],
    note: "POST AdmissionScoreInput JSON to calculate the selected district's score, rule explanation, comparison keys, and per-choice results.",
  });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as AdmissionScoreInput;
    const district = typeof input?.district === "string" ? input.district : "ct";
    if (!isAdmissionDistrict(district)) {
      return Response.json({ ok: false, error: "不支援的就學區，請重新選擇。" }, { status: 400 });
    }
    const result = calculateAdmissionScore({ ...input, district });
    return Response.json({ ok: true, source: `115_${district}_admission_rules`, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid admission score input";
    return Response.json({ ok: false, error: message.includes("Unsupported admission district") ? "不支援的就學區，請重新選擇。" : "試算資料格式不正確。" }, { status: 400 });
  }
}
