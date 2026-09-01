"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";

type IntroCard = { icon: SiteIconName; eyebrow: string; title: string; body: string };

const introCards: readonly IntroCard[] = [
  { icon: "shield", eyebrow: "資料查證", title: "依公開與官方來源整理", body: "本站盡力整理公開及官方來源；重要升學決定仍請以招生委員會最新公告為準。" },
  { icon: "sparkle", eyebrow: "公益維護", title: "目前核心功能免費使用", body: "本站目前核心功能可免費使用。若覺得網站有幫助，歡迎轉發給需要的人，或以小額捐款支持維護。" },
  { icon: "knowledge", eyebrow: "社群共建", title: "一起讓資料更完整", body: "如果你發現資料有誤、已經更新，或有值得補充的資訊，歡迎回報給我們。每一次回饋，都能幫助更多家庭找到可靠的升學方向。" },
] as const;

export function SiteIntroModal() {
  const [open, setOpen] = useState(true);
  const acknowledgeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(window.localStorage.getItem("jshs_intro_acknowledged") !== "1"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    acknowledgeRef.current?.focus();
    document.body.classList.add("jshs-intro-modal-open");
    return () => {
      document.body.classList.remove("jshs-intro-modal-open");
      window.setTimeout(() => lastFocusRef.current?.focus(), 0);
    };
  }, [open]);

  if (!open) return null;

  function close() {
    window.localStorage.setItem("jshs_intro_acknowledged", "1");
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])")).filter((item) => !item.hasAttribute("disabled") && item.getAttribute("aria-hidden") !== "true");
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <div id="jshs-intro-modal" ref={dialogRef} className="jshs-intro-backdrop fixed inset-0 z-[100] overflow-y-auto bg-black/40 px-4 py-6 sm:grid sm:place-items-center sm:py-10" role="dialog" aria-modal="true" aria-labelledby="site-intro-modal-title" onKeyDown={onKeyDown}>
    <div className="jshs-intro-dialog mx-auto w-full max-w-4xl rounded-[28px] bg-white p-5 shadow-2xl sm:p-8">
      <div className="flex items-start gap-4 border-b border-[var(--jshs-border)] pb-5">
        <span className="jshs-icon-tile mt-1 shrink-0 bg-[var(--jshs-brand-tint)] text-[var(--jshs-primary)]" aria-hidden="true"><SiteIcon name="school" size={24} /></span>
        <div className="min-w-0 flex-1"><p className="jshs-eyebrow">第一次來到這裡</p><h2 id="site-intro-modal-title" className="mt-1 text-2xl md:text-3xl">先了解本站，再開始探索</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">我們希望你安心使用，也清楚知道這些資料的定位。</p></div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">{introCards.map((card) => <article key={card.eyebrow} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><span className="jshs-icon-tile h-10 w-10 text-[var(--jshs-primary)]" aria-hidden="true"><SiteIcon name={card.icon} size={19} /></span><p className="mt-4 text-xs font-black text-[var(--jshs-primary)]">{card.eyebrow}</p><h3 className="mt-1 text-lg">{card.title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{card.body}</p></article>)}</div>
      <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[var(--jshs-border)] pt-5 sm:flex-row sm:items-center"><p className="text-xs leading-5 jshs-muted-copy">你可以隨時從資料與信任查看來源、年度與校核狀態。</p><button ref={acknowledgeRef} type="button" onClick={close} data-jshs-intro-close className="px-5 py-3 text-sm jshs-button-primary">我已了解，開始使用</button></div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: `(function(){var key="jshs_intro_acknowledged";var root=document.getElementById("jshs-intro-modal");if(!root)return;var last=document.activeElement;function ok(){try{return localStorage.getItem(key)==="1"}catch(e){return false}}function close(){try{localStorage.setItem(key,"1")}catch(e){}root.hidden=true;document.body.classList.remove("jshs-intro-modal-open");if(last&&last.focus)last.focus()}function focusables(){return Array.prototype.slice.call(root.querySelectorAll('a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])')).filter(function(el){return !el.hasAttribute("disabled")&&el.getAttribute("aria-hidden")!=="true"})}if(ok()){root.hidden=true;return}document.body.classList.add("jshs-intro-modal-open");var button=root.querySelector("[data-jshs-intro-close]");if(button)window.setTimeout(function(){button.focus()},0);if(button)button.addEventListener("click",close);root.addEventListener("keydown",function(event){if(event.key==="Escape"){event.preventDefault();close();return}if(event.key!=="Tab")return;var items=focusables();var first=items[0];var lastItem=items[items.length-1];if(!first||!lastItem)return;if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastItem.focus()}else if(!event.shiftKey&&document.activeElement===lastItem){event.preventDefault();first.focus()}})})();` }} />
  </div>;
}
