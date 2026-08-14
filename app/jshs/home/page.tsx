import type { Metadata } from "next";
import districtMetadata from "../../../public/it_hs/district-metadata.json";
import { getFeaturedNews, type NewsArticle } from "@/lib/news";

const homeTitle = "全國國中升學資訊網｜校科查詢、積分試算與志願規劃";
const homeDescription = "整合全台就學區學校資料、積分試算、落點分析與志願規劃；每筆規則標示資料年度、更新日與官方來源。";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/jshs/home" },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/jshs/home",
    siteName: "全國國中升學資訊網",
    title: homeTitle,
    description: homeDescription,
  },
  twitter: {
    card: "summary",
    title: homeTitle,
    description: homeDescription,
  },
};

type District = (typeof districtMetadata.districts)[keyof typeof districtMetadata.districts];

const districts = Object.entries(districtMetadata.districts) as Array<[string, District]>;
const keyTimeline = districtMetadata.timelineDefaults.ready;
const latestNews = getFeaturedNews(3);

function featureLabel(enabled: boolean, label: string) {
  return <span className={enabled ? "bg-emerald-50 text-[#147a67]" : "bg-slate-100 text-slate-500"}>{enabled ? label : `${label}建置中`}</span>;
}

export default function HomePage() {
  return <main className="min-h-screen bg-[#f6f9fd] text-[#14213d]">
    <header className="mx-auto flex w-[min(1160px,calc(100%-32px))] items-center justify-between gap-4 py-5">
      <a className="flex items-center gap-2 font-extrabold tracking-tight" href="#top"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173d78] text-lg text-white">↗</span>全國國中升學資訊網</a>
      <nav className="hidden gap-6 text-sm font-bold text-slate-500 md:flex"><a href="/news">升學情報</a><a href="#districts">選擇就學區</a><a href="#journey">規劃流程</a><a href="#tools">升學工具</a></nav>
      <a className="rounded-xl bg-[#173d78] px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-950/15" href="#districts">開始規劃</a>
    </header>

    <section id="top" className="border-y border-blue-100 bg-[radial-gradient(circle_at_88%_0%,#d9ebff,transparent_30%),linear-gradient(135deg,#fff_0%,#edf5ff_100%)] py-14 md:py-24">
      <div className="mx-auto grid w-[min(1160px,calc(100%-32px))] items-stretch gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_18px_48px_rgba(27,64,120,.11)] backdrop-blur md:p-12">
          <p className="text-xs font-extrabold tracking-[.16em] text-[#2868d7]">全國升學決策服務平台</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.12] tracking-[-.06em] md:text-7xl">不是只看分數，<br/><span className="text-[#2868d7]">而是看清每一步。</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">從就學區、校科資料到積分與志願結構，把複雜規則整理成可討論、可執行的升學策略。</p>
          <div className="mt-8 flex flex-wrap gap-3"><a className="rounded-xl bg-[#173d78] px-5 py-3.5 font-extrabold text-white shadow-lg shadow-blue-950/20" href="#districts">選擇就學區 →</a><a className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-extrabold text-[#173d78]" href="#journey">查看規劃流程</a></div>
        </div>
        <aside className="rounded-3xl bg-[linear-gradient(145deg,#173d78,#2868d7)] p-8 text-white shadow-[0_18px_48px_rgba(23,61,120,.24)] md:p-10">
          <p className="text-xs font-extrabold tracking-[.16em] text-blue-200">你的升學規劃地圖</p>
          <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-.04em]">從一個選擇，<br/>走到一份安心的志願表。</h2>
          <ol className="mt-8 space-y-5 border-l border-blue-300/45 pl-5 text-sm"><li><b className="block text-blue-200">01 · 選擇就學區</b><span className="text-blue-50">確認可使用的學校資料與規則。</span></li><li><b className="block text-blue-200">02 · 建立升學資料</b><span className="text-blue-50">試算積分、理解分數組成。</span></li><li><b className="block text-blue-200">03 · 比較與安排志願</b><span className="text-blue-50">用穩定、適中、挑戰建立結構。</span></li></ol>
        </aside>
      </div>
    </section>

    <section aria-labelledby="news-preview-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-16 md:py-20">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-extrabold tracking-[.16em] text-[#ba6b18]">最新升學情報</p><h2 id="news-preview-title" className="mt-3 text-4xl font-black tracking-[-.05em]">先把規則讀懂，再開始規劃。</h2></div><div className="max-w-md"><p className="leading-7 text-slate-500">以官方資料為底，整理會考時程、就學區與志願策略；每篇都有更新日期與可執行的下一步。</p><a className="mt-3 inline-block text-sm font-black text-[#173d78]" href="/news">前往升學情報中心 →</a></div></div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">{latestNews.map((article) => <NewsPreview key={article.slug} article={article}/>)}</div>
    </section>

    <section id="journey" className="mx-auto w-[min(1160px,calc(100%-32px))] py-16 md:py-20">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-extrabold tracking-[.16em] text-[#2868d7]">升學規劃流程</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">每一步都有清楚的下一步。</h2></div><p className="max-w-md text-slate-500">先選擇地區，再依資料可用狀態進入學校查詢、試算與志願規劃。</p></div>
      <div className="mt-8 grid gap-4 md:grid-cols-4"><Journey number="01" title="選擇地區" body="確認你適用的招生範圍。"/><Journey number="02" title="查詢校科" body="比較學制、名額與特色。"/><Journey number="03" title="試算落點" body="掌握積分與風險區間。"/><Journey number="04" title="完成檢核" body="排定志願與送出前待辦。"/></div>
    </section>

    <section aria-labelledby="timeline-title" className="border-y border-[#dce8f8] bg-white py-16 md:py-20">
      <div className="mx-auto w-[min(1160px,calc(100%-32px))]"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-extrabold tracking-[.16em] text-[#2868d7]">關鍵時程</p><h2 id="timeline-title" className="mt-3 text-4xl font-black tracking-[-.05em]">先記住狀態，再跟著官方時程走。</h2></div><p className="max-w-md text-slate-500">每個就學區的正式日期可能不同；尚未公告的欄位不以預估日期取代。</p></div><div className="mt-8 grid gap-4 md:grid-cols-2">{keyTimeline.map((item) => <article key={item.title} className="rounded-3xl border border-slate-200 bg-[#fbfdff] p-6 shadow-sm"><span className="text-sm font-extrabold text-[#2868d7]">{item.date}</span><h3 className="mt-4 text-xl font-black">{item.title}</h3><p className="mt-2 leading-7 text-slate-500">{item.detail}</p><span className="mt-5 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-[#ba6b18]">{item.status}</span></article>)}</div><p className="mt-5 text-sm text-slate-500">資料更新：{districtMetadata.updatedAt}。{districtMetadata.disclaimer}</p></div>
    </section>

    <section id="districts" className="border-y border-[#dce8f8] bg-white py-16 md:py-20">
      <div className="mx-auto w-[min(1160px,calc(100%-32px))]"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-extrabold tracking-[.16em] text-[#2868d7]">第一步</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">選擇你的就學區</h2></div><p className="max-w-md text-slate-500">所有地區皆可查詢學校資料；已建置規則的地區可接續進行積分與落點分析。</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{districts.map(([code, district]) => <a key={code} className="group rounded-3xl border border-slate-200 bg-[#fbfdff] p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-950/10" href={`/it_hs/it_hs.html?district=${code}#${district.calculator ? "overview" : "schools"}`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-extrabold tracking-[.12em] text-[#2868d7]">{code.toUpperCase()}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{district.academicYear} 學年度</span></div><strong className="mt-4 block text-2xl">{district.label}</strong><small className="mt-1 block min-h-10 text-sm text-slate-500">{district.areas}</small><div className="mt-5 flex flex-wrap gap-2 [&>span]:rounded-full [&>span]:px-2.5 [&>span]:py-1 [&>span]:text-xs [&>span]:font-bold">{featureLabel(district.schools, "學校查詢")}{featureLabel(district.calculator, "積分試算")}{featureLabel(district.analysis, "落點分析")}</div><small className="mt-4 block text-xs text-slate-400">資料更新：{district.updatedAt || districtMetadata.updatedAt}</small><div className="mt-3 flex items-center justify-between text-sm font-extrabold text-[#173d78]"><span>開始規劃</span><span className="transition group-hover:translate-x-1">→</span></div></a>)}</div>
        <p className="mt-6 text-sm text-slate-500">資料更新：{districtMetadata.updatedAt}。{districtMetadata.disclaimer}</p>
      </div>
    </section>

    <section id="tools" className="mx-auto w-[min(1160px,calc(100%-32px))] py-16 md:py-20"><p className="text-xs font-extrabold tracking-[.16em] text-[#2868d7]">依任務開始</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">現在，你想先完成哪一件事？</h2><div className="mt-8 grid gap-4 lg:grid-cols-3"><Tool title="查詢並比較學校" tag="全區資料" body="以學校、科別、地區與特色篩選，將有興趣的校科加入志願。" href="#districts" primary/><Tool title="建立我的積分" tag="依區規則" body="已建置規則的地區，可輸入會考與多元表現查看積分組成。" href="#districts"/><Tool title="整理志願與待辦" tag="本機保存" body="保留志願排序、通勤估計與送出前待辦，不需登入或提供個資。" href="#districts"/></div></section>

    <footer className="border-t border-slate-200 bg-white py-8"><div className="mx-auto flex w-[min(1160px,calc(100%-32px))] flex-col justify-between gap-4 text-sm text-slate-500 md:flex-row"><b className="text-[#14213d]">全國國中升學資訊網</b><a className="font-bold text-[#173d78]" href="/news">升學情報中心</a><span>{districtMetadata.disclaimer}</span></div></footer>
  </main>;
}

function Journey({number, title, body}:{number:string; title:string; body:string}) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-sm font-black text-[#2868d7]">{number}</span><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{body}</p></article>; }
function NewsPreview({article}:{article:NewsArticle}) { return <a href={`/news/${article.slug}`} className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10"><div className="flex items-center justify-between gap-3 text-xs font-black"><span className="text-[#2868d7]">{article.category}</span><span className="text-slate-400">{article.readMinutes} 分鐘</span></div><h3 className="mt-5 text-2xl font-black leading-snug tracking-[-.04em]">{article.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{article.description}</p><b className="mt-auto pt-8 text-sm text-[#173d78]">閱讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></b></a>; }
function Tool({title,tag,body,href,primary=false}:{title:string;tag:string;body:string;href:string;primary?:boolean}) { return <a href={href} className={`min-h-64 rounded-3xl border p-7 transition hover:-translate-y-1 ${primary ? "border-[#173d78] bg-[#173d78] text-white shadow-xl shadow-blue-950/15" : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"}`}><p className={`text-xs font-extrabold tracking-[.12em] ${primary ? "text-blue-200" : "text-[#2868d7]"}`}>{tag}</p><h3 className="mt-4 text-2xl font-black tracking-[-.04em]">{title}</h3><p className={`mt-3 text-sm leading-7 ${primary ? "text-blue-100" : "text-slate-500"}`}>{body}</p><b className={`mt-12 block text-sm ${primary ? "text-white" : "text-[#2868d7]"}`}>選擇就學區 →</b></a>; }
