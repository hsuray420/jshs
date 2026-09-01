"use client";

import { useEffect, useState } from "react";

export function SupportDonationForm() {
  const [donationUrl, setDonationUrl] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/site-config", { headers: { accept: "application/json" } })
      .then((response) =>
        response.ok
          ? (response.json() as Promise<{ donation_url?: string }>)
          : ({} as { donation_url?: string }),
      )
      .then((config) => {
        const url = String(config.donation_url || "").trim();
        if (/^https:\/\//i.test(url)) setDonationUrl(url);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  return (
    <section className="mx-auto w-[min(840px,calc(100%-32px))] py-10">
      <div className="grid gap-5 p-6 jshs-surface-card">
        <div>
          <h2 className="text-2xl">小額捐款</h2>
          <p className="mt-2 text-sm leading-6 jshs-muted-copy">
            本站目前核心功能免費使用，由民間投入時間整理與維護。若覺得網站有幫助，歡迎以小額捐款或贊助支持網站持續維護。
          </p>
        </div>
        {!ready ? <p role="status" className="text-sm jshs-muted-copy">正在準備外部付款連結…</p> : null}
        {ready && donationUrl ? (
          <a href={donationUrl} target="_blank" rel="noreferrer" className="w-fit min-h-11 px-5 py-3 text-sm jshs-button-primary">
            前往外部付款頁面 ↗
          </a>
        ) : null}
        {ready && !donationUrl ? (
          <p role="status" className="text-sm font-bold text-amber-700">目前外部付款連結尚未設定，請稍後再試。</p>
        ) : null}
        <p className="text-xs leading-6 text-slate-500">
          點擊後會在新分頁開啟外部付款服務；付款資料與結果以該服務頁面顯示為準，本站不蒐集信用卡資料。
        </p>
      </div>
    </section>
  );
}
