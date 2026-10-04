"use client";

import { useState } from "react";

type SmokeResult = {
  fileIdVerified?: boolean;
  urlVerified?: boolean;
  deleteVerified?: boolean;
};

export function ImageKitSmokeTrigger() {
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);

  async function runSmokeTest() {
    setRunning(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/system/imagekit-smoke", { method: "POST" });
      const result = await response.json().catch(() => null) as { ok?: boolean; result?: SmokeResult } | null;
      if (!response.ok || !result?.ok || !result.result) {
        setStatus("ImageKit smoke test 未通過；請確認管理員權限與 ImageKit 設定。");
        return;
      }
      const { fileIdVerified, urlVerified, deleteVerified } = result.result;
      setStatus(fileIdVerified && urlVerified && deleteVerified
        ? "UPLOAD PASS · READ PASS · DELETE PASS"
        : "ImageKit smoke test 驗證結果不完整。");
    } catch {
      setStatus("無法連線執行 ImageKit smoke test。");
    } finally {
      setRunning(false);
    }
  }

  return <div className="mt-4">
    <button type="button" onClick={() => void runSmokeTest()} disabled={running}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
      {running ? "ImageKit 測試中…" : "執行 ImageKit upload / read / delete 測試"}
    </button>
    {status && <p role="status" className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-800">{status}</p>}
  </div>;
}
