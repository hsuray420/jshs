"use client";

import { useEffect, useState } from "react";

export function ImageKitSmokeTrigger() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const imageKitNonce = query.get("storageMigrationImageKitSmoke");
    const cutoverNonce = query.get("storageMigrationCutoverSmoke");
    const nonce = imageKitNonce ?? cutoverNonce;
    const mode = imageKitNonce ? "imagekit" : cutoverNonce ? "cutover" : null;
    if (!nonce || !mode || !/^[a-f0-9-]{36}$/.test(nonce)) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/admin/system/imagekit-smoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nonce, mode }),
      }).then(async (response) => {
        const result = await response.json().catch(() => null) as { ok?: boolean } | null;
        setStatus(response.ok && result?.ok
          ? mode === "imagekit" ? "ImageKit 暫存上傳、讀取與刪除驗證完成。" : "三個獨立 D1 bindings 查詢成功。"
          : "系統資源驗證未通過；請確認管理員登入與服務設定。");
      }).catch(() => setStatus("無法連線執行系統資源驗證。"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return status ? <p role="status" className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-800">{status}</p> : null;
}
