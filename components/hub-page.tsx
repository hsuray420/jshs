import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export type HubCard = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  status?: string;
}>;

export function HubPage({
  activeHref,
  eyebrow,
  title,
  description,
  cards,
  closingTitle,
  closingDescription,
  closingHref,
  closingAction,
}: {
  activeHref: string;
  eyebrow: string;
  title: string;
  description: string;
  cards: readonly HubCard[];
  closingTitle: string;
  closingDescription: string;
  closingHref: string;
  closingAction: string;
}) {
  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#14213d]">
      <SiteHeader activeHref={activeHref} />
      <section className="border-b border-blue-100 bg-[radial-gradient(circle_at_86%_0%,#dcecff,transparent_32%),linear-gradient(135deg,#fff,#edf5ff)]">
        <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-16 md:py-24">
          <p className="text-xs font-black tracking-[.18em] text-[#2868d7]">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.08] tracking-[-.055em] md:text-7xl">{title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>
        </div>
      </section>

      <section aria-labelledby="hub-actions" className="mx-auto w-[min(1120px,calc(100%-32px))] py-14 md:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-xs font-black tracking-[.16em] text-[#ba6b18]">依任務開始</p><h2 id="hub-actions" className="mt-3 text-4xl font-black tracking-[-.05em]">選擇你現在要完成的事</h2></div>
          <p className="max-w-md leading-7 text-slate-500">每個入口只負責一個主要任務；完成後會引導到下一個決策步驟。</p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10">
              <div className="flex items-center justify-between gap-3"><span className="text-xs font-black tracking-[.14em] text-[#2868d7]">{card.eyebrow}</span>{card.status && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-[#147a67]">{card.status}</span>}</div>
              <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">{card.description}</p>
              <b className="mt-auto pt-8 text-sm text-[#173d78]">{card.action} <span className="inline-block transition group-hover:translate-x-1">→</span></b>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-[#eaf3ff] py-14 md:py-16">
        <div className="mx-auto flex w-[min(1120px,calc(100%-32px))] flex-col justify-between gap-6 rounded-[2rem] bg-[#173d78] p-8 text-white md:flex-row md:items-center md:p-10">
          <div><p className="text-xs font-black tracking-[.16em] text-blue-200">下一步</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-white">{closingTitle}</h2><p className="mt-3 max-w-2xl leading-7 text-blue-100">{closingDescription}</p></div>
          <Link className="shrink-0 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-[#173d78]" href={closingHref}>{closingAction} →</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
