export const featureThemes = {
  "找學校": "schools",
  "模擬考": "mock-exam",
  "成績分析": "analytics",
  "我的志願": "planner",
  "日程": "schedule",
  "升學指南": "guide",
  "資料與信任": "trust",
  "官方資訊": "official",
} as const;

export type FeatureTheme = (typeof featureThemes)[keyof typeof featureThemes];

export function featureThemeFor(label: string): FeatureTheme {
  return featureThemes[label as keyof typeof featureThemes] || "trust";
}
