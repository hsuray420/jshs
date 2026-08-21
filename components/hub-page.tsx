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
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref={activeHref} />
      <section className="jshs-hero-section">
        <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-16 md:py-24">
          <p className="jshs-eyebrow">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.08] tracking-[-.055em] md:text-7xl">{title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 jshs-muted-copy">{description}</p>
        </div>
      </section>

      <section aria-labelledby="hub-actions" className="mx-auto w-[min(1120px,calc(100%-32px))] py-14 md:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="jshs-eyebrow">依任務開始</p><h2 id="hub-actions" className="mt-3 text-4xl font-black tracking-[-.05em]">選擇你現在要完成的事</h2></div>
          <p className="max-w-md leading-7 jshs-muted-copy">每個入口只負責一個主要任務；完成後會引導到下一個決策步驟。</p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="group flex min-h-72 flex-col p-7 jshs-surface-card">
              <div className="flex items-center justify-between gap-3"><span className="text-xs font-black tracking-[.14em] text-[var(--jshs-primary)]">{card.eyebrow}</span>{card.status && <span className="jshs-chip">{card.status}</span>}</div>
              <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 jshs-muted-copy">{card.description}</p>
              <b className="mt-auto pt-8 text-sm text-[var(--jshs-primary)]">{card.action} <span className="inline-block transition group-hover:translate-x-1">→</span></b>
            </Link>
          ))}
        </div>
      </section>

      <section className="jshs-section-subtle py-14 md:py-16">
        <div className="mx-auto flex w-[min(1120px,calc(100%-32px))] flex-col justify-between gap-6 p-8 md:flex-row md:items-center md:p-10 jshs-surface-card">
          <div><p className="jshs-eyebrow">下一步</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">{closingTitle}</h2><p className="mt-3 max-w-2xl leading-7 jshs-muted-copy">{closingDescription}</p></div>
          <Link className="shrink-0 px-5 py-3.5 text-sm jshs-button-primary" href={closingHref}>{closingAction} →</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
