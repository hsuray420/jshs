import { calculateAdmissionScore, isAdmissionDistrict, type AdmissionScoreInput } from "../../../../lib/admission-score";
import { getMemberSession } from "../../../../lib/member-auth";
import { notifyMember } from "../../../../lib/notifications";

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
    const member = await getMemberSession();
    const notification = member ? await notifyMember({
      eventKey: "score_calculated",
      lineUserId: member.lineUserId,
      values: {
        district: result.rule.label,
        academicYear: result.rule.academicYear,
        score: result.totalScore,
      },
    }) : { sent: 0, skipped: true };
    return Response.json({
      ok: true,
      source: `115_${district}_admission_rules`,
      result,
      notification: { sent: notification.sent, skipped: notification.skipped },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid admission score input";
    return Response.json({ ok: false, error: message.includes("Unsupported admission district") ? "不支援的就學區，請重新選擇。" : "試算資料格式不正確。" }, { status: 400 });
  }
}
