"use client";

import { useState } from "react";
import { readLocalPlanner, writeLocalPlanner } from "@/lib/planner-local";

export function SchoolPlannerAction({
  schoolCode,
  schoolName,
  departments,
}: {
  schoolCode: string;
  schoolName: string;
  departments: string;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "member_required">("idle");

  async function saveSchool() {
    setStatus("saving");
    if (typeof window !== "undefined") {
      const item = { id: crypto.randomUUID(), district: "ct", school_code: schoolCode, school_name: schoolName, department: departments, tier: "balanced", notes: "", created_at: new Date().toISOString() };
      const items = [...readLocalPlanner().items, item];
      writeLocalPlanner(items, { order: items.map((entry) => entry.id) });
      setStatus("saved");
      return;
    }
    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        district: "ct",
        schoolCode,
        schoolName,
        department: departments,
      }),
    }).catch(() => null);
    setStatus(response?.status === 401 ? "member_required" : response?.ok ? "saved" : "error");
  }

  return (
    <div>
      <button
        type="button"
        onClick={saveSchool}
        disabled={status === "saving" || status === "saved"}
        className="px-5 py-3.5 text-sm jshs-button-primary disabled:cursor-default disabled:bg-[#4f6c96]"
      >
        {status === "saving" ? "儲存中…" : status === "saved" ? "已加入我的規劃" : "加入我的規劃"}
      </button>
      {status === "saved" ? <p className="mt-2 text-sm font-bold text-emerald-700" role="status">已保存於目前裝置；登入 LINE 後才能跨裝置同步。</p> : null}
      {status === "error" ? <p className="mt-2 text-sm font-bold text-red-700" role="status">暫時無法儲存，請稍後再試。</p> : null}
    </div>
  );
}
