"use client";

import { useState } from "react";

export function SchoolPlannerAction({
  schoolCode,
  schoolName,
  departments,
}: {
  schoolCode: string;
  schoolName: string;
  departments: string;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function saveSchool() {
    setStatus("saving");
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
    setStatus(response?.ok ? "saved" : "error");
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
      {status === "error" ? <p className="mt-2 text-sm font-bold text-red-700" role="status">暫時無法儲存，請稍後再試。</p> : null}
    </div>
  );
}
