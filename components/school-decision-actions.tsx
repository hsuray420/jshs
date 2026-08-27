"use client";

import { useState } from "react";
import { readLocalPlanner, writeLocalPlanner } from "@/lib/planner-local";

type Tier = "challenge" | "balanced" | "stable";

const tierLabels: Readonly<Record<Tier, string>> = {
  challenge: "挑戰",
  balanced: "適中",
  stable: "穩定",
};
const tierActionLabels: Readonly<Record<Tier, string>> = {
  challenge: "加入挑戰",
  balanced: "加入適中",
  stable: "加入穩定",
};

export function SchoolDecisionActions({
  district,
  schoolCode,
  schoolName,
  departments,
  isMember,
}: {
  district: string;
  schoolCode: string;
  schoolName: string;
  departments: string;
  isMember: boolean;
}) {
  const [tier, setTier] = useState<Tier>("balanced");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "saved_local" | "error" | "member_required">("idle");

  async function saveSchool() {
    setStatus("saving");
    if (!isMember && typeof window !== "undefined") {
      const item = { id: crypto.randomUUID(), district, school_code: schoolCode, school_name: schoolName, department: departments, tier, notes, created_at: new Date().toISOString() };
      const items = [...readLocalPlanner().items, item];
      writeLocalPlanner(items, { order: items.map((entry) => entry.id) });
      setStatus("saved_local");
      return;
    }
    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ district, schoolCode, schoolName, department: departments, tier, notes }),
    }).catch(() => null);
    setStatus(response?.status === 401 ? "member_required" : response?.ok ? "saved" : "error");
  }

  return (
    <div>
      <p className="text-sm font-bold text-slate-600">先選擇風險層級，再儲存這個校科的理由。</p>
      <div className="mt-4 grid grid-cols-3 gap-2" aria-label="志願層級">
        {(Object.keys(tierLabels) as Tier[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTier(option)}
            aria-pressed={tier === option}
            className={`px-3 py-2 text-sm ${tier === option ? "jshs-button-primary" : "jshs-button-secondary"}`}
          >
            {tierActionLabels[option]}
          </button>
        ))}
      </div>
      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
        加備註
        <textarea value={notes} onChange={(event) => setNotes(event.target.value.slice(0, 1000))} rows={3} placeholder="例如：想了解餐飲課程、通勤約 35 分鐘" />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={saveSchool} disabled={status === "saving" || status === "saved"} className="px-4 py-3 text-sm jshs-button-primary">
          {status === "saving" ? "儲存中…" : status === "saved" ? `已加入${tierLabels[tier]}` : "加入規劃"}
        </button>
      </div>
      {status === "saved_local" ? <p className="mt-3 text-sm font-bold text-emerald-700" role="status">已保存於目前裝置；登入 LINE 後才能跨裝置同步。</p> : null}
      {status === "error" ? <p className="mt-3 text-sm font-bold text-red-700" role="status">暫時無法儲存，請稍後再試。</p> : null}
    </div>
  );
}
