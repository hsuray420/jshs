import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import { SourceBadge } from "@/components/source-badge";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { PageContainer } from "@/components/ui/layout";
import { HomeProgress } from "@/components/home-progress";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR, VERIFICATION_STATUS } from "@/lib/trust";

const homeTitle = "全國國中升學資訊網｜JSHS";
const homeDescription = "找學校、算成績、規劃志願與掌握升學資訊，讓每一步都更清楚。";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "zh_TW", url: "/", siteName: "全國國中升學資訊網", title: homeTitle, description: homeDescription },
  twitter: { card: "summary", title: homeTitle, description: homeDescription },
};

const officialDistricts = Object.entries(districtMetadata.districts).slice(0, 3);

const tasks: ReadonlyArray<{ icon: SiteIconName; tone: "school" | "score" | "planner" | "guide"; title: string; body: string; href: string }> = [
  { icon: "school", tone: "school", title: "找學校", body: "探索學校、科系與群科", href: "/schools" },
  { icon: "calculator", tone: "score", title: "算成績", body: "依就學區規則試算積分", href: "/tools" },
  { icon: "planner", tone: "planner", title: "我的志願", body: "整理校科與志願順序", href: "/planner" },
  { icon: "knowledge", tone: "guide", title: "升學指南", body: "掌握重要時程與制度", href: "/schedule" },
];

export default function HomePage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/" />
    <section className="jshs-home-hero"><PageContainer className="jshs-home-hero-inner"><div><p className="jshs-eyebrow">{SERVICE_YEAR} 學年度升學規劃</p><h1>找到你的方向，<br />邁向理想的學校！</h1><p className="jshs-muted-copy">從找學校、成績試算到志願規劃，<br className="hidden sm:block" />用清楚的工具陪你完成每一步。</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/schools" className="jshs-button-primary px-5">開始找學校</Link><Link href="/tools" className="jshs-button-secondary px-5">先算成績</Link></div></div><div className="jshs-home-hero-visual"><img src="/images/jshs-home-hero-v1.png" alt="兩位學生走向校園，準備規劃升學方向" /></div></PageContainer></section>
    <PageContainer as="section" className="py-8 md:py-10"><div className="jshs-home-task-grid">{tasks.map((task) => <TaskCard key={task.href} {...task} />)}</div></PageContainer>
    <HomeProgress />
    <PageContainer as="section" aria-labelledby="status-title" className="py-8"><SectionHeading eyebrow="升學資訊" id="status-title" title="讓資料與規則清楚可查" body="資料年度、規則來源與更新狀態都會明確標示。" /><div className="mt-6 grid gap-4 md:grid-cols-3"><article className="p-5 jshs-surface-card"><SourceBadge sourceType="jshs_curated" /><h3 className="mt-3">{SERVICE_YEAR} 學年度服務</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前狀態：{VERIFICATION_STATUS === "awaiting_116_official_release" ? "正式規則待公告" : "已完成校核"}。</p></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="official_based_calculation" /><h3 className="mt-3">試算規則來源</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">目前依 {SOURCE_ACADEMIC_YEAR} 學年度官方規則提供試算參考。</p><Link href="/tools/rules" className="mt-4 inline-block text-sm font-bold">查看積分規則 →</Link></article><article className="p-5 jshs-surface-card"><SourceBadge sourceType="jshs_estimated" /><h3 className="mt-3">15 區都能開始規劃</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">可先選擇就學區、試算成績並建立志願清單。</p><Link href="/districts" className="mt-4 inline-block text-sm font-bold">選擇就學區 →</Link></article></div></PageContainer>
    <section aria-labelledby="official-title" className="jshs-home-news"><PageContainer className="py-8 md:py-10"><SectionHeading eyebrow="官方資訊" id="official-title" title="近期公告與各區入口" body="涉及報名、資格與錄取時，請以官方公告為準。" /><div className="mt-6 grid gap-4 md:grid-cols-3">{officialDistricts.map(([code, district]) => <article key={code} className="p-5 jshs-surface-card"><SourceBadge sourceType="official" /><h3 className="mt-3">{district.label}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{district.sourceName}</p><a href={district.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold">查看官方公告 ↗</a></article>)}</div><Link href="/admission-guides" className="mt-5 inline-block text-sm font-bold">查看全部官方資訊 →</Link></PageContainer></section><SiteFooter />
  </main>;
}

function SectionHeading({ eyebrow, id, title, body }: { eyebrow: string; id: string; title: string; body: string }) {
  return <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="jshs-eyebrow">{eyebrow}</p><h2 id={id} className="mt-2">{title}</h2></div><p className="max-w-md text-sm leading-6 jshs-muted-copy">{body}</p></div>;
}

function TaskCard({ icon, tone, title, body, href }: { icon: SiteIconName; tone: "school" | "score" | "planner" | "guide"; title: string; body: string; href: string }) {
  return <Link href={href} className={`jshs-home-task-card is-${tone}`}><span className="jshs-home-task-icon" aria-hidden="true"><SiteIcon name={icon} size={25} /></span><span><b>{title}</b><small>{body}</small></span><SiteIcon name="chevron-right" size={18} /></Link>;
}
