import { getD1 } from "../db/admin-store";
import { ANONYMOUS_QUESTION_LIMIT, getQuestionAllowance } from "./assistant-policy";

export const ASSISTANT_GUEST_COOKIE = "jshs_ai_guest";

export async function consumeGuestQuestion(guestId: string) {
  const db = getD1();
  await db.prepare(`CREATE TABLE IF NOT EXISTS assistant_guest_usage (
    guest_id TEXT PRIMARY KEY,
    question_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`).run();
  const result = await db.prepare(`INSERT INTO assistant_guest_usage (guest_id, question_count, updated_at)
    VALUES (?, 1, ?)
    ON CONFLICT(guest_id) DO UPDATE SET
      question_count = question_count + 1,
      updated_at = excluded.updated_at
    WHERE question_count < ?
    RETURNING question_count`).bind(guestId, new Date().toISOString(), ANONYMOUS_QUESTION_LIMIT).first<{ question_count: number }>();
  if (result) {
    const allowance = getQuestionAllowance(false, result.question_count);
    return Object.freeze({ ...allowance, used: result.question_count });
  }
  const current = await db.prepare(`SELECT question_count FROM assistant_guest_usage WHERE guest_id = ?`).bind(guestId).first<{ question_count: number }>();
  const used = current?.question_count ?? ANONYMOUS_QUESTION_LIMIT;
  return Object.freeze({ ...getQuestionAllowance(false, used), used });
}
