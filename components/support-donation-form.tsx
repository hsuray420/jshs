"use client";

import { useState, type FormEvent } from "react";
import { MAX_DONATION_AMOUNT, MIN_DONATION_AMOUNT } from "../lib/donation";

const PRESET_AMOUNTS = [10, 50, 100, 200, 300, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 30_000, 50_000, 80_000, 100_000];

export function SupportDonationForm() {
  const [amount, setAmount] = useState("100");
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");

  const selectedAmount = amount === "custom" ? customAmount : amount;

  function submitDonation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(selectedAmount);
    if (!Number.isInteger(numericAmount) || numericAmount < MIN_DONATION_AMOUNT || numericAmount > MAX_DONATION_AMOUNT) {
      setError(`請輸入 ${MIN_DONATION_AMOUNT.toLocaleString()} 至 ${MAX_DONATION_AMOUNT.toLocaleString()} 元的整數金額。`);
      return;
    }
    setError("");
    window.open(`/api/donation/checkout?amount=${numericAmount}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10">
      <div className="grid gap-5 p-6 jshs-surface-card">
        <div className="text-center"><h2 className="text-2xl">— 選擇捐款金額 —</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">感謝你支持 JSHS.cc。選擇或輸入金額後，系統會前往綠界付款頁面。</p></div>
        <form className="grid gap-4" target="_blank" onSubmit={submitDonation}>
          <fieldset className="grid gap-3"><legend className="sr-only">捐款金額（最低 10 元，最高 100,000 元）</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {PRESET_AMOUNTS.map((preset) => <label key={preset} className="cursor-pointer"><input className="sr-only" type="radio" name="amount" value={preset} checked={amount === String(preset)} onChange={(event) => setAmount(event.target.value)} /><span className={`block rounded-lg border px-3 py-4 text-center text-lg ${amount === String(preset) ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-800" : "border-slate-200"}`}>{preset.toLocaleString()}<small className="ml-1 text-sm font-normal">元</small></span></label>)}
            <label className="cursor-pointer"><input className="sr-only" type="radio" name="amount" value="custom" checked={amount === "custom"} onChange={(event) => setAmount(event.target.value)} /><span className={`block rounded-lg border px-3 py-4 text-center text-lg ${amount === "custom" ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-800" : "border-slate-200"}`}>自訂金額</span></label>
          </div></fieldset>
          {amount === "custom" ? <label className="mx-auto grid w-full max-w-sm gap-2 text-sm"><span>自訂金額（元）</span><input className="min-h-11 rounded-lg border border-slate-300 px-3" type="number" min={MIN_DONATION_AMOUNT} max={MAX_DONATION_AMOUNT} step="1" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} placeholder="10～100,000" required /></label> : null}
          {error ? <p role="alert" className="text-center text-sm font-bold text-red-700">{error}</p> : null}
          <button type="submit" className="mx-auto min-h-11 px-6 py-3 text-sm jshs-button-primary">前往綠界付款頁面 ↗</button>
        </form>
        <p className="text-center text-xs leading-6 text-slate-500">付款資料與結果以綠界頁面顯示為準；本站不蒐集信用卡資料。</p>
      </div>
    </section>
  );
}
