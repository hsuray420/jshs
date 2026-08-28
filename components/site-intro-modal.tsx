"use client";

import { useEffect, useRef, useState } from "react";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";

type IntroCard = { icon: SiteIconName; eyebrow: string; title: string; body: string };

const introCards: readonly IntroCard[] = [
  { icon: "shield", eyebrow: "資料查證", title: "資訊基本上正確，但請多方確認", body: "本站資料已盡力蒐集與核對，基本上是正確且可靠的；但因資料更新、來源差異或人工整理，仍不排除錯誤。重要資訊請以官方最新公告為準，並建議多方查證。" },
  { icon: "sparkle", eyebrow: "公益網站", title: "免費使用，沒有任何盈利", body: "本站由民間無償開發與維護，不收取使用費，也沒有任何盈利。若覺得網站有幫助，歡迎轉發給需要的人，或以小額捐款支持維護。" },
  { icon: "knowledge", eyebrow: "社群共建", title: "一起讓資料更完整", body: "如果你發現資料有誤、已經更新，或有值得補充的資訊，歡迎回報給我們。每一次回饋，都能幫助更多家庭找到可靠的升學方向。" },
] as const;

export function SiteIntroModal({ isMember }: { isMember: boolean }) {
  const [open, setOpen] = useState(!isMember);
  const acknowledgeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isMember || !open) return;
    acknowledgeRef.current?.focus();
    document.body.classList.add("jshs-intro-modal-open");
    return () => document.body.classList.remove("jshs-intro-modal-open");
  }, [isMember, open]);

  if (!open || isMember) return null;

  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 px-4 py-6 sm:grid sm:place-items-center sm:py-10" role="dialog" aria-modal="true" aria-labelledby="site-intro-modal-title">
    <div className="mx-auto w-full max-w-4xl rounded-[28px] bg-white p-5 shadow-2xl sm:p-8">
      <div className="flex items-start gap-4 border-b border-[var(--jshs-border)] pb-5">
        <span className="jshs-icon-tile mt-1 shrink-0 bg-[var(--jshs-brand-tint)] text-[var(--jshs-primary)]" aria-hidden="true"><SiteIcon name="school" size={24} /></span>
        <div className="min-w-0 flex-1"><p className="jshs-eyebrow">第一次來到這裡</p><h2 id="site-intro-modal-title" className="mt-1 text-2xl md:text-3xl">先了解本站，再開始探索</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">我們希望你安心使用，也清楚知道這些資料的定位。</p></div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">{introCards.map((card) => <article key={card.eyebrow} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><span className="jshs-icon-tile h-10 w-10 text-[var(--jshs-primary)]" aria-hidden="true"><SiteIcon name={card.icon} size={19} /></span><p className="mt-4 text-xs font-black text-[var(--jshs-primary)]">{card.eyebrow}</p><h3 className="mt-1 text-lg">{card.title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{card.body}</p></article>)}</div>
      <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[var(--jshs-border)] pt-5 sm:flex-row sm:items-center"><p className="text-xs leading-5 jshs-muted-copy">未登入時，重新整理頁面會再次顯示；登入會員後不再顯示。</p><button ref={acknowledgeRef} type="button" onClick={() => setOpen(false)} className="px-5 py-3 text-sm jshs-button-primary">我已了解，開始使用</button></div>
    </div>
  </div>;
}
