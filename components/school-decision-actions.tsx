"use client";

import { useState } from "react";

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
}: {
  district: string;
  schoolCode: string;
  schoolName: string;
  departments: string;
}) {
  const [tier, setTier] = useState<Tier>("balanced");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [compareStatus, setCompareStatus] = useState<"idle" | "added">("idle");

  async function saveSchool() {
    setStatus("saving");
    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ district, schoolCode, schoolName, department: departments, tier, notes }),
    }).catch(() => null);
    setStatus(response?.ok ? "saved" : "error");
  }

  function addToCompare() {
    try {
      const current = JSON.parse(localStorage.getItem("jshs:school-compare:v1") || "[]") as Array<{ district: string; code: string; name: string }>;
      if (!current.some((item) => item.district === district && item.code === schoolCode)) {
        localStorage.setItem("jshs:school-compare:v1", JSON.stringify([...current, { district, code: schoolCode, name: schoolName }].slice(-4)));
      }
      setCompareStatus("added");
    } catch {
      setCompareStatus("idle");
    }
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
        <button type="button" onClick={addToCompare} className="px-4 py-3 text-sm jshs-button-secondary">
          {compareStatus === "added" ? "已加入比較" : "加入比較"}
        </button>
      </div>
      {status === "error" ? <p className="mt-3 text-sm font-bold text-red-700" role="status">暫時無法儲存，請稍後再試。</p> : null}
    </div>
  );
}
