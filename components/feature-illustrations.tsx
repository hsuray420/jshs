import type { FeatureThemeName } from "@/lib/feature-themes";

export type FeatureIllustrationName = "school-search" | "score-calculator" | "planner" | "schedule" | "guide" | "trust";

export function FeatureIllustration({ name, theme, className = "" }: { name: FeatureIllustrationName; theme: FeatureThemeName; className?: string }) {
  const label = { "school-search": "學校、地圖定位與搜尋", "score-calculator": "積分計算與規則確認", planner: "志願排序", schedule: "升學日程", guide: "升學指南", trust: "資料與信任" }[name];
  return <svg className={`jshs-feature-illustration ${className}`} data-theme={theme} viewBox="0 0 360 240" role="img" aria-label={label}>
    <circle className="jshs-illustration-orb" cx="284" cy="76" r="52" /><circle className="jshs-illustration-orb is-small" cx="77" cy="183" r="29" />
    {name === "school-search" ? <><path className="jshs-illustration-fill" d="M84 193V101l96-44 96 44v92H84Z" /><path className="jshs-illustration-line" d="M68 193h224M101 193v-71h158v71M180 57v136M121 144h23m72 0h23m-118 25h23m72 0h23" /><path className="jshs-illustration-accent" d="M260 71c0-19 30-19 30 0 0 20-15 33-15 33s-15-13-15-33Z" /><circle fill="white" cx="275" cy="71" r="5" /></> : null}
    {name === "score-calculator" ? <><rect className="jshs-illustration-fill" x="113" y="41" width="135" height="166" rx="20" /><rect fill="white" x="134" y="64" width="92" height="34" rx="8" /><path className="jshs-illustration-line" d="M145 123h12m23 0h12m-47 25h12m23 0h12m-47 25h12m23 0h12" /><path className="jshs-illustration-accent" d="m246 153 17 17 33-43" /></> : null}
    {name === "planner" ? <><rect className="jshs-illustration-fill" x="78" y="65" width="188" height="128" rx="18" /><path className="jshs-illustration-line" d="M120 98h102M120 128h78M120 158h56" /><circle className="jshs-illustration-accent" cx="100" cy="98" r="10" /><circle className="jshs-illustration-accent" cx="100" cy="128" r="10" /><circle className="jshs-illustration-accent" cx="100" cy="158" r="10" /></> : null}
    {name === "schedule" ? <><rect className="jshs-illustration-fill" x="94" y="51" width="172" height="150" rx="20" /><path className="jshs-illustration-line" d="M94 95h172M130 39v25m100-25v25M126 123h25m33 0h25m-83 42h25m33 0h25" /><circle className="jshs-illustration-accent" cx="236" cy="169" r="19" /></> : null}
    {name === "guide" ? <><path className="jshs-illustration-fill" d="M83 75c41-16 65 1 94 22v100c-29-21-53-38-94-22V75Zm194 0c-41-16-65 1-94 22v100c29-21 53-38 94-22V75Z" /><path className="jshs-illustration-line" d="M180 97v100M105 104c20-7 37 0 54 10m-54 21c20-7 37 0 54 10m76-41c-20-7-37 0-54 10m54 21c-20-7-37 0-54 10" /></> : null}
    {name === "trust" ? <><path className="jshs-illustration-fill" d="M180 39 259 70v57c0 51-36 76-79 92-43-16-79-41-79-92V70l79-31Z" /><path className="jshs-illustration-line" d="m144 126 25 25 48-54" /></> : null}
  </svg>;
}
