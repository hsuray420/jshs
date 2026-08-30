"use client";

import { useState } from "react";

const amounts = [100, 300, 500];
export function SupportDonationForm() {
  const [amount, setAmount] = useState(300);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = custom ? Number(custom) : amount;
    if (!Number.isInteger(value) || value < 100 || value > 100_000) { setMessage("請輸入 100 至 100,000 元的整數金額。"); return; }
    setMessage("正在建立付款訂單…");
    const response = await fetch("/api/donations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount: value, name: name.trim(), note: note.trim() }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { checkoutUrl?: string; error?: string } | null;
    if (!response?.ok || !payload?.checkoutUrl) { setMessage(payload?.error === "payment_not_configured" ? "付款測試環境尚未設定，請稍後再試。" : "目前無法建立付款訂單，請稍後再試。"); return; }
    window.location.assign(payload.checkoutUrl);
  }
  return <section className="mx-auto w-[min(840px,calc(100%-32px))] py-10"><form onSubmit={submit} className="grid gap-5 p-6 jshs-surface-card"><div><h2 className="text-2xl">選擇支持金額</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">款項用於網站主機、資料整理與持續維護；付款由綠界科技處理，本站不接觸信用卡資料。</p></div><div className="flex flex-wrap gap-2">{amounts.map((value) => <button key={value} type="button" onClick={() => { setAmount(value); setCustom(""); }} className={`min-h-11 px-4 py-3 text-sm ${!custom && amount === value ? "jshs-button-primary" : "jshs-button-secondary"}`}>{value} 元</button>)}<label className="flex items-center gap-2 text-sm font-bold">自訂<input aria-label="自訂捐款金額" inputMode="numeric" value={custom} onChange={(event) => setCustom(event.target.value.replace(/\D/g, "").slice(0, 6))} className="w-28" />元</label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">姓名（選填）<input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label><label className="grid gap-2 text-sm font-bold">備註（選填）<input value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} /></label></div><button className="w-fit min-h-11 px-5 py-3 text-sm jshs-button-primary">前往安全付款</button>{message ? <p role="status" className="text-sm font-bold text-[var(--jshs-primary)]">{message}</p> : null}<p className="text-xs leading-6 text-slate-500">付款完成、失敗或取消後會顯示對應結果。付款結果須由綠界回傳並經伺服器驗證，不可由前端自行判定成功。</p></form></section>;
}
