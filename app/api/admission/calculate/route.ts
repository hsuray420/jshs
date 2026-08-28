import { calculateAdmissionScore, isAdmissionCalculatorAvailable, isAdmissionDistrict, type AdmissionScoreInput } from "../../../../lib/admission-score";
import { createMemberScoreSnapshot } from "../../../../db/score-store";
import { getMemberSession } from "../../../../lib/member-auth";
import { notifyMember } from "../../../../lib/notifications";

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "/api/admission/calculate",
    method: "POST",
    scoreStorage: "tenths",
    districts: ["tp", "ct", "ilan", "taoyuan-lienchiang", "hsinchu-miaoli", "changhua", "yunlin", "chiayi", "tainan", "kaohsiung", "pingtung", "hualien", "taitung", "penghu", "kinmen"],
    note: "POST AdmissionScoreInput JSON to calculate the selected district's score, rule explanation, comparison keys, and per-choice results. Reference-mode districts accept manualCategoryScores from the Notebook report.",
  });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as AdmissionScoreInput;
    const district = typeof input?.district === "string" ? input.district : "ct";
    if (!isAdmissionDistrict(district)) {
      return Response.json({ ok: false, error: "不支援的就學區，請重新選擇。" }, { status: 400 });
    }
    if (!isAdmissionCalculatorAvailable(district)) return Response.json({ ok: false, error: "此區目前尚未開放積分試算，待研究規則資料建置完成後開放。" }, { status: 409 });
    const result = calculateAdmissionScore({ ...input, district });
    if ("status" in result && result.status === "incomplete") {
      return Response.json({ ok: false, error: "請補齊研究規則要求的欄位後再試算。", result }, { status: 422 });
    }
    if (result.totalScore === null) return Response.json({ ok: false, error: "請補齊試算欄位。", result }, { status: 422 });
    const member = await getMemberSession();
    if (member) {
      await createMemberScoreSnapshot({
        id: crypto.randomUUID(),
        line_user_id: member.lineUserId,
        district,
        academic_year: result.rule.academicYear,
        total_score: result.totalScore,
        result_json: JSON.stringify(result),
        created_at: new Date().toISOString(),
      });
    }
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
