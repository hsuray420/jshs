import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedNews, type NewsArticle } from "@/lib/news";
import districtMetadata from "../public/it_hs/district-metadata.json";

const homeTitle = "全國國中升學資訊網｜校科查詢、積分試算與志願規劃";
const homeDescription = "整合全台就學區學校資料、積分試算、落點分析、升學情報與志願規劃；每筆規則標示資料年度、更新日與官方來源。";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: "全國國中升學資訊網",
    title: homeTitle,
    description: homeDescription,
  },
  twitter: { card: "summary", title: homeTitle, description: homeDescription },
};

type District = (typeof districtMetadata.districts)[keyof typeof districtMetadata.districts];
const districts = Object.entries(districtMetadata.districts) as Array<[string, District]>;
const keyTimeline = districtMetadata.timelineDefaults.ready;
const latestNews = getFeaturedNews(3);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f9fd] text-[#14213d]">
      <SiteHeader />

      <section className="border-b border-blue-100 bg-[radial-gradient(circle_at_88%_0%,#d9ebff,transparent_30%),linear-gradient(135deg,#fff_0%,#edf5ff_100%)] py-14 md:py-24">
        <div className="mx-auto grid w-[min(1160px,calc(100%-32px))] items-stretch gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_18px_48px_rgba(27,64,120,.11)] backdrop-blur md:p-12">
            <p className="text-xs font-extrabold tracking-[.16em] text-[#2868d7]">全國升學決策服務平台</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.12] tracking-[-.06em] md:text-7xl">不是只看分數，<br /><span className="text-[#2868d7]">而是看清每一步。</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">從升學情報、就學區與校科資料，到積分工具和志願規劃，把複雜規則整理成可討論、可執行的下一步。</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-xl bg-[#173d78] px-5 py-3.5 font-extrabold text-white shadow-lg shadow-blue-950/20" href="/it_hs/guide.htm#home">選擇就學區 →</Link><Link className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-extrabold text-[#173d78]" href="/news#latest">先看升學情報</Link></div>
          </div>
          <aside className="rounded-3xl bg-[linear-gradient(145deg,#173d78,#2868d7)] p-8 text-white shadow-[0_18px_48px_rgba(23,61,120,.24)] md:p-10">
            <p className="text-xs font-extrabold tracking-[.16em] text-blue-200">你的升學決策路徑</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-.04em] text-white">內容帶你進站，<br />工具陪你完成選擇。</h2>
            <ol className="mt-8 space-y-5 border-l border-blue-300/45 pl-5 text-sm"><li><b className="block text-blue-200">01 · 讀懂規則</b><span className="text-blue-50">從官方來源與適用年度開始。</span></li><li><b className="block text-blue-200">02 · 找到選項</b><span className="text-blue-50">依就學區查學校與校科。</span></li><li><b className="block text-blue-200">03 · 使用工具</b><span className="text-blue-50">比較、試算並整理志願。</span></li><li><b className="block text-blue-200">04 · 留下規劃</b><span className="text-blue-50">把收藏、日期與待辦放在一起。</span></li></ol>
          </aside>
        </div>
      </section>

      <section aria-labelledby="start-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-16 md:py-20">
        <SectionHeading eyebrow="我現在該做什麼" id="start-title" title="從目前最卡住的問題開始" body="首頁不塞滿所有內容，只提供四條清楚路徑，讓你快速進入真正需要的資訊。" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><StartCard number="01" title="還不懂規則" body="先看會考、免試入學與志願策略。" href="/news#latest" action="閱讀升學情報" /><StartCard number="02" title="想找學校" body="從地區、校科與五專路徑開始探索。" href="/it_hs/guide.htm#schools" action="直接查學校" /><StartCard number="03" title="需要試算比較" body="查看積分、落點與比較工具。" href="/it_hs/guide.htm#calculator" action="直接開始試算" /><StartCard number="04" title="已經有候選清單" body="整理收藏、志願、日期與待辦。" href="/it_hs/guide.htm#analysis" action="直接打開規劃" /></div>
      </section>

      <section aria-labelledby="news-preview-title" className="border-y border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]"><SectionHeading eyebrow="最新升學情報" id="news-preview-title" title="先把規則讀懂，再開始規劃。" body="以官方資料為底，整理會考時程、就學區與志願策略；每篇都有更新日期與可執行的下一步。" /><div className="mt-8 grid gap-4 lg:grid-cols-3">{latestNews.map((article) => <NewsPreview key={article.slug} article={article} />)}</div><Link className="mt-7 inline-block text-sm font-black text-[#173d78]" href="/news">前往全部升學情報 →</Link></div>
      </section>

      <section aria-labelledby="timeline-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-16 md:py-20">
        <SectionHeading eyebrow="最新重要時程" id="timeline-title" title="先記住狀態，再跟著官方時程走。" body="每個就學區的正式日期可能不同；尚未公告的欄位不以預估日期取代。" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">{keyTimeline.map((item) => <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-sm font-extrabold text-[#2868d7]">{item.date}</span><h3 className="mt-4 text-xl font-black">{item.title}</h3><p className="mt-2 leading-7 text-slate-500">{item.detail}</p><span className="mt-5 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-[#ba6b18]">{item.status}</span></article>)}</div>
        <Link className="mt-6 inline-block text-sm font-black text-[#173d78]" href="/news/exam">查看完整會考準備 →</Link>
      </section>

      <section id="tools" aria-labelledby="tools-title" className="border-y border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]"><SectionHeading eyebrow="熱門升學工具" id="tools-title" title="把查到的資料，變成可以比較的選項。" body="工具不替你保證錄取；它協助整理積分、風險、通勤與志願結構。" /><div className="mt-8 grid gap-4 lg:grid-cols-3"><ToolCard title="積分與落點" body="依正確就學區和學年度使用完整試算功能。" href="/it_hs/guide.htm#calculator" /><ToolCard title="校科比較" body="直接進入學校查詢，整理候選校科。" href="/it_hs/guide.htm#schools" /><ToolCard title="志願與待辦" body="開啟你原有的志願排序、比較與待辦功能。" href="/it_hs/guide.htm#analysis" /></div></div>
      </section>

      <section id="districts" aria-labelledby="districts-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-16 md:py-20">
        <SectionHeading eyebrow="選擇就學區" id="districts-title" title="全國 15 區，從適用範圍開始。" body="所有地區皆提供學校資料；已建置規則的地區可接續使用積分與落點分析。" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{districts.map(([code, district]) => <a key={code} className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10" href={`/it_hs/guide.htm?district=${code}#schools`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-extrabold tracking-[.12em] text-[#2868d7]">{code.toUpperCase()}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{district.academicYear} 學年度</span></div><strong className="mt-4 block text-2xl">{district.label}</strong><small className="mt-1 block min-h-10 text-sm text-slate-500">{district.areas}</small><b className="mt-5 flex items-center justify-between text-sm text-[#173d78]">直接開啟學校查詢 <span className="transition group-hover:translate-x-1">→</span></b></a>)}</div>
        <Link className="mt-7 inline-block text-sm font-black text-[#173d78]" href="/it_hs/guide.htm#home">直接選擇就學區 →</Link>
      </section>
      <SiteFooter />
    </main>
  );
}

function SectionHeading({ eyebrow, id, title, body }: { eyebrow: string; id: string; title: string; body: string }) {
  return <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-extrabold tracking-[.16em] text-[#2868d7]">{eyebrow}</p><h2 id={id} className="mt-3 text-4xl font-black tracking-[-.05em]">{title}</h2></div><p className="max-w-md leading-7 text-slate-500">{body}</p></div>;
}

function StartCard({ number, title, body, href, action }: { number: string; title: string; body: string; href: string; action: string }) {
  return <Link href={href} className="group flex min-h-60 flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10"><span className="text-sm font-black text-[#2868d7]">{number}</span><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-500">{body}</p><b className="mt-auto pt-6 text-sm text-[#173d78]">{action} <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}

function NewsPreview({ article }: { article: NewsArticle }) {
  return <Link href={`/news/${article.slug}`} className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-[#fbfdff] p-7 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10"><div className="flex items-center justify-between gap-3 text-xs font-black"><span className="text-[#2868d7]">{article.category}</span><span className="text-slate-400">{article.readMinutes} 分鐘</span></div><h3 className="mt-5 text-2xl font-black leading-snug tracking-[-.04em]">{article.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{article.description}</p><b className="mt-auto pt-8 text-sm text-[#173d78]">閱讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}

function ToolCard({ title, body, href }: { title: string; body: string; href: string }) {
  return <Link href={href} className="group rounded-3xl border border-slate-200 bg-[#fbfdff] p-7 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10"><h3 className="text-2xl font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{body}</p><b className="mt-8 block text-sm text-[#173d78]">立即開始 <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}
